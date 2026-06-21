import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { Logger } from '@nestjs/common';
import { GamesService } from '../modules/games/games.service';
import { RoomsService } from '../modules/rooms/rooms.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  roomId?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
})
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(GameGateway.name);
  private userSockets = new Map<string, string[]>();

  constructor(
    private gamesService: GamesService,
    private roomsService: RoomsService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('✅ WebSocket Gateway initialized');
  }

  async handleConnection(socket: AuthenticatedSocket) {
    const token = socket.handshake.auth.token;
    const userId = socket.handshake.query.userId as string;

    if (!userId) {
      socket.disconnect();
      return;
    }

    socket.userId = userId;
    const sockets = this.userSockets.get(userId) || [];
    sockets.push(socket.id);
    this.userSockets.set(userId, sockets);

    this.logger.log(`👤 User ${userId} connected: ${socket.id}`);
    socket.emit('connected', { message: 'Connected to game server' });
  }

  async handleDisconnect(socket: AuthenticatedSocket) {
    if (socket.userId) {
      const sockets = this.userSockets.get(socket.userId) || [];
      const filtered = sockets.filter((id) => id !== socket.id);

      if (filtered.length > 0) {
        this.userSockets.set(socket.userId, filtered);
      } else {
        this.userSockets.delete(socket.userId);
      }

      if (socket.roomId) {
        this.server.to(socket.roomId).emit('user-disconnected', {
          userId: socket.userId,
          message: `User ${socket.userId} disconnected`,
        });
      }

      this.logger.log(`👤 User ${socket.userId} disconnected`);
    }
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId } = data;
    const userId = socket.userId;

    try {
      const room = await this.roomsService.getRoomById(roomId);

      socket.join(roomId);
      socket.roomId = roomId;

      this.server.to(roomId).emit('player-joined', {
        userId,
        roomId,
        currentPlayers: room.currentPlayers,
        maxPlayers: room.maxPlayers,
      });

      socket.emit('room-joined', {
        success: true,
        room,
      });

      this.logger.log(`🎮 User ${userId} joined room ${roomId}`);
    } catch (error) {
      socket.emit('error', {
        message: 'Failed to join room',
        error: error.message,
      });
    }
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId } = data;
    const userId = socket.userId;

    try {
      await this.roomsService.leaveRoom(roomId, userId);

      socket.leave(roomId);

      this.server.to(roomId).emit('player-left', {
        userId,
        roomId,
      });

      socket.emit('room-left', { success: true });

      this.logger.log(`🎮 User ${userId} left room ${roomId}`);
    } catch (error) {
      socket.emit('error', {
        message: 'Failed to leave room',
        error: error.message,
      });
    }
  }

  @SubscribeMessage('draw-number')
  async handleDrawNumber(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { gameId: string; drawIndex: number },
  ) {
    const { gameId, drawIndex } = data;
    const roomId = socket.roomId;

    try {
      const drawnNumber = await this.gamesService.drawNumber(gameId, drawIndex);
      const gameState = await this.gamesService.getGameState(gameId);

      this.server.to(roomId).emit('number-drawn', {
        number: drawnNumber,
        drawIndex,
        gameState,
      });

      this.logger.log(`🎲 Number ${drawnNumber} drawn in game ${gameId}`);
    } catch (error) {
      socket.emit('error', {
        message: 'Failed to draw number',
        error: error.message,
      });
    }
  }

  @SubscribeMessage('check-card')
  async handleCheckCard(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { gameId: string; ticketId: string },
  ) {
    const { gameId, ticketId } = data;

    try {
      const ticket = await this.gamesService.getUserTicketForGame(
        gameId,
        socket.userId,
      );

      if (!ticket) {
        socket.emit('error', { message: 'Ticket not found' });
        return;
      }

      const completionPercentage = 100; // Calculate actual percentage

      socket.emit('card-checked', {
        ticketId,
        completionPercentage,
        stage1Completed: ticket.stage1Completed,
        stage2Completed: ticket.stage2Completed,
        stage3Completed: ticket.stage3Completed,
      });
    } catch (error) {
      socket.emit('error', {
        message: 'Failed to check card',
        error: error.message,
      });
    }
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; message: string },
  ) {
    const { roomId, message } = data;
    const userId = socket.userId;

    if (message.length > 500) {
      socket.emit('error', { message: 'Message too long' });
      return;
    }

    this.server.to(roomId).emit('message-sent', {
      userId,
      message,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('game-ended')
  async handleGameEnded(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { gameId: string; roomId: string },
  ) {
    const { gameId, roomId } = data;

    try {
      const gameState = await this.gamesService.getGameState(gameId);

      this.server.to(roomId).emit('game-completed', {
        gameState,
        stage1Winners: gameState.stage1Winners,
        stage2Winners: gameState.stage2Winners,
        stage3Winners: gameState.stage3Winners,
      });

      this.logger.log(`🏁 Game ${gameId} completed`);
    } catch (error) {
      socket.emit('error', {
        message: 'Failed to complete game',
        error: error.message,
      });
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() socket: AuthenticatedSocket): void {
    socket.emit('pong', { timestamp: Date.now() });
  }
}
