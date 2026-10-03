import {Module} from '@nestjs/common'; import {AdminController} from './admin.controller'; import {PrismaService} from '../common/prisma.service'; import {JwtModule} from '@nestjs/jwt';
@Module({imports:[JwtModule.register({secret:process.env.JWT_SECRET||'change-me-in-development'})],controllers:[AdminController],providers:[PrismaService]}) export class AdminModule{}
