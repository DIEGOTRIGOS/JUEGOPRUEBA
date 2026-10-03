import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BearerAuthGuard } from '../common/auth.guards';
import { PrismaService } from '../common/prisma.service';
import { WalletController } from './wallet.controller';

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET || 'change-me-in-development' })],
  controllers: [WalletController],
  providers: [PrismaService, BearerAuthGuard],
})
export class WalletModule {}
