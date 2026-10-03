import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminGuard, BearerAuthGuard } from '../common/auth.guards';
import { PrismaService } from '../common/prisma.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET || 'change-me-in-development' })],
  controllers: [AdminController],
  providers: [PrismaService, BearerAuthGuard, AdminGuard],
})
export class AdminModule {}
