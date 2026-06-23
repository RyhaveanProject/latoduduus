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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameStateDto = exports.GameTicket = exports.LottoCard = exports.GameCard = exports.CheckWinnerDto = exports.DrawNumberDto = exports.GenerateCardDto = exports.CreateGameDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateGameDto {
}
exports.CreateGameDto = CreateGameDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGameDto.prototype, "roomId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateGameDto.prototype, "entryFee", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 100 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateGameDto.prototype, "maxPlayers", void 0);
class GenerateCardDto {
}
exports.GenerateCardDto = GenerateCardDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateCardDto.prototype, "gameId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateCardDto.prototype, "userId", void 0);
class DrawNumberDto {
}
exports.DrawNumberDto = DrawNumberDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DrawNumberDto.prototype, "gameId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], DrawNumberDto.prototype, "number", void 0);
class CheckWinnerDto {
}
exports.CheckWinnerDto = CheckWinnerDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CheckWinnerDto.prototype, "gameId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CheckWinnerDto.prototype, "ticketId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['stage1', 'stage2', 'stage3'] }),
    (0, class_validator_1.IsEnum)(['stage1', 'stage2', 'stage3']),
    __metadata("design:type", String)
], CheckWinnerDto.prototype, "stage", void 0);
class GameCard {
}
exports.GameCard = GameCard;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], GameCard.prototype, "row", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: [1, 2, 3, 4, 5] }),
    __metadata("design:type", Array)
], GameCard.prototype, "numbers", void 0);
class LottoCard {
}
exports.LottoCard = LottoCard;
__decorate([
    (0, swagger_1.ApiProperty)({ type: () => [GameCard] }),
    __metadata("design:type", Array)
], LottoCard.prototype, "card", void 0);
class GameTicket {
}
exports.GameTicket = GameTicket;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], GameTicket.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], GameTicket.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], GameTicket.prototype, "gameId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], GameTicket.prototype, "roomId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: () => [GameCard] }),
    __metadata("design:type", Array)
], GameTicket.prototype, "card", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Array)
], GameTicket.prototype, "markedNumbers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], GameTicket.prototype, "stage1Completed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], GameTicket.prototype, "stage2Completed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], GameTicket.prototype, "stage3Completed", void 0);
class GameStateDto {
}
exports.GameStateDto = GameStateDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], GameStateDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], GameStateDto.prototype, "roomId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], GameStateDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Array)
], GameStateDto.prototype, "drawNumbers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Array)
], GameStateDto.prototype, "stage1Winners", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Array)
], GameStateDto.prototype, "stage2Winners", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Array)
], GameStateDto.prototype, "stage3Winners", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], GameStateDto.prototype, "totalPool", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], GameStateDto.prototype, "stage1Prize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], GameStateDto.prototype, "stage2Prize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], GameStateDto.prototype, "stage3Prize", void 0);
//# sourceMappingURL=game.dto.js.map