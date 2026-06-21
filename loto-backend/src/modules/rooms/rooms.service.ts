import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room, RoomDocument } from '../../schemas/room.schema';
import {
  CreateRoomDto,
  JoinRoomDto,
  UpdateRoomDto,
  SendMessageDto,
  RoomDto,
  RoomListDto,
} from '../../dtos/room.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RoomsService {
  constructor(@InjectModel(Room.name) private roomModel: Model<RoomDocument>) {}

  async createRoom(createRoomDto: CreateRoomDto, ownerId: string): Promise<RoomDto> {
    const roomCode = createRoomDto.visibility === 'private' ? uuidv4().slice(0, 8).toUpperCase() : null;

    const room = new this.roomModel({
      name: createRoomDto.name,
      visibility: createRoomDto.visibility,
      roomCode,
      ownerId,
      players: [ownerId],
      currentPlayers: 1,
      entryFee: createRoomDto.entryFee,
      maxPlayers: createRoomDto.maxPlayers,
      requiresVerification: createRoomDto.requiresVerification || false,
      status: 'waiting',
    });

    const savedRoom = await room.save();
    return this.mapRoomToDto(savedRoom);
  }

  async joinRoom(joinRoomDto: JoinRoomDto, userId: string): Promise<RoomDto> {
    const room = await this.roomModel.findById(joinRoomDto.roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Check if room is full
    if (room.currentPlayers >= room.maxPlayers) {
      throw new ConflictException('Room is full');
    }

    // Check if user is already in room
    if (room.players.includes(userId) || room.spectators.includes(userId)) {
      throw new ConflictException('User already in room');
    }

    // Check room code for private rooms
    if (room.visibility === 'private' && room.roomCode !== joinRoomDto.roomCode) {
      throw new BadRequestException('Invalid room code');
    }

    room.players.push(userId);
    room.currentPlayers += 1;

    if (room.currentPlayers >= room.maxPlayers) {
      room.status = 'active';
    }

    const savedRoom = await room.save();
    return this.mapRoomToDto(savedRoom);
  }

  async leaveRoom(roomId: string, userId: string): Promise<void> {
    const room = await this.roomModel.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Remove from players
    if (room.players.includes(userId)) {
      room.players = room.players.filter((id) => id !== userId);
      room.currentPlayers -= 1;
    }

    // Remove from spectators
    if (room.spectators.includes(userId)) {
      room.spectators = room.spectators.filter((id) => id !== userId);
    }

    // If owner leaves, transfer ownership or delete room
    if (room.ownerId === userId) {
      if (room.players.length > 0) {
        room.ownerId = room.players[0];
      } else {
        // Delete empty room
        await this.roomModel.findByIdAndDelete(roomId);
        return;
      }
    }

    // Change status to waiting if players drop
    if (room.currentPlayers < room.maxPlayers && room.status === 'active') {
      room.status = 'waiting';
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
    const savedRoom = await room.save();
    return this.mapRoomToDto(savedRoom);
  }

  async sendMessage(roomId: string, sendMessageDto: SendMessageDto, userId: string): Promise<RoomDto> {
    const room = await this.roomModel.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Check if user is in room
    if (!room.players.includes(userId) && !room.spectators.includes(userId)) {
      throw new BadRequestException('User not in room');
    }

    room.messages.push({
      userId,
      username: userId, // In real app, fetch username from user service
      message: sendMessageDto.message,
      timestamp: new Date(),
    });

    // Keep only last 100 messages
    if (room.messages.length > 100) {
      room.messages = room.messages.slice(-100);
    }

    const savedRoom = await room.save();
    return this.mapRoomToDto(savedRoom);
  }

  async getRoomsList(page: number = 1, limit: number = 20, visibility?: string): Promise<RoomListDto> {
    const skip = (page - 1) * limit;
    const filter: any = { status: { $ne: 'finished' } };

    if (visibility) {
      filter.visibility = visibility;
    }

    const rooms = await this.roomModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await this.roomModel.countDocuments(filter);

    return {
      rooms: rooms.map((room) => this.mapRoomToDto(room)),
      total,
      page,
      pageSize: limit,
    };
  }

  async getRoomById(roomId: string): Promise<RoomDto> {
    const room = await this.roomModel.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    return this.mapRoomToDto(room);
  }

  async updateRoom(roomId: string, updateRoomDto: UpdateRoomDto, userId: string): Promise<RoomDto> {
    const room = await this.roomModel.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Check if user is owner
    if (room.ownerId !== userId) {
      throw new BadRequestException('Only room owner can update room');
    }

    if (updateRoomDto.name) {
      room.name = updateRoomDto.name;
    }

    if (updateRoomDto.maxPlayers && updateRoomDto.maxPlayers > room.currentPlayers) {
      room.maxPlayers = updateRoomDto.maxPlayers;
    }

    if (updateRoomDto.status) {
      room.status = updateRoomDto.status;
    }

    const savedRoom = await room.save();
    return this.mapRoomToDto(savedRoom);
  }

  async getPublicRooms(page: number = 1, limit: number = 20): Promise<RoomListDto> {
    return this.getRoomsList(page, limit, 'public');
  }

  async calculatePrizePool(roomId: string): Promise<number> {
    const room = await this.roomModel.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    return room.currentPlayers * room.entryFee;
  }

  private mapRoomToDto(room: RoomDocument): RoomDto {
    return {
      id: room._id,
      name: room.name,
      visibility: room.visibility,
      ownerId: room.ownerId,
      players: room.players as any,
      spectators: room.spectators,
      entryFee: room.entryFee,
      maxPlayers: room.maxPlayers,
      currentPlayers: room.currentPlayers,
      status: room.status,
      totalPrizePool: room.currentPlayers * room.entryFee,
      messages: room.messages,
      createdAt: room.createdAt,
    };
  }
}
