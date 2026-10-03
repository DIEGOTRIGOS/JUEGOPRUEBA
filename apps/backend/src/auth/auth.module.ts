import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../common/prisma.service';
@Module({imports:[JwtModule.register({secret:process.env.JWT_SECRET||'change-me-in-development',signOptions:{expiresIn:'2h'}})],controllers:[AuthController],providers:[AuthService,PrismaService],exports:[AuthService]})
export class AuthModule {}
