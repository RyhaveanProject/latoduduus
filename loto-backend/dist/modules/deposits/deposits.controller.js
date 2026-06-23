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
exports.DepositsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const deposits_service_1 = require("./deposits.service");
const jwt_guard_1 = require("../../common/guards/jwt.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const roles_guard_1 = require("../../common/guards/roles.guard");
const get_user_decorator_1 = require("../../common/decorators/get-user.decorator");
const deposit_dto_1 = require("../../dtos/deposit.dto");
const class_transformer_1 = require("class-transformer");
let DepositsController = class DepositsController {
    constructor(depositsService) {
        this.depositsService = depositsService;
    }
    async createDeposit(body, proofFile, userId, email) {
        // Transform and validate body (supports both JSON and multipart)
        const createDepositDto = (0, class_transformer_1.plainToInstance)(deposit_dto_1.CreateDepositDto, {
            amount: body.amount,
            paymentMethod: body.paymentMethod ?? body.method,
            currency: body.currency,
            cardNumber: body.cardNumber,
            cardHolder: body.cardHolder,
            walletAddress: body.walletAddress,
            walletNetwork: body.walletNetwork,
            bankId: body.bankId,
            screenshotUrl: body.screenshotUrl ?? '',
        });
        return this.depositsService.createDeposit(createDepositDto, userId, email, proofFile);
    }
    async getMyDeposits(userId, page = 1, limit = 20) {
        return this.depositsService.getUserDeposits(userId, page, limit);
    }
    async listDeposits(page = 1, limit = 20, status) {
        return this.depositsService.getDepositsList(page, limit, status);
    }
    async getPending() {
        return this.depositsService.getPendingDeposits();
    }
};
exports.DepositsController = DepositsController;
__decorate([
    (0, common_1.Post)('create'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create deposit request' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data', 'application/json'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('proof')),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, get_user_decorator_1.GetUser)('sub')),
    __param(3, (0, get_user_decorator_1.GetUser)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], DepositsController.prototype, "createDeposit", null);
__decorate([
    (0, common_1.Get)('my-deposits'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get my deposits' }),
    __param(0, (0, get_user_decorator_1.GetUser)('sub')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], DepositsController.prototype, "getMyDeposits", null);
__decorate([
    (0, common_1.Get)('list'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all deposits (admin only)' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", Promise)
], DepositsController.prototype, "listDeposits", null);
__decorate([
    (0, common_1.Get)('pending'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get pending deposits (admin only)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DepositsController.prototype, "getPending", null);
exports.DepositsController = DepositsController = __decorate([
    (0, swagger_1.ApiTags)('Deposits'),
    (0, common_1.Controller)('deposits'),
    __metadata("design:paramtypes", [deposits_service_1.DepositsService])
], DepositsController);
//# sourceMappingURL=deposits.controller.js.map