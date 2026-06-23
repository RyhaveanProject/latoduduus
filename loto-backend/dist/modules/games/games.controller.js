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
exports.GamesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const games_service_1 = require("./games.service");
const jwt_guard_1 = require("../../common/guards/jwt.guard");
const get_user_decorator_1 = require("../../common/decorators/get-user.decorator");
const game_dto_1 = require("../../dtos/game.dto");
let GamesController = class GamesController {
    constructor(gamesService) {
        this.gamesService = gamesService;
    }
    async createGame(createGameDto) {
        return this.gamesService.createGame(createGameDto);
    }
    async generateTicket(gameId, userId) {
        return this.gamesService.generateTicket(gameId, userId);
    }
    async drawNumber(gameId, drawIndex) {
        const drawnNumber = await this.gamesService.drawNumber(gameId, drawIndex);
        return { drawnNumber };
    }
    async getGameState(gameId) {
        return this.gamesService.getGameState(gameId);
    }
    async getGameTickets(gameId) {
        return this.gamesService.getGameTickets(gameId);
    }
    async getMyTicket(gameId, userId) {
        return this.gamesService.getUserTicketForGame(gameId, userId);
    }
    async completeGame(gameId) {
        await this.gamesService.completeGame(gameId);
        return { message: 'Game completed' };
    }
    async getActiveGames(roomId) {
        return this.gamesService.getActiveGames(roomId);
    }
    async getGameHistory(page = 1, limit = 20) {
        return this.gamesService.getGameHistory(page, limit);
    }
};
exports.GamesController = GamesController;
__decorate([
    (0, common_1.Post)('create'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new game' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [game_dto_1.CreateGameDto]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "createGame", null);
__decorate([
    (0, common_1.Post)(':gameId/ticket'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Generate ticket for game' }),
    __param(0, (0, common_1.Param)('gameId')),
    __param(1, (0, get_user_decorator_1.GetUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "generateTicket", null);
__decorate([
    (0, common_1.Post)(':gameId/draw'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Draw a number in game' }),
    __param(0, (0, common_1.Param)('gameId')),
    __param(1, (0, common_1.Body)('drawIndex')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "drawNumber", null);
__decorate([
    (0, common_1.Get)(':gameId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get game state' }),
    __param(0, (0, common_1.Param)('gameId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "getGameState", null);
__decorate([
    (0, common_1.Get)(':gameId/tickets'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all tickets for game' }),
    __param(0, (0, common_1.Param)('gameId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "getGameTickets", null);
__decorate([
    (0, common_1.Get)(':gameId/my-ticket'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get my ticket for a game' }),
    __param(0, (0, common_1.Param)('gameId')),
    __param(1, (0, get_user_decorator_1.GetUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "getMyTicket", null);
__decorate([
    (0, common_1.Post)(':gameId/complete'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Complete a game' }),
    __param(0, (0, common_1.Param)('gameId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "completeGame", null);
__decorate([
    (0, common_1.Get)('active/list'),
    (0, swagger_1.ApiOperation)({ summary: 'Get active games' }),
    __param(0, (0, common_1.Query)('roomId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "getActiveGames", null);
__decorate([
    (0, common_1.Get)('history/list'),
    (0, swagger_1.ApiOperation)({ summary: 'Get game history' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "getGameHistory", null);
exports.GamesController = GamesController = __decorate([
    (0, swagger_1.ApiTags)('Games'),
    (0, common_1.Controller)('games'),
    __metadata("design:paramtypes", [games_service_1.GamesService])
], GamesController);
//# sourceMappingURL=games.controller.js.map