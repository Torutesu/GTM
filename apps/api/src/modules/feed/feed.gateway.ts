import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true },
  namespace: '/feed',
})
export class FeedGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    const tenantId = client.handshake.query.tenantId as string;
    if (tenantId) {
      client.join(`tenant:${tenantId}`);
    }
  }

  handleDisconnect(_client: Socket) {
    // cleanup handled by Socket.IO
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, tenantId: string) {
    client.join(`tenant:${tenantId}`);
  }

  broadcast(tenantId: string, event: Record<string, unknown>) {
    this.server.to(`tenant:${tenantId}`).emit('feed:event', event);
  }
}
