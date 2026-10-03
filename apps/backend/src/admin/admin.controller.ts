import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AdminGuard, AuthenticatedUser, BearerAuthGuard } from '../common/auth.guards';
import { PrismaService } from '../common/prisma.service';

const MAX_DEMO_BALANCE = 100000000;

@Controller('admin')
@UseGuards(BearerAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('overview')
  async overview() {
    const [users, activeUsers, rounds, bets, credits] = await Promise.all([
      this.prisma.user.count({ where: { role: 'USER' } }),
      this.prisma.user.count({ where: { role: 'USER', active: true } }),
      this.prisma.gameRound.count(),
      this.prisma.bet.count(),
      this.prisma.user.aggregate({ where: { role: 'USER' }, _sum: { demoBalance: true } }),
    ]);
    return {
      users,
      activeUsers,
      rounds,
      bets,
      demoCreditsInCirculation: credits._sum.demoBalance ?? new Prisma.Decimal(0),
    };
  }

  @Get('users')
  users(@Query('q') query?: string) {
    const q = query?.trim();
    return this.prisma.user.findMany({
      where: q ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        demoBalance: true,
        createdAt: true,
        _count: { select: { bets: true } },
      },
    });
  }

  @Get('ledger')
  ledger() {
    return this.prisma.ledgerEntry.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  @Patch('users/:id/active')
  async setActive(
    @Param('id') id: string,
    @Body() body: { active?: boolean },
  ) {
    if (typeof body.active !== 'boolean') {
      throw new BadRequestException('Indica si la cuenta debe estar activa');
    }
    const result = await this.prisma.user.updateMany({
      where: { id, role: 'USER' },
      data: { active: body.active },
    });
    if (result.count !== 1) throw new NotFoundException('Usuario no encontrado');
    return { id, active: body.active };
  }

  @Post('users/:id/credits')
  async adjustCredits(
    @Param('id') id: string,
    @Body() body: { amount?: number; reason?: string },
    @Req() request: { authUser: AuthenticatedUser },
  ) {
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount === 0 || Math.abs(amount) > 1000000 || Math.round(amount * 100) !== amount * 100) {
      throw new BadRequestException('El ajuste debe ser distinto de cero y tener máximo dos decimales');
    }

    const decimalAmount = new Prisma.Decimal(amount);
    const where = amount > 0
      ? { id, role: 'USER' as const, demoBalance: { lte: new Prisma.Decimal(MAX_DEMO_BALANCE).minus(decimalAmount) } }
      : { id, role: 'USER' as const, demoBalance: { gte: decimalAmount.abs() } };
    const updated = await this.prisma.$transaction(async transaction => {
      const result = await transaction.user.updateMany({
        where,
        data: { demoBalance: { increment: decimalAmount } },
      });
      if (result.count !== 1) return null;

      const reason = typeof body.reason === 'string'
        ? body.reason.trim().slice(0, 100)
        : '';
      await transaction.ledgerEntry.create({
        data: {
          userId: id,
          type: amount > 0 ? 'DEMO_GRANT' : 'REFUND',
          amount: decimalAmount,
          reference: `admin:${request.authUser.id}${reason ? `:${reason}` : ''}`,
        },
      });
      return transaction.user.findUnique({
        where: { id },
        select: { id: true, demoBalance: true },
      });
    });

    if (!updated) throw new BadRequestException('Usuario inexistente o el ajuste supera el saldo permitido');
    return updated;
  }
}
