import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { MessageType } from '@prisma/client';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  handleConnection(client: Socket) {
    const token =
      client.handshake.auth?.token ??
      String(client.handshake.headers?.authorization ?? '').replace(/^Bearer\s+/i, '');
    if (!token) {
      client.disconnect();
      return;
    }
    try {
      const payload = this.jwt.verify<{ sub: number }>(token, {
        secret: this.config.get<string>('jwt.accessSecret'),
      });
      client.data.userId = payload.sub;
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(_client: Socket) {
    /* rooms cleaned by socket.io */
  }

  @SubscribeMessage('joinTransaction')
  async handleJoinTransaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() transactionId: number,
  ) {
    const userId = client.data.userId as number | undefined;
    if (!userId) return;
    try {
      await this.chatService.verifyParticipant(transactionId, userId);
    } catch {
      return;
    }
    void client.join(`transaction:${transactionId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { transactionId: number; content: string; type?: MessageType },
  ) {
    const userId = client.data.userId as number | undefined;
    if (!userId) return;
    const message = await this.chatService.saveMessage(payload.transactionId, userId, {
      content: payload.content,
      type: payload.type ?? MessageType.TEXT,
    });
    this.server.to(`transaction:${payload.transactionId}`).emit('newMessage', message);
    return message;
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() transactionId: number,
  ) {
    client.to(`transaction:${transactionId}`).emit('userTyping', {
      userId: client.data.userId,
    });
  }
}
