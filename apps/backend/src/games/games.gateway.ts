import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { GameService } from './game.service';
import { corsOrigins } from '../common/cors-origins';

@WebSocketGateway({ namespace: '/game', cors: { origin: corsOrigins(), credentials: true } })
export class GamesGateway {
  @WebSocketServer() server!: Server;

  constructor(private readonly game: GameService) {}

  afterInit() {
    this.game.attach(this.server);
  }
}
