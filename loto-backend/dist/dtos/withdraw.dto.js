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
exports.WithdrawListDto = exports.WithdrawDto = exports.RejectWithdrawDto = exports.ApproveWithdrawDto = exports.CreateWithdrawDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateWithdrawDto {
}
exports.CreateWithdrawDto = CreateWithdrawDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateWithdrawDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['card', 'crypto'] }),
    (0, class_validator_1.IsEnum)(['card', 'crypto']),
    __metadata("design:type", String)
], CreateWithdrawDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['AZ', 'RU', 'TR', 'GE', 'EN', 'AR', 'CN'] }),
    (0, class_validator_1.IsEnum)(['AZ', 'RU', 'TR', 'GE', 'EN', 'AR', 'CN']),
    __metadata("design:type", String)
], CreateWithdrawDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Card number, required when paymentMethod is "card"' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWithdrawDto.prototype, "cardNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Wallet address, required when paymentMethod is "crypto"' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWithdrawDto.prototype, "walletAddress", void 0);
class ApproveWithdrawDto {
}
exports.ApproveWithdrawDto = ApproveWithdrawDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ApproveWithdrawDto.prototype, "withdrawId", void 0);
class RejectWithdrawDto {
}
exports.RejectWithdrawDto = RejectWithdrawDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RejectWithdrawDto.prototype, "withdrawId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RejectWithdrawDto.prototype, "reason", void 0);
class WithdrawDto {
}
exports.WithdrawDto = WithdrawDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], WithdrawDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], WithdrawDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], WithdrawDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], WithdrawDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], WithdrawDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], WithdrawDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], WithdrawDto.prototype, "rejectionReason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], WithdrawDto.prototype, "approvedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], WithdrawDto.prototype, "createdAt", void 0);
class WithdrawListDto {
}
exports.WithdrawListDto = WithdrawListDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: () => [WithdrawDto] }),
    __metadata("design:type", Array)
], WithdrawListDto.prototype, "withdraws", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], WithdrawListDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], WithdrawListDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], WithdrawListDto.prototype, "pageSize", void 0);
//# sourceMappingURL=withdraw.dto.js.map