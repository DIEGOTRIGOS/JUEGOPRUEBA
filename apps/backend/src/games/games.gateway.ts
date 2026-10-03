import {WebSocketGateway,WebSocketServer} from '@nestjs/websockets'; import {Server} from 'socket.io'; import {GameService} from './game.service';
@WebSocketGateway({namespace:'/game',cors:{origin:['http://localhost:3000','http://127.0.0.1:3000']}}) export class GamesGateway{ @WebSocketServer() server!:Server; constructor(private g:GameService){} afterInit(){this.g.attach(this.server)} }
