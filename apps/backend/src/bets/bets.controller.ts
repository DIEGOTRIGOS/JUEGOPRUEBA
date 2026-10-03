import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthenticatedUser, BearerAuthGuard } from '../common/auth.guards';
import { BetsService } from './bets.service';

@Controller('bets')
@UseGuards(BearerAuthGuard)
export class BetsController {
  constructor(private readonly bets: BetsService) {}

  @Post()
  place(
    @Req() request: { authUser: AuthenticatedUser },
    @Body() body: { roundId: string; stake: number },
  ) {
    return this.bets.place(request.authUser.id, body.roundId, Number(body.stake));
  }

  @Post('cashout')
  cashout(
    @Req() request: { authUser: AuthenticatedUser },
    @Body() body: { betId: string; multiplier: number },
  ) {
    return this.bets.cashout(request.authUser.id, body.betId, Number(body.multiplier));
  }

  @Get('history')
  history(@Req() request: { authUser: AuthenticatedUser }) {
    return this.bets.history(request.authUser.id);
  }
}
