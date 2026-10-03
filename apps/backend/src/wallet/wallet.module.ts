import {Module} from '@nestjs/common'; import {WalletController} from './wallet.controller'; import {PrismaService} from '../common/prisma.service'; import {JwtModule} from '@nestjs/jwt';
@Module({imports:[JwtModule.register({secret:process.env.JWT_SECRET||'change-me-in-development'})],controllers:[WalletController],providers:[PrismaService]}) export class WalletModule{}
