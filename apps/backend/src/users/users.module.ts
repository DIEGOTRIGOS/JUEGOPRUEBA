import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { BearerAuthGuard } from '../common/auth.guards';
import { PrismaService } from '../common/prisma.service';
import { UsersController } from './users.controller';

@Module({
  imports: [AuthModule, JwtModule.register({ secret: process.env.JWT_SECRET || 'change-me-in-development' })],
  controllers: [UsersController],
  providers: [PrismaService, BearerAuthGuard],
})
export class UsersModule {}
