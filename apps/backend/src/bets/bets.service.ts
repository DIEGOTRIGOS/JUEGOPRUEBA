import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { GameService } from '../games/game.service';

@Injectable()
export class BetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly game: GameService,
  ) {}

  async place(userId: string, roundId: string, stake: number) {
    if (!Number.isFinite(stake) || stake < 1 || stake > 100000 || Math.round(stake * 100) !== stake * 100) {
      throw new BadRequestException('Monto demo inválido');
    }
    const amount = new Prisma.Decimal(stake);

    return this.prisma.$transaction(async transaction => {
      // Lock the waiting round while placing the wager. The game loop then either
      // starts after this transaction commits or closes betting before this check.
      const openRound = await transaction.gameRound.updateMany({
        where: { id: roundId, status: 'WAITING' },
        data: { status: 'WAITING' },
      });
      if (openRound.count !== 1) {
        throw new BadRequestException('Las apuestas de este vuelo ya están cerradas');
      }

      const existingBet = await transaction.bet.findFirst({
        where: { userId, roundId, status: 'OPEN' },
      });
      if (existingBet) {
        throw new BadRequestException('Ya tienes una apuesta preparada para este vuelo');
      }

      const debit = await transaction.user.updateMany({
        where: { id: userId, active: true, demoBalance: { gte: amount } },
        data: { demoBalance: { decrement: amount } },
      });
      if (debit.count !== 1) {
        throw new BadRequestException('Saldo demo insuficiente o cuenta no disponible');
      }

      await transaction.ledgerEntry.create({
        data: { userId, type: 'BET', amount: amount.negated(), reference: roundId },
      });
      const bet = await transaction.bet.create({
        data: { userId, roundId, stake: amount },
      });
      const user = await transaction.user.findUniqueOrThrow({
        where: { id: userId },
        select: { demoBalance: true },
      });
      return { bet, demoBalance: user.demoBalance };
    });
  }

  async cashout(userId: string, betId: string, requestedMultiplier: number) {
    if (!Number.isFinite(requestedMultiplier) || requestedMultiplier < 1 || Math.round(requestedMultiplier * 100) !== requestedMultiplier * 100) {
      throw new BadRequestException('Multiplicador de retiro inválido');
    }

    return this.prisma.$transaction(async transaction => {
      const bet = await transaction.bet.findUnique({ where: { id: betId } });
      if (!bet || bet.userId !== userId || bet.status !== 'OPEN') {
        throw new BadRequestException('Apuesta no disponible');
      }

      // The row lock makes cashout and the crash transition serialize in Postgres.
      const runningRound = await transaction.gameRound.updateMany({
        where: { id: bet.roundId, status: 'RUNNING' },
        data: { status: 'RUNNING' },
      });
      if (
        runningRound.count !== 1 ||
        !this.game.canCashout(bet.roundId, requestedMultiplier)
      ) {
        throw new BadRequestException('El vuelo terminó o ese multiplicador todavía no está disponible');
      }

      const payout = new Prisma.Decimal(bet.stake)
        .mul(requestedMultiplier)
        .toDecimalPlaces(2);
      const update = await transaction.bet.updateMany({
        where: { id: betId, userId, status: 'OPEN' },
        data: { status: 'CASHED_OUT', cashoutAt: new Prisma.Decimal(requestedMultiplier), payout },
      });
      if (update.count !== 1) {
        throw new BadRequestException('Apuesta no disponible');
      }

      const user = await transaction.user.update({
        where: { id: userId },
        data: { demoBalance: { increment: payout } },
        select: { demoBalance: true },
      });
      await transaction.ledgerEntry.create({
        data: { userId, type: 'CASHOUT', amount: payout, reference: betId },
      });
      return { payout, multiplier: requestedMultiplier, demoBalance: user.demoBalance };
    });
  }

  async history(userId: string) {
    return this.prisma.bet.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: {
        id: true,
        status: true,
        stake: true,
        cashoutAt: true,
        payout: true,
        createdAt: true,
        round: { select: { id: true, sequence: true, status: true, crashMultiplier: true } },
      },
    });
  }
}
