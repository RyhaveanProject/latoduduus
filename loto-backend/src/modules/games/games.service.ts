import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Game, GameDocument } from '../../schemas/game.schema';
import { Ticket, TicketDocument } from '../../schemas/ticket.schema';
import { Room, RoomDocument } from '../../schemas/room.schema';
import { GameEngineService } from '../../services/game-engine.service';
import { CreateGameDto, GameStateDto } from '../../dtos/game.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class GamesService {
  constructor(
    @InjectModel(Game.name) private gameModel: Model<GameDocument>,
    @InjectModel(Ticket.name) private ticketModel: Model<TicketDocument>,
    @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
    private gameEngineService: GameEngineService,
    private usersService: UsersService,
  ) {}

  async createGame(createGameDto: CreateGameDto): Promise<GameStateDto> {
    return this.startGameForRoom(createGameDto.roomId);
  }

  async startGameForRoom(roomId: string): Promise<GameStateDto> {
    const room = await this.roomModel.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.currentGameId) {
      return this.getGameState(room.currentGameId);
    }

    const participantIds = [...room.players, ...(room.botProfiles || []).map((bot) => bot.id)];
    if (participantIds.length === 0) {
      throw new ConflictException('Otaqda iştirakçı yoxdur');
    }

    const drawNumbers = this.gameEngineService.generateDrawSequence();
    const game = new this.gameModel({
      roomId,
      drawNumbers,
      drawnNumbers: [],
      currentDrawIndex: 0,
      currentNumber: null,
      status: 'ongoing',
      totalPool: participantIds.length * room.entryFee,
      commissionRate: 0.08,
      startedAt: new Date(),
    });
    await game.save();

    for (const realUserId of room.players) {
      await this.usersService.deductBalance(
        realUserId,
        room.entryFee,
        `Loto oyunu giriş məbləği (${room.name})`,
      );
      await this.createParticipantTicketSet(game._id as string, room, realUserId, false);
    }

    for (const bot of room.botProfiles || []) {
      await this.createParticipantTicketSet(game._id as string, room, bot.id, true, bot.name);
    }

    room.currentGameId = game._id as string;
    room.status = 'active';
    room.totalPrizePool = game.totalPool;
    room.currentPlayers = participantIds.length;
    room.countdownStartedAt = undefined;
    room.countdownEndsAt = undefined;
    await room.save();

    return this.getGameState(game._id as string);
  }

  private async createParticipantTicketSet(
    gameId: string,
    room: RoomDocument,
    userId: string,
    isBot: boolean,
    displayName?: string,
  ) {
    const existing = await this.ticketModel.find({ gameId, userId }).sort({ boardIndex: 1 });
    if (existing.length > 0) {
      return existing;
    }

    const tickets: Ticket[] = [];
    for (let boardIndex = 0; boardIndex < 3; boardIndex++) {
      const ticket = new this.ticketModel({
        userId,
        gameId,
        roomId: room._id,
        isBot,
        displayName,
        boardIndex,
        card: this.gameEngineService.generateCard(),
        markedNumbers: [],
        entryFee: room.entryFee,
        status: 'active',
      });
      tickets.push(await ticket.save());
    }
    return tickets;
  }

  async generateTicket(gameId: string, userId: string) {
    const existing = await this.ticketModel.find({ gameId, userId }).sort({ boardIndex: 1 });
    if (existing.length > 0) {
      return existing;
    }

    const game = await this.gameModel.findById(gameId);
    if (!game) {
      throw new NotFoundException('Game not found');
    }
    const room = await this.roomModel.findById(game.roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    await this.usersService.deductBalance(userId, room.entryFee, `Loto oyunu giriş məbləği (${room.name})`);
    room.totalPrizePool += room.entryFee;
    await room.save();
    game.totalPool += room.entryFee;
    await game.save();

    return this.createParticipantTicketSet(gameId, room, userId, false);
  }

  async drawNextNumber(gameId: string): Promise<GameStateDto> {
    const game = await this.gameModel.findById(gameId);
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (game.status === 'completed') {
      return this.getGameState(gameId);
    }

    if (game.currentDrawIndex >= game.drawNumbers.length) {
      game.status = 'completed';
      game.completedAt = new Date();
      await game.save();
      return this.getGameState(gameId);
    }

    const drawnNumber = game.drawNumbers[game.currentDrawIndex];
    game.currentNumber = drawnNumber;
    game.currentDrawIndex += 1;
    game.drawnNumbers.push(drawnNumber);
    await game.save();

    const botTickets = await this.ticketModel.find({ gameId, isBot: true, status: 'active' }).sort({ createdAt: 1 });
    for (const ticket of botTickets) {
      const { marked, markedNumbers } = this.gameEngineService.markNumber(ticket as any, drawnNumber);
      if (marked) {
        ticket.markedNumbers = markedNumbers;
        await ticket.save();
      }

      if (this.gameEngineService.isFullCardCompleted(ticket as any)) {
        await this.completeGame(gameId, {
          winnerId: ticket.userId,
          winnerType: 'bot',
          winnerTicketId: String(ticket._id),
        });
        break;
      }
    }

    return this.getGameState(gameId);
  }

  async markTicketNumber(gameId: string, userId: string, ticketId: string, number: number) {
    const game = await this.gameModel.findById(gameId);
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (!game.drawnNumbers.includes(number)) {
      throw new BadRequestException('Bu daş hələ açılmayıb');
    }

    const ticket = await this.ticketModel.findOne({ _id: ticketId, gameId, userId, isBot: false });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const { marked, markedNumbers } = this.gameEngineService.markNumber(ticket as any, number);
    if (!marked) {
      throw new BadRequestException('Bu daş artıq qeyd olunub və ya kartınızda yoxdur');
    }

    ticket.markedNumbers = markedNumbers;
    await ticket.save();

    let completed = false;
    if (this.gameEngineService.isFullCardCompleted(ticket as any)) {
      completed = true;
      await this.completeGame(gameId, {
        winnerId: userId,
        winnerType: 'real',
        winnerTicketId: String(ticket._id),
      });
    }

    return {
      tickets: await this.getUserTicketsForGame(gameId, userId),
      completed,
      game: await this.getGameState(gameId),
    };
  }

  async getGameState(gameId: string): Promise<GameStateDto> {
    const game = await this.gameModel.findById(gameId);
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    return {
      id: String(game._id),
      roomId: game.roomId,
      status: game.status,
      drawNumbers: game.drawNumbers,
      drawnNumbers: game.drawnNumbers || [],
      currentDrawIndex: game.currentDrawIndex || 0,
      currentNumber: game.currentNumber,
      totalPool: game.totalPool,
      commissionRate: game.commissionRate,
      commissionAmount: game.commissionAmount || 0,
      payoutAmount: game.payoutAmount || 0,
      winnerId: game.winnerId,
      winnerType: game.winnerType,
      winnerName: game.winnerName,
      completedAt: game.completedAt,
    };
  }

  async getGameTickets(gameId: string) {
    return this.ticketModel.find({ gameId }).sort({ userId: 1, boardIndex: 1 });
  }

  async getUserTicketForGame(gameId: string, userId: string) {
    return this.ticketModel.findOne({ gameId, userId }).sort({ boardIndex: 1 });
  }

  async getUserTicketsForGame(gameId: string, userId: string) {
    return this.ticketModel.find({ gameId, userId }).sort({ boardIndex: 1 });
  }

  private async resolveWinnerName(
    room: RoomDocument,
    winner: { winnerId: string; winnerType: 'real' | 'bot' },
  ): Promise<string> {
    if (winner.winnerType === 'bot') {
      return room.botProfiles.find((bot) => bot.id === winner.winnerId)?.name || 'Qalib';
    }

    const user = await this.usersService.getUserById(winner.winnerId);
    return user.firstName || user.email || 'Qalib';
  }

  async completeGame(
    gameId: string,
    winner?: { winnerId: string; winnerType: 'real' | 'bot'; winnerTicketId: string },
  ): Promise<GameStateDto> {
    const game = await this.gameModel.findById(gameId);
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (game.status === 'completed') {
      return this.getGameState(gameId);
    }

    if (!winner) {
      throw new BadRequestException('Winner is required to complete the game');
    }

    const room = await this.roomModel.findById(game.roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const winnerName = await this.resolveWinnerName(room, winner);
    const commissionAmount = Math.floor(game.totalPool * game.commissionRate * 100) / 100;
    const payoutAmount = Math.max(0, Math.floor((game.totalPool - commissionAmount) * 100) / 100);

    game.status = 'completed';
    game.winnerId = winner.winnerId;
    game.winnerType = winner.winnerType;
    game.winnerName = winnerName;
    game.winnerTicketId = winner.winnerTicketId;
    game.commissionAmount = commissionAmount;
    game.payoutAmount = payoutAmount;
    game.completedAt = new Date();
    await game.save();

    const tickets = await this.ticketModel.find({ gameId });
    for (const ticket of tickets) {
      ticket.status = 'completed';
      ticket.totalWinnings = String(ticket._id) === winner.winnerTicketId ? payoutAmount : 0;
      await ticket.save();
    }

    room.currentGameId = undefined;
    room.status = room.players.length > 0 ? 'countdown' : 'waiting';
    room.totalPrizePool = 0;
    room.countdownStartedAt = undefined;
    room.countdownEndsAt = undefined;
    room.lastWinnerName = winnerName;
    room.lastGameCompletedAt = new Date();
    await room.save();

    if (winner.winnerType === 'real') {
      await this.usersService.addBalance(
        winner.winnerId,
        payoutAmount,
        `Loto oyunu qazancı (${game.roomId})`,
      );
    }

    for (const realUserId of room.players) {
      await this.usersService.updateGameStats(
        realUserId,
        realUserId === winner.winnerId && winner.winnerType === 'real',
        realUserId === winner.winnerId && winner.winnerType === 'real' ? payoutAmount : 0,
        room.entryFee,
      );
    }

    return this.getGameState(gameId);
  }

  async getActiveGames(roomId?: string) {
    const filter: Record<string, unknown> = { status: { $ne: 'completed' } };
    if (roomId) filter.roomId = roomId;
    return this.gameModel.find(filter).sort({ startedAt: -1 });
  }

  async getGameHistory(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const games = await this.gameModel
      .find({ status: 'completed' })
      .sort({ completedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await this.gameModel.countDocuments({ status: 'completed' });

    return {
      games,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
