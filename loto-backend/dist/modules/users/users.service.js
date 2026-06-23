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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../../schemas/user.schema");
const transaction_schema_1 = require("../../schemas/transaction.schema");
let UsersService = class UsersService {
    constructor(userModel, transactionModel) {
        this.userModel = userModel;
        this.transactionModel = transactionModel;
    }
    async getUserProfile(userId) {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
            balance: user.balance,
            phoneNumber: user.phoneNumber,
            country: user.country,
            city: user.city,
            language: user.language,
            emailVerified: user.emailVerified,
            gamesPlayed: user.gamesPlayed,
            gamesWon: user.gamesWon,
            totalWinnings: user.totalWinnings,
            totalDeposited: user.totalDeposited,
            totalWithdrawn: user.totalWithdrawn,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
        };
    }
    async updateProfile(userId, updateProfileDto) {
        const user = await this.userModel.findByIdAndUpdate(userId, {
            $set: updateProfileDto,
        }, { new: true });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
            balance: user.balance,
            phoneNumber: user.phoneNumber,
            country: user.country,
            city: user.city,
            language: user.language,
            emailVerified: user.emailVerified,
            gamesPlayed: user.gamesPlayed,
            gamesWon: user.gamesWon,
            totalWinnings: user.totalWinnings,
            totalDeposited: user.totalDeposited,
            totalWithdrawn: user.totalWithdrawn,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
        };
    }
    async getUserStats(userId) {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const winRate = user.gamesPlayed > 0
            ? (user.gamesWon / user.gamesPlayed) * 100
            : 0;
        return {
            gamesPlayed: user.gamesPlayed,
            gamesWon: user.gamesWon,
            totalWinnings: user.totalWinnings,
            totalDeposited: user.totalDeposited,
            totalWithdrawn: user.totalWithdrawn,
            currentBalance: user.balance,
            winRate: Math.round(winRate * 100) / 100,
        };
    }
    async getTransactionHistory(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const transactions = await this.transactionModel
            .find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec();
        const total = await this.transactionModel.countDocuments({ userId });
        return {
            transactions,
            total,
            page,
            pageSize: limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async addBalance(userId, amount, description) {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const balanceBefore = user.balance;
        user.balance += amount;
        await user.save();
        // Create transaction record
        await this.transactionModel.create({
            userId,
            type: 'deposit',
            amount,
            balanceBefore,
            balanceAfter: user.balance,
            description,
            status: 'completed',
        });
        return user.balance;
    }
    async deductBalance(userId, amount, description) {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.balance < amount) {
            throw new common_1.ConflictException('Insufficient balance');
        }
        const balanceBefore = user.balance;
        user.balance -= amount;
        await user.save();
        // Create transaction record
        await this.transactionModel.create({
            userId,
            type: 'game_entry',
            amount,
            balanceBefore,
            balanceAfter: user.balance,
            description,
            status: 'completed',
        });
        return user.balance;
    }
    async getUsersList(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const users = await this.userModel
            .find()
            .select('-password -emailVerificationToken -twoFactorSecret')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec();
        const total = await this.userModel.countDocuments();
        const mappedUsers = users.map(user => ({
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
            balance: user.balance,
            phoneNumber: user.phoneNumber,
            country: user.country,
            city: user.city,
            language: user.language,
            emailVerified: user.emailVerified,
            gamesPlayed: user.gamesPlayed,
            gamesWon: user.gamesWon,
            totalWinnings: user.totalWinnings,
            totalDeposited: user.totalDeposited,
            totalWithdrawn: user.totalWithdrawn,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
        }));
        return {
            users: mappedUsers,
            total,
            page,
            pageSize: limit,
        };
    }
    async getUserById(userId) {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async updateGameStats(userId, isWinner, winningsAmount = 0, entryFee = 0) {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        user.gamesPlayed += 1;
        if (isWinner) {
            user.gamesWon += 1;
            user.totalWinnings += winningsAmount;
        }
        user.totalDeposited += entryFee;
        await user.save();
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(transaction_schema_1.Transaction.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], UsersService);
//# sourceMappingURL=users.service.js.map