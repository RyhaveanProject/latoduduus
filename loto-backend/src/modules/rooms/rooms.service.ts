import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room, RoomDocument } from '../../schemas/room.schema';
import { User, UserDocument } from '../../schemas/user.schema';
import {
  CreateRoomDto,
  JoinRoomDto,
  UpdateRoomDto,
  SendMessageDto,
  RoomDto,
  RoomListDto,
  RoomPlayerDto,
} from '../../dtos/room.dto';
import { v4 as uuidv4 } from 'uuid';

const BOT_REFRESH_MS = 15 * 60 * 1000;
const ROOM_CAPACITY = 6;
const PRESET_ROOMS = [
  { name: 'Taxta 1', entryFee: 1 },
  { name: 'Taxta 5', entryFee: 5 },
  { name: 'Taxta 10', entryFee: 10 },
  { name: 'Taxta 25', entryFee: 25 },
];

const BOT_NAMES = [
  'Aysu', 'Turan', 'Kamran', 'Nigar', 'Elvin', 'Selin', 'Baran', 'Ece', 'Deniz',
  'Artem', 'Sasha', 'Mila', 'Dima', 'Vika', 'Timur', 'Luna', 'Mason', 'Oliver',
  'Emily', 'Noah', 'Ariana', 'Denis', 'Yusif', 'Rauf', 'Leyla', 'Polina', 'Nikita',
  'Kamal', 'Aylin', 'Murad', 'Leman', 'Ruslan', 'Nelli', 'Zaur', 'Fidan', 'Rena',
];

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async createRoom(createRoomDto: CreateRoomDto, ownerId: string): Promise<RoomDto> {
    const roomCode = createRoomDto.visibility === 'private' ? uuidv4().slice(0, 8).toUpperCase() : undefined;

    const room = new this.roomModel({
      name: createRoomDto.name,
      visibility: createRoomDto.visibility,
      roomCode,
      ownerId,
      players: [],
      botProfiles: [],
      currentPlayers: 0,
      entryFee: createRoomDto.entryFee,
      maxPlayers: ROOM_CAPACITY,
      requiresVerification: createRoomDto.requiresVerification || false,
      status: 'waiting',
      isSystemRoom: false,
      countdownStartedAt: undefined,
      countdownEndsAt: undefined,
    });

    await room.save();
    return this.mapRoomToDto(room);
  }

  async joinRoom(joinRoomDto: JoinRoomDto, userId: string): Promise<RoomDto> {
    await this.ensurePresetRooms();

    const room = await this.roomModel.findById(joinRoomDto.roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.currentGameId) {
      throw new ConflictException('Bu otaqda oyun artıq başlayıb');
    }

    if (room.players.includes(userId) || room.spectators.includes(userId)) {
      throw new ConflictException('User already in room');
    }

    if (room.visibility === 'private' && room.roomCode !== joinRoomDto.roomCode) {
      throw new BadRequestException('Invalid room code');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (room.entryFee > 0 && user.balance < room.entryFee) {
      throw new ConflictException('Balansınız otağa qoşulmaq üçün kifayət etmir');
    }

    await this.ensureBotRoster(room, true);

    room.players.push(userId);
    room.botProfiles = this.trimBotsToCapacity(room.botProfiles, room.maxPlayers - room.players.length);
    room.currentPlayers = room.players.length + room.botProfiles.length;
    room.totalPrizePool = room.currentPlayers * room.entryFee;
    room.status = room.currentPlayers > 0 ? 'countdown' : 'waiting';
    room.countdownStartedAt = undefined;
    room.countdownEndsAt = undefined;

    await room.save();
    return this.mapRoomToDto(room);
  }

  async leaveRoom(roomId: string, userId: string): Promise<void> {
    const room = await this.roomModel.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    room.players = room.players.filter((id) => id !== userId);
    room.spectators = room.spectators.filter((id) => id !== userId);

    if (room.ownerId === userId) {
      room.ownerId = room.players[0] || 'system';
    }

    if (!room.currentGameId) {
      room.status = room.players.length > 0 ? 'countdown' : 'waiting';
      room.countdownStartedAt = undefined;
      room.countdownEndsAt = undefined;
      await this.ensureBotRoster(room, true);
    }

    room.currentPlayers = room.players.length + room.botProfiles.length;
    room.totalPrizePool = room.currentGameId ? room.currentPlayers * room.entryFee : 0;

    if (room.visibility === 'private' && room.players.length === 0 && !room.currentGameId) {
      await this.roomModel.findByIdAndDelete(roomId);
      return;
    }

    await room.save();
  }

  async addSpectator(roomId: string, userId: string): Promise<RoomDto> {
    const room = await this.roomModel.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.spectators.includes(userId) || room.players.includes(userId)) {
      throw new ConflictException('User already in room');
    }

    room.spectators.push(userId);
    await room.save();
    return this.mapRoomToDto(room);
  }

  async sendMessage(roomId: string, sendMessageDto: SendMessageDto, userId: string): Promise<RoomDto> {
    const room = await this.roomModel.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (!room.players.includes(userId) && !room.spectators.includes(userId)) {
      throw new BadRequestException('User not in room');
    }

    const user = await this.userModel.findById(userId);
    room.messages.push({
      userId,
      username: user?.firstName || user?.email || 'Player',
      message: sendMessageDto.message,
      timestamp: new Date(),
    });

    if (room.messages.length > 100) {
      room.messages = room.messages.slice(-100);
    }

    await room.save();
    return this.mapRoomToDto(room);
  }

  async getRoomsList(page: number = 1, limit: number = 20, visibility?: string): Promise<RoomListDto> {
    await this.ensurePresetRooms();
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};

    if (visibility) {
      filter.visibility = visibility;
    }

    const rooms = await this.roomModel.find(filter).sort({ entryFee: 1, createdAt: 1 }).skip(skip).limit(limit);
    for (const room of rooms) {
      await this.ensureBotRoster(room);
    }

    const total = await this.roomModel.countDocuments(filter);

    return {
      rooms: await Promise.all(rooms.map((room) => this.mapRoomToDto(room))),
      total,
      page,
      pageSize: limit,
    };
  }

  async getRoomById(roomId: string): Promise<RoomDto> {
    await this.ensurePresetRooms();
    const room = await this.roomModel.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    await this.ensureBotRoster(room);
    return this.mapRoomToDto(room);
  }

  async updateRoom(roomId: string, updateRoomDto: UpdateRoomDto, userId: string): Promise<RoomDto> {
    const room = await this.roomModel.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.ownerId !== userId && room.ownerId !== 'system') {
      throw new BadRequestException('Only room owner can update room');
    }

    if (updateRoomDto.name) {
      room.name = updateRoomDto.name;
    }

    if (updateRoomDto.maxPlayers && updateRoomDto.maxPlayers >= 2) {
      room.maxPlayers = ROOM_CAPACITY;
    }

    if (updateRoomDto.status) {
      room.status = updateRoomDto.status;
    }

    await room.save();
    return this.mapRoomToDto(room);
  }

  async getPublicRooms(page: number = 1, limit: number = 20): Promise<RoomListDto> {
    return this.getRoomsList(page, limit, 'public');
  }

  async calculatePrizePool(roomId: string): Promise<number> {
    const room = await this.roomModel.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    return (room.players.length + room.botProfiles.length) * room.entryFee;
  }

  async setRoomGame(roomId: string, gameId?: string | null): Promise<void> {
    const room = await this.roomModel.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    room.currentGameId = gameId || undefined;
    room.status = gameId ? 'active' : room.players.length > 0 ? 'countdown' : 'waiting';
    if (!gameId) {
      room.totalPrizePool = 0;
      room.countdownStartedAt = undefined;
      room.countdownEndsAt = undefined;
      await this.ensureBotRoster(room, true);
    } else {
      room.totalPrizePool = (room.players.length + room.botProfiles.length) * room.entryFee;
    }
    room.currentPlayers = room.players.length + room.botProfiles.length;
    await room.save();
  }

  async startCountdown(roomId: string, seconds: number = 10): Promise<RoomDto> {
    const room = await this.roomModel.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    await this.ensureBotRoster(room, true);

    if (room.currentGameId) {
      return this.mapRoomToDto(room);
    }

    if (room.players.length === 0) {
      room.status = 'waiting';
      room.countdownStartedAt = undefined;
      room.countdownEndsAt = undefined;
      room.totalPrizePool = 0;
      await room.save();
      return this.mapRoomToDto(room);
    }

    const startedAt = new Date();
    const endsAt = new Date(startedAt.getTime() + seconds * 1000);
    room.status = 'countdown';
    room.countdownStartedAt = startedAt;
    room.countdownEndsAt = endsAt;
    room.currentPlayers = room.players.length + room.botProfiles.length;
    room.totalPrizePool = room.currentPlayers * room.entryFee;
    await room.save();

    return this.mapRoomToDto(room);
  }

  async clearCountdown(roomId: string): Promise<void> {
    const room = await this.roomModel.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    room.countdownStartedAt = undefined;
    room.countdownEndsAt = undefined;
    if (!room.currentGameId) {
      room.status = room.players.length > 0 ? 'countdown' : 'waiting';
    }
    await room.save();
  }

  async getPlayersForRoom(roomId: string): Promise<RoomPlayerDto[]> {
    const room = await this.roomModel.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    await this.ensureBotRoster(room);
    return this.buildPlayers(room);
  }

  private async ensurePresetRooms(): Promise<void> {
    for (const preset of PRESET_ROOMS) {
      const existing = await this.roomModel.findOne({ name: preset.name, isSystemRoom: true });
      if (existing) {
        let changed = false;
        if (existing.maxPlayers !== ROOM_CAPACITY) {
          existing.maxPlayers = ROOM_CAPACITY;
          changed = true;
        }
        if (!existing.botProfiles?.length) {
          existing.botProfiles = this.generateBots(4, 5);
          existing.botRosterUpdatedAt = new Date();
          changed = true;
        }
        if (changed) {
          existing.currentPlayers = existing.players.length + existing.botProfiles.length;
          await existing.save();
        }
        continue;
      }

      const room = new this.roomModel({
        name: preset.name,
        visibility: 'public',
        ownerId: 'system',
        players: [],
        botProfiles: this.generateBots(4, 5),
        spectators: [],
        messages: [],
        entryFee: preset.entryFee,
        maxPlayers: ROOM_CAPACITY,
        currentPlayers: 4,
        status: 'waiting',
        totalPrizePool: 0,
        requiresVerification: false,
        isSystemRoom: true,
        botRosterUpdatedAt: new Date(),
      });
      await room.save();
    }
  }

  private async ensureBotRoster(room: RoomDocument, force: boolean = false): Promise<void> {
    if (room.visibility !== 'public') {
      room.currentPlayers = room.players.length;
      return;
    }

    const now = Date.now();
    const last = room.botRosterUpdatedAt ? new Date(room.botRosterUpdatedAt).getTime() : 0;
    const aliasesExpired = now - last >= BOT_REFRESH_MS;
    const capacity = Math.max(0, room.maxPlayers - room.players.length);

    if ((!room.botProfiles?.length || force) && !room.currentGameId) {
      const minBots = room.players.length > 0 ? 3 : 4;
      const maxBots = 5;
      const desired = Math.min(capacity, this.randomBetween(minBots, maxBots));
      room.botProfiles = this.generateBots(desired, desired);
      room.botRosterUpdatedAt = new Date();
      room.currentPlayers = room.players.length + room.botProfiles.length;
      room.totalPrizePool = room.currentGameId ? room.currentPlayers * room.entryFee : 0;
      await room.save();
      return;
    }

    if (aliasesExpired && room.botProfiles?.length) {
      if (room.currentGameId) {
        room.botProfiles = room.botProfiles.map((bot) => ({ ...bot, name: this.generateBotName() }));
      } else {
        const desired = Math.min(capacity, Math.max(3, room.botProfiles.length));
        room.botProfiles = this.generateBots(desired, desired);
      }
      room.botRosterUpdatedAt = new Date();
      await room.save();
    }

    room.botProfiles = this.trimBotsToCapacity(room.botProfiles || [], capacity);
    room.currentPlayers = room.players.length + room.botProfiles.length;
    if (!room.currentGameId && room.players.length === 0) {
      room.status = 'waiting';
      room.countdownStartedAt = undefined;
      room.countdownEndsAt = undefined;
    }
    if (force) {
      await room.save();
    }
  }

  private trimBotsToCapacity(bots: Array<{ id: string; name: string; isBot: boolean; avatar?: string }>, capacity: number) {
    if (capacity <= 0) return [];
    return bots.slice(0, capacity);
  }

  private generateBots(min: number, max: number) {
    const count = this.randomBetween(min, max);
    return Array.from({ length: count }, () => ({
      id: `bot_${uuidv4()}`,
      name: this.generateBotName(),
      isBot: true,
      avatar: undefined,
    }));
  }

  private generateBotName(): string {
    const first = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    const suffix = Math.random() > 0.55 ? ` ${Math.floor(10 + Math.random() * 89)}` : '';
    return `${first}${suffix}`;
  }

  private randomBetween(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private toHumanEmail(name: string): string {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '') || 'player';
    return `${slug}@mail.com`;
  }

  private async buildPlayers(room: RoomDocument): Promise<RoomPlayerDto[]> {
    const users = room.players.length
      ? await this.userModel.find({ _id: { $in: room.players } }).select('email firstName avatar balance gamesWon')
      : [];

    const realPlayers: RoomPlayerDto[] = room.players
      .map((id) => users.find((user) => String(user._id) === id))
      .filter(Boolean)
      .map((user) => ({
        id: String(user!._id),
        email: user!.email,
        firstName: user!.firstName,
        avatar: user!.avatar,
        balance: user!.balance,
        gamesWon: user!.gamesWon,
        isBot: false,
      }));

    const bots: RoomPlayerDto[] = (room.botProfiles || []).map((bot) => ({
      id: bot.id,
      email: this.toHumanEmail(bot.name),
      firstName: bot.name,
      avatar: bot.avatar,
      balance: 0,
      gamesWon: 0,
      isBot: true,
    }));

    return [...realPlayers, ...bots];
  }

  private async mapRoomToDto(room: RoomDocument): Promise<RoomDto> {
    const players = await this.buildPlayers(room);
    return {
      id: String(room._id),
      name: room.name,
      visibility: room.visibility,
      ownerId: room.ownerId,
      players,
      spectators: room.spectators,
      entryFee: room.entryFee,
      maxPlayers: room.maxPlayers,
      currentPlayers: players.length,
      status: room.status,
      totalPrizePool: room.currentGameId || room.status === 'countdown' ? players.length * room.entryFee : 0,
      messages: room.messages,
      currentGameId: room.currentGameId,
      countdownStartedAt: room.countdownStartedAt,
      countdownEndsAt: room.countdownEndsAt,
      lastWinnerName: room.lastWinnerName,
      createdAt: room.createdAt,
    };
  }
}
