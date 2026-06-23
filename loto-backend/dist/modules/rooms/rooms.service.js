"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const room_schema_1 = require("../../schemas/room.schema");
const uuid_1 = require("uuid");
let RoomsService = class RoomsService {
    constructor(roomModel) {
        this.roomModel = roomModel;
    }
    async createRoom(createRoomDto, ownerId) {
        const roomCode = createRoomDto.visibility === 'private' ? (0, uuid_1.v4)().slice(0, 8).toUpperCase() : null;
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
    async joinRoom(joinRoomDto, userId) {
        const room = await this.roomModel.findById(joinRoomDto.roomId);
        if (!room) {
            throw new common_1.NotFoundException('Room not found');
        }
        // Check if room is full
        if (room.currentPlayers >= room.maxPlayers) {
            throw new common_1.ConflictException('Room is full');
        }
        // Check if user is already in room
        if (room.players.includes(userId) || room.spectators.includes(userId)) {
            throw new common_1.ConflictException('User already in room');
        }
        // Check room code for private rooms
        if (room.visibility === 'private' && room.roomCode !== joinRoomDto.roomCode) {
            throw new common_1.BadRequestException('Invalid room code');
        }
        room.players.push(userId);
        room.currentPlayers += 1;
        if (room.currentPlayers >= room.maxPlayers) {
            room.status = 'active';
        }
        const savedRoom = await room.save();
        return this.mapRoomToDto(savedRoom);
    }
    async leaveRoom(roomId, userId) {
        const room = await this.roomModel.findById(roomId);
        if (!room) {
            throw new common_1.NotFoundException('Room not found');
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
            }
            else {
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
    async addSpectator(roomId, userId) {
        const room = await this.roomModel.findById(roomId);
        if (!room) {
            throw new common_1.NotFoundException('Room not found');
        }
        if (room.spectators.includes(userId) || room.players.includes(userId)) {
            throw new common_1.ConflictException('User already in room');
        }
        room.spectators.push(userId);
        const savedRoom = await room.save();
        return this.mapRoomToDto(savedRoom);
    }
    async sendMessage(roomId, sendMessageDto, userId) {
        const room = await this.roomModel.findById(roomId);
        if (!room) {
            throw new common_1.NotFoundException('Room not found');
        }
        // Check if user is in room
        if (!room.players.includes(userId) && !room.spectators.includes(userId)) {
            throw new common_1.BadRequestException('User not in room');
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
    async getRoomsList(page = 1, limit = 20, visibility) {
        const skip = (page - 1) * limit;
        const filter = { status: { $ne: 'finished' } };
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
    async getRoomById(roomId) {
        const room = await this.roomModel.findById(roomId);
        if (!room) {
            throw new common_1.NotFoundException('Room not found');
        }
        return this.mapRoomToDto(room);
    }
    async updateRoom(roomId, updateRoomDto, userId) {
        const room = await this.roomModel.findById(roomId);
        if (!room) {
            throw new common_1.NotFoundException('Room not found');
        }
        // Check if user is owner
        if (room.ownerId !== userId) {
            throw new common_1.BadRequestException('Only room owner can update room');
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
    async getPublicRooms(page = 1, limit = 20) {
        return this.getRoomsList(page, limit, 'public');
    }
    async calculatePrizePool(roomId) {
        const room = await this.roomModel.findById(roomId);
        if (!room) {
            throw new common_1.NotFoundException('Room not found');
        }
        return room.currentPlayers * room.entryFee;
    }
    mapRoomToDto(room) {
        return {
            id: room._id,
            name: room.name,
            visibility: room.visibility,
            ownerId: room.ownerId,
            players: room.players,
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
};
exports.RoomsService = RoomsService;
exports.RoomsService = RoomsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(room_schema_1.Room.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], RoomsService);
//# sourceMappingURL=rooms.service.js.map