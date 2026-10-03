import {Module} from '@nestjs/common'; import {GamesGateway} from './games.gateway'; import {GamesController} from './games.controller'; import {GameService} from './game.service'; import {PrismaService} from '../common/prisma.service';
@Module({controllers:[GamesController],providers:[GamesGateway,GameService,PrismaService],exports:[GameService]}) export class GamesModule{}
