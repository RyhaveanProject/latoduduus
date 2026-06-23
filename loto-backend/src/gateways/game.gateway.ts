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
import { RoomDto } from '../dtos/room.dto';

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
  private readonly roomStartTimeouts = new Map<string, NodeJS.Timeout>();
  private readonly roomNextRoundTimeouts = new Map<string, NodeJS.Timeout>();

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

  private clearStartTimeout(roomId: string) {
    const timer = this.roomStartTimeouts.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.roomStartTimeouts.delete(roomId);
    }
  }

  private clearNextRoundTimeout(roomId: string) {
    const timer = this.roomNextRoundTimeouts.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.roomNextRoundTimeouts.delete(roomId);
    }
  }

  private hasRealPlayers(room: RoomDto): boolean {
    return room.players.some((player) => !player.isBot);
  }

  private async emitTicketsForRoomPlayers(roomId: string, gameId: string) {
    const room = await this.roomsService.getRoomById(roomId);
    for (const player of room.players.filter((player) => !player.isBot)) {
      const tickets = await this.gamesService.getUserTicketsForGame(gameId, player.id);
      this.emitToUser(player.id, 'game:ticket_updated', tickets);
    }
  }

  private async scheduleRoomStart(roomId: string) {
    this.clearStartTimeout(roomId);

    let room = await this.roomsService.getRoomById(roomId);
    if (room.currentGameId || !this.hasRealPlayers(room)) {
      return;
    }

    if (!room.countdownEndsAt) {
      room = await this.roomsService.startCountdown(roomId, 10);
      this.server.to(roomId).emit('room:updated', room);
    }

    const delay = Math.max(0, new Date(room.countdownEndsAt!).getTime() - Date.now());
    const timer = setTimeout(async () => {
      this.roomStartTimeouts.delete(roomId);
      try {
        const latestRoom = await this.roomsService.getRoomById(roomId);
        if (latestRoom.currentGameId || !this.hasRealPlayers(latestRoom)) {
          return;
        }

        const game = await this.gamesService.startGameForRoom(roomId);
        this.server.to(roomId).emit('game:started', game);
        await this.emitRoomState(roomId);
        await this.emitTicketsForRoomPlayers(roomId, game.id);
        this.startAutoDrawLoop(roomId, game.id);
      } catch (error) {
        this.logger.error(this.getErrorMessage(error));
      }
    }, delay);

    this.roomStartTimeouts.set(roomId, timer);
  }

  private scheduleNextRound(roomId: string, delayMs: number = 5000) {
    this.clearNextRoundTimeout(roomId);
    const timer = setTimeout(async () => {
      this.roomNextRoundTimeouts.delete(roomId);
      try {
        const room = await this.roomsService.getRoomById(roomId);
        if (!this.hasRealPlayers(room) || room.currentGameId) {
          return;
        }
        await this.roomsService.startCountdown(roomId, 10);
        await this.emitRoomState(roomId);
        await this.scheduleRoomStart(roomId);
      } catch (error) {
        this.logger.error(this.getErrorMessage(error));
      }
    }, delayMs);

    this.roomNextRoundTimeouts.set(roomId, timer);
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
          const room = await this.emitRoomState(roomId);
          if (this.hasRealPlayers(room)) {
            this.scheduleNextRound(roomId, 5000);
          }
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

      let room = await this.emitRoomState(roomId);
      socket.emit('room:joined', { success: true, room });

      if (socket.userId && room.players.some((player) => player.id === socket.userId && !player.isBot)) {
        const gameId = room.currentGameId;

        if (gameId) {
          const game = await this.gamesService.getGameState(gameId);
          socket.emit('game:started', game);
          const tickets = await this.gamesService.getUserTicketsForGame(gameId, socket.userId);
          socket.emit('game:ticket_updated', tickets);
          await this.emitTicketsForRoomPlayers(roomId, gameId);
          if (game.status !== 'completed') {
            this.startAutoDrawLoop(roomId, gameId);
          }
          return;
        }

        const countdownActive = room.countdownEndsAt && new Date(room.countdownEndsAt).getTime() > Date.now();
        if (!countdownActive) {
          room = await this.roomsService.startCountdown(roomId, 10);
          this.server.to(roomId).emit('room:updated', room);
        }
        await this.scheduleRoomStart(roomId);
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
      const room = await this.emitRoomState(data.roomId);
      if (!this.hasRealPlayers(room) && !room.currentGameId) {
        this.clearStartTimeout(data.roomId);
        this.clearNextRoundTimeout(data.roomId);
      }
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
          const room = await this.emitRoomState(socket.roomId);
          if (this.hasRealPlayers(room)) {
            this.scheduleNextRound(socket.roomId, 5000);
          }
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
