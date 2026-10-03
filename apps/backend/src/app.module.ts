import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GamesModule } from './games/games.module';
import { BetsModule } from './bets/bets.module';
import { WalletModule } from './wallet/wallet.module';
import { AdminModule } from './admin/admin.module';
import { PrismaService } from './common/prisma.service';

@Module({imports:[AuthModule,UsersModule,GamesModule,BetsModule,WalletModule,AdminModule],providers:[PrismaService],exports:[PrismaService]})
export class AppModule {}
