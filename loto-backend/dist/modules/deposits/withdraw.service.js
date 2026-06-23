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
exports.WithdrawService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const withdraw_schema_1 = require("../../schemas/withdraw.schema");
const user_schema_1 = require("../../schemas/user.schema");
const transaction_schema_1 = require("../../schemas/transaction.schema");
const telegram_service_1 = require("../telegram/telegram.service");
let WithdrawService = class WithdrawService {
    constructor(withdrawModel, userModel, transactionModel, telegramService) {
        this.withdrawModel = withdrawModel;
        this.userModel = userModel;
        this.transactionModel = transactionModel;
        this.telegramService = telegramService;
    }
    async createWithdraw(createWithdrawDto, userId, email) {
        const { amount, paymentMethod, currency, cardNumber, walletAddress } = createWithdrawDto;
        if (paymentMethod === 'card' && !cardNumber) {
            throw new common_1.BadRequestException('cardNumber is required for card withdrawals');
        }
        if (paymentMethod === 'crypto' && !walletAddress) {
            throw new common_1.BadRequestException('walletAddress is required for crypto withdrawals');
        }
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.balance < amount) {
            throw new common_1.BadRequestException('Insufficient balance for withdrawal');
        }
        // Reserve the funds immediately so the user cannot spend them while the
        // withdrawal is pending Telegram bot approval.
        user.balance -= amount;
        await user.save();
        const withdraw = new this.withdrawModel({
            userId,
            email,
            amount,
            paymentMethod,
            currency,
            cardNumber,
            walletAddress,
            status: 'pending',
        });
        const savedWithdraw = await withdraw.save();
        // Notify the admin Telegram bot — only the bot can approve/reject.
        await this.telegramService.sendWithdrawNotification(savedWithdraw);
        return this.mapWithdrawToDto(savedWithdraw);
    }
    /**
     * Called by the Telegram bot (or admin API) once approved.
     * Balance was already deducted at request time, so this just records
     * the transaction and finalizes status.
     */
    async approveWithdraw(withdrawId, approvedBy) {
        const withdraw = await this.withdrawModel.findById(withdrawId);
        if (!withdraw) {
            throw new common_1.NotFoundException('Withdraw not found');
        }
        if (withdraw.status !== 'pending') {
            throw new common_1.BadRequestException('Withdraw is not pending');
        }
        const user = await this.userModel.findById(withdraw.userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const balanceBefore = user.balance;
        user.totalWithdrawn += withdraw.amount;
        await user.save();
        await this.transactionModel.create({
            userId: withdraw.userId,
            type: 'withdraw',
            amount: withdraw.amount,
            balanceBefore,
            balanceAfter: user.balance,
            relatedWithdrawId: withdraw._id,
            description: `Withdrawal approved: ${withdraw.paymentMethod} - ${withdraw.currency}`,
            status: 'completed',
        });
        withdraw.status = 'approved';
        withdraw.approvedAt = new Date();
        withdraw.approvedBy = approvedBy;
        const saved = await withdraw.save();
        return this.mapWithdrawToDto(saved);
    }
    /**
     * Called by the Telegram bot (or admin API) on rejection.
     * Refunds the reserved balance back to the user.
     */
    async rejectWithdraw(withdrawId, rejectedBy, reason) {
        const withdraw = await this.withdrawModel.findById(withdrawId);
        if (!withdraw) {
            throw new common_1.NotFoundException('Withdraw not found');
        }
        if (withdraw.status !== 'pending') {
            throw new common_1.BadRequestException('Withdraw is not pending');
        }
        const user = await this.userModel.findById(withdraw.userId);
        if (user) {
            const balanceBefore = user.balance;
            user.balance += withdraw.amount;
            await user.save();
            await this.transactionModel.create({
                userId: withdraw.userId,
                type: 'refund',
                amount: withdraw.amount,
                balanceBefore,
                balanceAfter: user.balance,
                relatedWithdrawId: withdraw._id,
                description: 'Withdrawal rejected, funds returned',
                status: 'completed',
            });
        }
        withdraw.status = 'rejected';
        withdraw.rejectionReason = reason;
        withdraw.rejectedAt = new Date();
        withdraw.approvedBy = rejectedBy;
        const saved = await withdraw.save();
        return this.mapWithdrawToDto(saved);
    }
    async getUserWithdraws(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const withdraws = await this.withdrawModel
            .find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await this.withdrawModel.countDocuments({ userId });
        return {
            withdraws: withdraws.map((w) => this.mapWithdrawToDto(w)),
            total,
            page,
            pageSize: limit,
        };
    }
    async getAllWithdraws(page = 1, limit = 20, status) {
        const skip = (page - 1) * limit;
        const filter = {};
        if (status) {
            filter.status = status;
        }
        const withdraws = await this.withdrawModel
            .find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await this.withdrawModel.countDocuments(filter);
        return {
            withdraws: withdraws.map((w) => this.mapWithdrawToDto(w)),
            total,
            page,
            pageSize: limit,
        };
    }
    async getPendingWithdraws() {
        return this.withdrawModel.find({ status: 'pending' }).sort({ createdAt: 1 });
    }
    mapWithdrawToDto(withdraw) {
        return {
            id: withdraw._id,
            userId: withdraw.userId,
            amount: withdraw.amount,
            paymentMethod: withdraw.paymentMethod,
            currency: withdraw.currency,
            status: withdraw.status,
            rejectionReason: withdraw.rejectionReason,
            approvedAt: withdraw.approvedAt,
            createdAt: withdraw.createdAt,
        };
    }
};
exports.WithdrawService = WithdrawService;
exports.WithdrawService = WithdrawService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(withdraw_schema_1.Withdraw.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(2, (0, mongoose_1.InjectModel)(transaction_schema_1.Transaction.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        telegram_service_1.TelegramService])
], WithdrawService);
//# sourceMappingURL=withdraw.service.js.map