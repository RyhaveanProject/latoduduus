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
exports.WithdrawController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const withdraw_service_1 = require("./withdraw.service");
const jwt_guard_1 = require("../../common/guards/jwt.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const roles_guard_1 = require("../../common/guards/roles.guard");
const get_user_decorator_1 = require("../../common/decorators/get-user.decorator");
const withdraw_dto_1 = require("../../dtos/withdraw.dto");
// ⚠️ There are intentionally no approve/reject endpoints here.
// Withdrawals (just like deposits) can ONLY be approved or rejected
// through the Telegram bot — see TelegramService.handleApproveWithdraw /
// handleRejectWithdraw. This is a hard product requirement, not an
// oversight.
let WithdrawController = class WithdrawController {
    constructor(withdrawService) {
        this.withdrawService = withdrawService;
    }
    async createWithdraw(createWithdrawDto, userId, email) {
        return this.withdrawService.createWithdraw(createWithdrawDto, userId, email);
    }
    async getMyWithdraws(userId, page = 1, limit = 20) {
        return this.withdrawService.getUserWithdraws(userId, page, limit);
    }
    async listWithdraws(page = 1, limit = 20, status) {
        return this.withdrawService.getAllWithdraws(page, limit, status);
    }
    async getPending() {
        return this.withdrawService.getPendingWithdraws();
    }
};
exports.WithdrawController = WithdrawController;
__decorate([
    (0, common_1.Post)('create'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create withdraw request (funds are reserved immediately)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, get_user_decorator_1.GetUser)('sub')),
    __param(2, (0, get_user_decorator_1.GetUser)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [withdraw_dto_1.CreateWithdrawDto, String, String]),
    __metadata("design:returntype", Promise)
], WithdrawController.prototype, "createWithdraw", null);
__decorate([
    (0, common_1.Get)('my-withdraws'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get my withdraw requests' }),
    __param(0, (0, get_user_decorator_1.GetUser)('sub')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], WithdrawController.prototype, "getMyWithdraws", null);
__decorate([
    (0, common_1.Get)('list'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all withdraw requests (admin only)' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", Promise)
], WithdrawController.prototype, "listWithdraws", null);
__decorate([
    (0, common_1.Get)('pending'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get pending withdraw requests (admin only)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WithdrawController.prototype, "getPending", null);
exports.WithdrawController = WithdrawController = __decorate([
    (0, swagger_1.ApiTags)('Withdraws'),
    (0, common_1.Controller)('withdraws'),
    __metadata("design:paramtypes", [withdraw_service_1.WithdrawService])
], WithdrawController);
//# sourceMappingURL=withdraw.controller.js.map