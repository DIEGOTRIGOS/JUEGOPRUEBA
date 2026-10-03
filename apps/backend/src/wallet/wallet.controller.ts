import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthenticatedUser, BearerAuthGuard } from '../common/auth.guards';
import { PrismaService } from '../common/prisma.service';

const MAX_DEMO_REFILL = 1000000;
const DEMO_BALANCE_CAP = 100000000;

@Controller('wallet')
@UseGuards(BearerAuthGuard)
export class WalletController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async get(@Req() request: { authUser: AuthenticatedUser }) {
    const [user, ledger] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: request.authUser.id },
        select: { demoBalance: true },
      }),
      this.prisma.ledgerEntry.findMany({
        where: { userId: request.authUser.id },
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: { id: true, type: true, amount: true, reference: true, createdAt: true },
      }),
    ]);

    if (!user) throw new BadRequestException('Cuenta no disponible');
    return { demoBalance: user.demoBalance, ledger };
  }

  @Post('demo-credit')
  async refill(
    @Req() request: { authUser: AuthenticatedUser },
    @Body() body: { amount?: number },
  ) {
    const userId = request.authUser.id;
    const requestedAmount = body?.amount;
    if (
      typeof requestedAmount !== 'number' ||
      !Number.isFinite(requestedAmount) ||
      requestedAmount < 1 ||
      requestedAmount > MAX_DEMO_REFILL ||
      Math.round(requestedAmount * 100) !== requestedAmount * 100
    ) {
      throw new BadRequestException('Elige una recarga entre 1 y 1.000.000 créditos, con hasta dos decimales');
    }
    const amount = new Prisma.Decimal(requestedAmount);
    const credited = await this.prisma.$transaction(async transaction => {
      const before = await transaction.user.findUnique({
        where: { id: userId },
        select: { demoBalance: true },
      });
      if (!before) throw new BadRequestException('Cuenta no disponible');
      if (new Prisma.Decimal(before.demoBalance).plus(amount).gt(DEMO_BALANCE_CAP)) {
        throw new BadRequestException('La recarga supera el saldo máximo de 100.000.000 créditos demo');
      }

      const updated = await transaction.user.updateMany({
        where: {
          id: userId,
          demoBalance: before.demoBalance,
        },
        data: { demoBalance: { increment: amount } },
      });
      if (updated.count !== 1) {
        throw new BadRequestException('El saldo cambió durante la recarga. Actualiza e inténtalo de nuevo.');
      }

      await transaction.ledgerEntry.create({
        data: {
          userId,
          type: 'DEMO_GRANT',
          amount,
          reference: 'Recarga de práctica',
        },
      });
      const user = await transaction.user.findUniqueOrThrow({
        where: { id: userId },
        select: { demoBalance: true },
      });
      return { demoBalance: user.demoBalance, amount };
    });

    return credited;
  }
}
