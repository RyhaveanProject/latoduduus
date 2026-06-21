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

  async createGame(createGameDto: CreateGameDto): Promise<Game> {
    const room = await this.roomModel.findById(createGameDto.roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const drawNumbers = this.gameEngineService.generateDrawSequence();

    const game = new this.gameModel({
      roomId: createGameDto.roomId,
      drawNumbers,
      status: 'ongoing',
      startedAt: new Date(),
      totalPool: 0,
    });

    return game.save();
  }

  async generateTicket(gameId: string, userId: string): Promise<Ticket> {
    const game = await this.gameModel.findById(gameId);
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    const room = await this.roomModel.findById(game.roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Check if ticket already exists for this user
    const existingTicket = await this.ticketModel.findOne({
      gameId,
      userId,
    });

    if (existingTicket) {
      throw new ConflictException('User already has a ticket for this game');
    }

    const card = this.gameEngineService.generateCard();

    // Charge entry fee from the user's balance (throws if insufficient)
    if (room.entryFee > 0) {
      await this.usersService.deductBalance(
        userId,
        room.entryFee,
        `Lotto ticket entry fee for game ${gameId}`,
      );
    }

    const ticket = new this.ticketModel({
      userId,
      gameId,
      roomId: game.roomId,
      card,
      markedNumbers: [],
      entryFee: room.entryFee,
      status: 'active',
    });

    const savedTicket = await ticket.save();

    // Update game pool
    game.totalPool += room.entryFee;
    await game.save();

    return savedTicket;
  }

  async drawNumber(gameId: string, drawIndex: number): Promise<number> {
    const game = await this.gameModel.findById(gameId);
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (drawIndex >= game.drawNumbers.length) {
      throw new BadRequestException('Invalid draw index');
    }

    const drawnNumber = game.drawNumbers[drawIndex];

    // Mark number on all tickets
    const tickets = await this.ticketModel.find({ gameId });
    for (const ticket of tickets) {
      const { marked, markedNumbers } = this.gameEngineService.markNumber(
        ticket as any,
        drawnNumber,
      );

      if (marked) {
        ticket.markedNumbers = markedNumbers;
        await ticket.save();
      }

      // Check for stage 1 winner
      if (!ticket.stage1Completed && this.gameEngineService.isFirstRowCompleted(ticket as any)) {
        ticket.stage1Completed = true;
        if (!game.stage1Winners.includes(ticket.userId)) {
          game.stage1Winners.push(ticket.userId);
        }
        await ticket.save();
      }

      // Check for stage 2 winner
      if (!ticket.stage2Completed && this.gameEngineService.isAnyRowCompleted(ticket as any)) {
        ticket.stage2Completed = true;
        if (!game.stage2Winners.includes(ticket.userId)) {
          game.stage2Winners.push(ticket.userId);
        }
        await ticket.save();
      }

      // Check for stage 3 winner
      if (!ticket.stage3Completed && this.gameEngineService.isFullCardCompleted(ticket as any)) {
        ticket.stage3Completed = true;
        if (!game.stage3Winners.includes(ticket.userId)) {
          game.stage3Winners.push(ticket.userId);
        }
        await ticket.save();
      }
    }

    if (game.stage1Winners.length > 0 && game.status === 'ongoing') {
      game.status = 'stage1';
    }
    if (game.stage2Winners.length > 0) {
      game.status = 'stage2';
    }

    await game.save();

    // Auto-complete the game once the full card has been won by someone
    if (game.stage3Winners.length > 0 && game.status !== 'completed') {
      await this.completeGame(gameId);
    }

    return drawnNumber;
  }

  async getGameState(gameId: string): Promise<GameStateDto> {
    const game = await this.gameModel.findById(gameId);
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    // Calculate prizes
    const winnerCounts = {
      stage1: game.stage1Winners.length,
      stage2: game.stage2Winners.length,
      stage3: game.stage3Winners.length,
    };

    const prizes = this.gameEngineService.distributePrizes(
      game.totalPool,
      winnerCounts,
    );

    return {
      id: game._id,
      roomId: game.roomId,
      status: game.status,
      drawNumbers: game.drawNumbers,
      stage1Winners: game.stage1Winners,
      stage2Winners: game.stage2Winners,
      stage3Winners: game.stage3Winners,
      totalPool: game.totalPool,
      stage1Prize: prizes.stage1Prize,
      stage2Prize: prizes.stage2Prize,
      stage3Prize: prizes.stage3Prize,
    };
  }

  async getGameTickets(gameId: string) {
    return this.ticketModel.find({ gameId });
  }

  async getUserTicketForGame(gameId: string, userId: string) {
    return this.ticketModel.findOne({ gameId, userId });
  }

  async completeGame(gameId: string): Promise<void> {
    const game = await this.gameModel.findById(gameId);
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (game.status === 'completed') {
      return;
    }

    const winnerCounts = {
      stage1: game.stage1Winners.length,
      stage2: game.stage2Winners.length,
      stage3: game.stage3Winners.length,
    };

    const prizes = this.gameEngineService.distributePrizes(
      game.totalPool,
      winnerCounts,
    );

    game.stage1Prize = prizes.stage1Prize;
    game.stage2Prize = prizes.stage2Prize;
    game.stage3Prize = prizes.stage3Prize;

    // Pay out winnings (prize is split evenly among simultaneous winners of a stage)
    const payouts = new Map<string, number>();
    const addPayout = (userId: string, amount: number) => {
      if (amount <= 0) return;
      payouts.set(userId, (payouts.get(userId) || 0) + amount);
    };

    game.stage1Winners.forEach((userId) => addPayout(userId, prizes.stage1Prize));
    game.stage2Winners.forEach((userId) => addPayout(userId, prizes.stage2Prize));
    game.stage3Winners.forEach((userId) => addPayout(userId, prizes.stage3Prize));

    const allTickets = await this.ticketModel.find({ gameId });
    const allPlayerIds = new Set(allTickets.map((t) => t.userId));

    for (const userId of allPlayerIds) {
      const winnings = payouts.get(userId) || 0;
      const isWinner = winnings > 0;

      if (isWinner) {
        await this.usersService.addBalance(
          userId,
          winnings,
          `Lotto prize winnings for game ${gameId}`,
        );
      }

      await this.usersService.updateGameStats(userId, isWinner, winnings, 0);

      const ticket = allTickets.find((t) => t.userId === userId);
      if (ticket) {
        ticket.totalWinnings = winnings;
        ticket.stage1Prize = game.stage1Winners.includes(userId) ? prizes.stage1Prize : null;
        ticket.stage2Prize = game.stage2Winners.includes(userId) ? prizes.stage2Prize : null;
        ticket.stage3Prize = game.stage3Winners.includes(userId) ? prizes.stage3Prize : null;
        ticket.status = 'completed';
        await ticket.save();
      }
    }

    game.status = 'completed';
    game.completedAt = new Date();
    await game.save();
  }

  async getActiveGames(roomId?: string) {
    const filter: any = { status: { $ne: 'completed' } };
    if (roomId) {
      filter.roomId = roomId;
    }
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
