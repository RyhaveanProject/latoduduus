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
var GameGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const games_service_1 = require("../modules/games/games.service");
const rooms_service_1 = require("../modules/rooms/rooms.service");
let GameGateway = GameGateway_1 = class GameGateway {
    constructor(gamesService, roomsService) {
        this.gamesService = gamesService;
        this.roomsService = roomsService;
        this.logger = new common_1.Logger(GameGateway_1.name);
        this.userSockets = new Map();
    }
    afterInit(server) {
        this.logger.log('✅ WebSocket Gateway initialized');
    }
    getErrorMessage(error) {
        return error instanceof Error ? error.message : 'Unknown error';
    }
    async handleConnection(socket) {
        const token = socket.handshake.auth.token;
        const userId = socket.handshake.query.userId;
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
    async handleDisconnect(socket) {
        if (socket.userId) {
            const sockets = this.userSockets.get(socket.userId) || [];
            const filtered = sockets.filter((id) => id !== socket.id);
            if (filtered.length > 0) {
                this.userSockets.set(socket.userId, filtered);
            }
            else {
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
    async handleJoinRoom(socket, data) {
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
        }
        catch (error) {
            socket.emit('error', {
                message: 'Failed to join room',
                error: this.getErrorMessage(error),
            });
        }
    }
    async handleLeaveRoom(socket, data) {
        const { roomId } = data;
        const userId = socket.userId;
        try {
            if (!userId) {
                socket.emit('error', { message: 'User not authenticated' });
                return;
            }
            await this.roomsService.leaveRoom(roomId, userId);
            socket.leave(roomId);
            this.server.to(roomId).emit('player-left', {
                userId,
                roomId,
            });
            socket.emit('room-left', { success: true });
            this.logger.log(`🎮 User ${userId} left room ${roomId}`);
        }
        catch (error) {
            socket.emit('error', {
                message: 'Failed to leave room',
                error: this.getErrorMessage(error),
            });
        }
    }
    async handleDrawNumber(socket, data) {
        const { gameId, drawIndex } = data;
        const roomId = socket.roomId;
        try {
            if (!roomId) {
                socket.emit('error', { message: 'Room not joined' });
                return;
            }
            const drawnNumber = await this.gamesService.drawNumber(gameId, drawIndex);
            const gameState = await this.gamesService.getGameState(gameId);
            this.server.to(roomId).emit('number-drawn', {
                number: drawnNumber,
                drawIndex,
                gameState,
            });
            this.logger.log(`🎲 Number ${drawnNumber} drawn in game ${gameId}`);
        }
        catch (error) {
            socket.emit('error', {
                message: 'Failed to draw number',
                error: this.getErrorMessage(error),
            });
        }
    }
    async handleCheckCard(socket, data) {
        const { gameId, ticketId } = data;
        try {
            if (!socket.userId) {
                socket.emit('error', { message: 'User not authenticated' });
                return;
            }
            const ticket = await this.gamesService.getUserTicketForGame(gameId, socket.userId);
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
        }
        catch (error) {
            socket.emit('error', {
                message: 'Failed to check card',
                error: this.getErrorMessage(error),
            });
        }
    }
    async handleSendMessage(socket, data) {
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
    async handleGameEnded(socket, data) {
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
        }
        catch (error) {
            socket.emit('error', {
                message: 'Failed to complete game',
                error: this.getErrorMessage(error),
            });
        }
    }
    handlePing(socket) {
        socket.emit('pong', { timestamp: Date.now() });
    }
};
exports.GameGateway = GameGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], GameGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join-room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave-room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleLeaveRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('draw-number'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleDrawNumber", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('check-card'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleCheckCard", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('send-message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleSendMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('game-ended'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleGameEnded", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('ping'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "handlePing", null);
exports.GameGateway = GameGateway = GameGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
        transports: ['websocket', 'polling'],
    }),
    __metadata("design:paramtypes", [games_service_1.GamesService,
        rooms_service_1.RoomsService])
], GameGateway);
//# sourceMappingURL=game.gateway.js.map