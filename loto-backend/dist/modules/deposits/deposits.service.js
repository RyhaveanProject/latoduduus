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
exports.DepositsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const deposit_schema_1 = require("../../schemas/deposit.schema");
const user_schema_1 = require("../../schemas/user.schema");
const transaction_schema_1 = require("../../schemas/transaction.schema");
const telegram_service_1 = require("../telegram/telegram.service");
let DepositsService = class DepositsService {
    constructor(depositModel, userModel, transactionModel, telegramService) {
        this.depositModel = depositModel;
        this.userModel = userModel;
        this.transactionModel = transactionModel;
        this.telegramService = telegramService;
    }
    async createDeposit(createDepositDto, userId, email, proofFile) {
        // If a file was uploaded, use its buffer as base64 data URL for screenshotUrl
        let screenshotUrl = createDepositDto.screenshotUrl || '';
        if (proofFile) {
            const b64 = proofFile.buffer.toString('base64');
            screenshotUrl = `data:${proofFile.mimetype};base64,${b64}`;
        }
        const deposit = new this.depositModel({
            userId,
            email,
            amount: Number(createDepositDto.amount),
            paymentMethod: createDepositDto.paymentMethod,
            currency: createDepositDto.currency,
            cardNumber: createDepositDto.cardNumber,
            cardHolder: createDepositDto.cardHolder,
            walletAddress: createDepositDto.walletAddress,
            walletNetwork: createDepositDto.walletNetwork,
            bankId: createDepositDto.bankId,
            screenshotUrl,
            status: 'pending',
        });
        const savedDeposit = await deposit.save();
        // ⚠️ Manual approve is forbidden — only the Telegram bot can approve deposits.
        await this.telegramService.sendDepositNotification(savedDeposit);
        return this.mapDepositToDto(savedDeposit);
    }
    async getDepositsList(page = 1, limit = 20, status) {
        const skip = (page - 1) * limit;
        const filter = {};
        if (status) {
            filter.status = status;
        }
        const deposits = await this.depositModel
            .find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await this.depositModel.countDocuments(filter);
        return {
            deposits: deposits.map((deposit) => this.mapDepositToDto(deposit)),
            total,
            page,
            pageSize: limit,
        };
    }
    async getUserDeposits(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const deposits = await this.depositModel
            .find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await this.depositModel.countDocuments({ userId });
        return {
            deposits: deposits.map((deposit) => this.mapDepositToDto(deposit)),
            total,
            page,
            pageSize: limit,
        };
    }
    async getPendingDeposits() {
        return this.depositModel.find({ status: 'pending' }).sort({ createdAt: 1 });
    }
    mapDepositToDto(deposit) {
        return {
            id: deposit._id,
            userId: deposit.userId,
            amount: deposit.amount,
            paymentMethod: deposit.paymentMethod,
            currency: deposit.currency,
            status: deposit.status,
            screenshotUrl: deposit.screenshotUrl,
            approvedAt: deposit.approvedAt,
            rejectionReason: deposit.rejectionReason,
            createdAt: deposit.createdAt,
        };
    }
};
exports.DepositsService = DepositsService;
exports.DepositsService = DepositsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(deposit_schema_1.Deposit.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(2, (0, mongoose_1.InjectModel)(transaction_schema_1.Transaction.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        telegram_service_1.TelegramService])
], DepositsService);
//# sourceMappingURL=deposits.service.js.map