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
    if (!Number.isFinite(stake) || stake <= 0 || stake > 100000) {
      throw new BadRequestException('Monto demo inválido');
    }

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
      const user = await transaction.user.findUnique({ where: { id: userId } });
      if (!user) throw new BadRequestException('Usuario no disponible');
      if (Number(user.demoBalance) < stake) {
        throw new BadRequestException('Saldo demo insuficiente');
      }

      const existingBet = await transaction.bet.findFirst({
        where: { userId, roundId, status: 'OPEN' },
      });
      if (existingBet) {
        throw new BadRequestException('Ya tienes una apuesta preparada para este vuelo');
      }

      await transaction.user.update({
        where: { id: userId },
        data: { demoBalance: { decrement: stake } },
      });
      await transaction.ledgerEntry.create({
        data: { userId, type: 'BET', amount: -stake, reference: roundId },
      });
      return transaction.bet.create({
        data: { userId, roundId, stake: new Prisma.Decimal(stake) },
      });
    });
  }

  async cashout(userId: string, betId: string, requestedMultiplier: number) {
    if (!Number.isFinite(requestedMultiplier)) {
      throw new BadRequestException('Multiplicador de retiro inválido');
    }

    return this.prisma.$transaction(async transaction => {
      const bet = await transaction.bet.findUnique({ where: { id: betId } });
      if (!bet || bet.userId !== userId || bet.status !== 'OPEN') {
        throw new BadRequestException('Apuesta no disponible');
      }

      const round = await transaction.gameRound.findUnique({ where: { id: bet.roundId } });
      if (
        !round ||
        round.status !== 'RUNNING' ||
        !this.game.canCashout(bet.roundId, requestedMultiplier)
      ) {
        throw new BadRequestException('El vuelo terminó o ese multiplicador todavía no está disponible');
      }

      const payout = Number(bet.stake) * requestedMultiplier;
      const update = await transaction.bet.updateMany({
        where: { id: betId, userId, status: 'OPEN' },
        data: { status: 'CASHED_OUT', cashoutAt: requestedMultiplier, payout },
      });
      if (update.count !== 1) {
        throw new BadRequestException('Apuesta no disponible');
      }

      await transaction.user.update({
        where: { id: userId },
        data: { demoBalance: { increment: payout } },
      });
      await transaction.ledgerEntry.create({
        data: { userId, type: 'CASHOUT', amount: payout, reference: betId },
      });
      return { payout, multiplier: requestedMultiplier };
    });
  }
}
