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
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(GameGateway.name);
  private readonly userSockets = new Map<string, string[]>();
  private readonly roomIntervals = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly gamesService: GamesService,
    private readonly roomsService: RoomsService,
  ) {}

  afterInit() {
    this.logger.log('✅ WebSocket Gateway initialized');
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }

  async handleConnection(socket: AuthenticatedSocket) {
    const userId =
      (socket.handshake.auth?.userId as string | undefined) ||
      (socket.handshake.query.userId as string | undefined);

    if (!userId) {
      socket.disconnect();
      return;
    }

    socket.userId = userId;
    const sockets = this.userSockets.get(userId) || [];
    sockets.push(socket.id);
    this.userSockets.set(userId, sockets);
    socket.emit('connected', { message: 'Connected to game server' });
  }

  async handleDisconnect(socket: AuthenticatedSocket) {
    if (!socket.userId) return;

    const sockets = this.userSockets.get(socket.userId) || [];
    const filtered = sockets.filter((id) => id !== socket.id);
    if (filtered.length > 0) {
      this.userSockets.set(socket.userId, filtered);
    } else {
      this.userSockets.delete(socket.userId);
    }
  }

  private emitToUser(userId: string, event: string, payload: unknown) {
    const socketIds = this.userSockets.get(userId) || [];
    socketIds.forEach((socketId) => this.server.to(socketId).emit(event, payload));
  }

  private async emitRoomState(roomId: string) {
    const room = await this.roomsService.getRoomById(roomId);
    this.server.to(roomId).emit('room:updated', room);
    return room;
  }

  private async emitTicketsForRoomPlayers(roomId: string, gameId: string) {
    const room = await this.roomsService.getRoomById(roomId);
    for (const player of room.players.filter((player) => !player.isBot)) {
      const tickets = await this.gamesService.getUserTicketsForGame(gameId, player.id);
      this.emitToUser(player.id, 'game:ticket_updated', tickets);
    }
  }

  private startAutoDrawLoop(roomId: string, gameId: string) {
    if (this.roomIntervals.has(roomId)) return;

    let busy = false;
    const timer = setInterval(async () => {
      if (busy) return;
      busy = true;
      try {
        const game = await this.gamesService.drawNextNumber(gameId);
        this.server.to(roomId).emit('game:number_drawn', game);
        if (game.status === 'completed') {
          this.server.to(roomId).emit('game:completed', game);
          clearInterval(timer);
          this.roomIntervals.delete(roomId);
          await this.emitRoomState(roomId);
        }
      } catch (error) {
        clearInterval(timer);
        this.roomIntervals.delete(roomId);
        this.logger.error(this.getErrorMessage(error));
      } finally {
        busy = false;
      }
    }, 3500);

    this.roomIntervals.set(roomId, timer);
  }

  @SubscribeMessage('room:join')
  async handleJoinRoom(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId } = data;
    try {
      socket.join(roomId);
      socket.roomId = roomId;

      const room = await this.emitRoomState(roomId);
      socket.emit('room:joined', { success: true, room });

      if (socket.userId && room.players.some((player) => player.id === socket.userId && !player.isBot)) {
        let gameId = room.currentGameId;
        if (!gameId && room.status === 'active') {
          const game = await this.gamesService.startGameForRoom(roomId);
          gameId = game.id;
          this.server.to(roomId).emit('game:started', game);
          await this.emitRoomState(roomId);
        }

        if (gameId) {
          const game = await this.gamesService.getGameState(gameId);
          socket.emit('game:started', game);
          const tickets = await this.gamesService.getUserTicketsForGame(gameId, socket.userId);
          socket.emit('game:ticket_updated', tickets);
          await this.emitTicketsForRoomPlayers(roomId, gameId);
          if (game.status !== 'completed') {
            this.startAutoDrawLoop(roomId, gameId);
          }
        }
      }
    } catch (error) {
      socket.emit('error', {
        message: 'Failed to join room channel',
        error: this.getErrorMessage(error),
      });
    }
  }

  @SubscribeMessage('room:leave')
  async handleLeaveRoom(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    try {
      if (socket.userId) {
        await this.roomsService.leaveRoom(data.roomId, socket.userId);
      }
      socket.leave(data.roomId);
      socket.emit('room:left', { success: true });
      await this.emitRoomState(data.roomId);
    } catch (error) {
      socket.emit('error', {
        message: 'Failed to leave room',
        error: this.getErrorMessage(error),
      });
    }
  }

  @SubscribeMessage('game:mark_number')
  async handleMarkNumber(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { gameId: string; ticketId: string; number: number },
  ) {
    try {
      if (!socket.userId) {
        socket.emit('error', { message: 'User not authenticated' });
        return;
      }

      const result = await this.gamesService.markTicketNumber(
        data.gameId,
        socket.userId,
        data.ticketId,
        data.number,
      );

      socket.emit('game:ticket_updated', result.tickets);
      this.server.to(socket.roomId || '').emit('game:number_marked', {
        userId: socket.userId,
        number: data.number,
      });

      if (result.completed) {
        this.server.to(socket.roomId || '').emit('game:completed', result.game);
        const timer = this.roomIntervals.get(socket.roomId || '');
        if (timer) {
          clearInterval(timer);
          this.roomIntervals.delete(socket.roomId || '');
        }
        if (socket.roomId) {
          await this.emitRoomState(socket.roomId);
        }
      }
    } catch (error) {
      socket.emit('error', {
        message: 'Failed to mark number',
        error: this.getErrorMessage(error),
      });
    }
  }

  @SubscribeMessage('room:message')
  async handleSendMessage(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; message: string },
  ) {
    try {
      if (!socket.userId) {
        socket.emit('error', { message: 'User not authenticated' });
        return;
      }
      const room = await this.roomsService.sendMessage(data.roomId, data as any, socket.userId);
      this.server.to(data.roomId).emit('room:message', room.messages[room.messages.length - 1]);
    } catch (error) {
      socket.emit('error', {
        message: 'Failed to send message',
        error: this.getErrorMessage(error),
      });
    }
  }
}
