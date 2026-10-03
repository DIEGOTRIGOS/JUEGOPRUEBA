import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BearerAuthGuard } from '../common/auth.guards';
import { PrismaService } from '../common/prisma.service';
import { GamesModule } from '../games/games.module';
import { BetsController } from './bets.controller';
import { BetsService } from './bets.service';

@Module({
  controllers: [BetsController],
  imports: [
    GamesModule,
    JwtModule.register({ secret: process.env.JWT_SECRET || 'change-me-in-development' }),
  ],
  providers: [BetsService, PrismaService, BearerAuthGuard],
})
export class BetsModule {}
