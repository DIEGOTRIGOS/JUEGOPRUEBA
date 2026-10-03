import { Injectable, OnModuleInit } from '@nestjs/common';
import { createHash, createHmac, randomBytes } from 'crypto';
import { Server } from 'socket.io';
import { PrismaService } from '../common/prisma.service';

type RoundState = {
  id: string;
  sequence: number;
  status: 'WAITING' | 'RUNNING' | 'CRASHED';
  serverSeedHash: string;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  crashMultiplier?: number;
};

const BETTING_SECONDS = 60;
const TICK_MS = 100;
const NEXT_ROUND_DELAY_MS = 1200;

@Injectable()
export class GameService implements OnModuleInit {
  private io?: Server;
  private currentRound: RoundState | null = null;
  private currentMultiplier = 1;
  private sequence = 0;
  private bettingEndsAt = 0;

  constructor(private readonly prisma: PrismaService) {}

  attach(io: Server) {
    this.io = io;
  }

  snapshot() {
    if (!this.currentRound) return null;
    return {
      id: this.currentRound.id,
      sequence: this.currentRound.sequence,
      status: this.currentRound.status,
      serverSeedHash: this.currentRound.serverSeedHash,
      seconds: this.currentRound.status === 'WAITING'
        ? Math.max(0, Math.ceil((this.bettingEndsAt - Date.now()) / 1000))
        : 0,
      multiplier: this.currentMultiplier,
      crashMultiplier: this.currentRound.crashMultiplier,
    };
  }

  async onModuleInit() {
    this.sequence = (await this.prisma.gameRound.findFirst({ orderBy: { sequence: 'desc' } }))?.sequence ?? 0;
    setTimeout(() => void this.runLoop(), 1000);
  }

  /** A cashout is valid only for the active flight and at or below the server's latest tick. */
  canCashout(roundId: string, requestedMultiplier: number) {
    return Boolean(
      this.currentRound &&
      this.currentRound.id === roundId &&
      this.currentRound.status === 'RUNNING' &&
      Number.isFinite(requestedMultiplier) &&
      requestedMultiplier >= 1 &&
      requestedMultiplier <= this.currentMultiplier,
    );
  }

  private async runLoop() {
    const round = await this.createRound();
    this.currentRound = round;
    this.currentMultiplier = 1;

    await this.openBetting(round);
    await this.startRound(round);
    await this.runFlight(round);

    setTimeout(() => void this.runLoop(), NEXT_ROUND_DELAY_MS);
  }

  private async createRound(): Promise<RoundState> {
    const serverSeed = randomBytes(32).toString('hex');
    const clientSeed = 'demo-client-seed';
    const nonce = this.sequence + 1;
    const serverSeedHash = createHash('sha256').update(serverSeed).digest('hex');
    const created = await this.prisma.gameRound.create({
      data: {
        sequence: ++this.sequence,
        status: 'WAITING',
        serverSeedHash,
        serverSeed,
        clientSeed,
        nonce,
      },
    });

    return {
      id: created.id,
      sequence: created.sequence,
      status: 'WAITING',
      serverSeedHash,
      serverSeed,
      clientSeed,
      nonce,
    };
  }

  private async openBetting(round: RoundState) {
    this.bettingEndsAt = Date.now() + BETTING_SECONDS * 1000;
    for (let seconds = BETTING_SECONDS; seconds > 0; seconds -= 1) {
      const event = seconds === BETTING_SECONDS ? 'round:waiting' : 'round:countdown';
      this.io?.emit(event, {
        id: round.id,
        sequence: round.sequence,
        status: 'WAITING',
        seconds,
        serverSeedHash: round.serverSeedHash,
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  private async startRound(round: RoundState) {
    await this.prisma.gameRound.update({
      where: { id: round.id },
      data: { status: 'RUNNING', startedAt: new Date() },
    });
    this.currentRound = { ...round, status: 'RUNNING' };
    this.currentMultiplier = 1;
    this.io?.emit('round:start', {
      id: round.id,
      sequence: round.sequence,
      status: 'RUNNING',
      serverSeedHash: round.serverSeedHash,
    });
  }

  private getCrashMultiplier(serverSeed: string, clientSeed: string, nonce: number) {
    const hash = createHmac('sha256', serverSeed).update(`${clientSeed}:${nonce}`).digest('hex');
    const value = parseInt(hash.slice(0, 13), 16);
    // 13 hexadecimal digits carry 52 bits; use their full range to avoid
    // truncating every crash point below 2x.
    const uniform = value / 0x10000000000000;
    const raw = 0.99 / (1 - uniform);
    return Math.max(1, Math.floor(raw * 100) / 100);
  }

  private async runFlight(round: RoundState) {
    const crashMultiplier = this.getCrashMultiplier(round.serverSeed, round.clientSeed, round.nonce);
    let multiplier = 1;

    while (multiplier < crashMultiplier) {
      await new Promise(resolve => setTimeout(resolve, TICK_MS));
      multiplier = Math.min(crashMultiplier, Math.floor((multiplier + 0.01 + multiplier * 0.018) * 100) / 100);
      this.currentMultiplier = multiplier;
      this.io?.emit('round:tick', { id: round.id, multiplier });
    }

    // Close the cashout window before any database await so a late request cannot pay after a crash.
    this.currentRound = { ...round, status: 'CRASHED' };
    await this.prisma.gameRound.update({
      where: { id: round.id },
      data: { status: 'CRASHED', crashMultiplier, crashedAt: new Date() },
    });
    await this.prisma.bet.updateMany({
      where: { roundId: round.id, status: 'OPEN' },
      data: { status: 'LOST' },
    });
    this.currentRound = { ...round, status: 'CRASHED', crashMultiplier };
    this.io?.emit('round:crash', {
      id: round.id,
      sequence: round.sequence,
      status: 'CRASHED',
      multiplier: crashMultiplier,
      serverSeed: round.serverSeed,
      clientSeed: round.clientSeed,
      nonce: round.nonce,
    });
  }

  async history() {
    const rounds = await this.prisma.gameRound.findMany({
      where: { status: 'CRASHED' },
      orderBy: { sequence: 'desc' },
      take: 20,
      select: {
        id: true,
        sequence: true,
        status: true,
        crashMultiplier: true,
        serverSeedHash: true,
        serverSeed: true,
        clientSeed: true,
        nonce: true,
        createdAt: true,
      },
    });

    // Never disclose the active round's server seed through the history endpoint.
    return rounds.map(round => ({
      ...round,
      serverSeed: round.status === 'CRASHED' ? round.serverSeed : null,
    }));
  }
}
