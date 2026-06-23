"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const bcrypt = __importStar(require("bcryptjs"));
const admin_schema_1 = require("../../schemas/admin.schema");
const user_schema_1 = require("../../schemas/user.schema");
const deposit_schema_1 = require("../../schemas/deposit.schema");
const withdraw_schema_1 = require("../../schemas/withdraw.schema");
const bot_log_schema_1 = require("../../schemas/bot-log.schema");
let AdminService = class AdminService {
    constructor(adminModel, userModel, depositModel, withdrawModel, botLogModel) {
        this.adminModel = adminModel;
        this.userModel = userModel;
        this.depositModel = depositModel;
        this.withdrawModel = withdrawModel;
        this.botLogModel = botLogModel;
    }
    async createAdmin(createAdminDto) {
        const { email, password } = createAdminDto;
        // Check if admin exists
        const existingAdmin = await this.adminModel.findOne({ email });
        if (existingAdmin) {
            throw new common_1.ConflictException('Admin with this email already exists');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = new this.adminModel({
            email,
            password: hashedPassword,
            firstName: createAdminDto.firstName,
            lastName: createAdminDto.lastName,
            permissions: createAdminDto.permissions || ['view_users', 'view_games'],
            isSuperAdmin: createAdminDto.isSuperAdmin || false,
            isActive: true,
        });
        const savedAdmin = await admin.save();
        return this.mapAdminToDto(savedAdmin);
    }
    async updateAdmin(adminId, updateAdminDto) {
        const admin = await this.adminModel.findByIdAndUpdate(adminId, { $set: updateAdminDto }, { new: true });
        if (!admin) {
            throw new common_1.NotFoundException('Admin not found');
        }
        return this.mapAdminToDto(admin);
    }
    async banUser(banUserDto) {
        const user = await this.userModel.findById(banUserDto.userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        user.isBanned = true;
        user.bannedReason = banUserDto.reason;
        await user.save();
    }
    async unbanUser(userId) {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        user.isBanned = false;
        user.bannedReason = undefined;
        await user.save();
    }
    async setUserBalance(setBalanceDto) {
        const user = await this.userModel.findById(setBalanceDto.userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        user.balance = setBalanceDto.amount;
        await user.save();
    }
    async getAdminStats() {
        const totalUsers = await this.userModel.countDocuments();
        const bannedUsers = await this.userModel.countDocuments({ isBanned: true });
        const totalDeposits = await this.depositModel.countDocuments();
        const totalWithdraws = await this.withdrawModel.countDocuments();
        const pendingDeposits = await this.depositModel.countDocuments({ status: 'pending' });
        const pendingWithdraws = await this.withdrawModel.countDocuments({ status: 'pending' });
        const approvedDepositsData = await this.depositModel.aggregate([
            { $match: { status: 'approved' } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const approvedWithdrawsData = await this.withdrawModel.aggregate([
            { $match: { status: 'approved' } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const totalRevenue = (approvedDepositsData[0]?.total || 0) - (approvedWithdrawsData[0]?.total || 0);
        return {
            totalUsers,
            totalActiveGames: 0, // Would need game service integration
            totalRevenue,
            totalDeposits,
            totalWithdraws,
            pendingDeposits,
            pendingWithdraws,
            bannedUsers,
            totalRooms: 0, // Would need room service integration
            activeRooms: 0, // Would need room service integration
        };
    }
    async getAdminsList(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const admins = await this.adminModel
            .find()
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await this.adminModel.countDocuments();
        return {
            admins: admins.map((admin) => this.mapAdminToDto(admin)),
            total,
            page,
            pageSize: limit,
        };
    }
    async getUsersList(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const users = await this.userModel
            .find()
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await this.userModel.countDocuments();
        return {
            users,
            total,
            page,
            pageSize: limit,
        };
    }
    async getDepositsHistory(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const deposits = await this.depositModel
            .find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await this.depositModel.countDocuments();
        return {
            deposits,
            total,
            page,
            pageSize: limit,
        };
    }
    async getWithdrawsHistory(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const withdraws = await this.withdrawModel
            .find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await this.withdrawModel.countDocuments();
        return {
            withdraws,
            total,
            page,
            pageSize: limit,
        };
    }
    async getTelegramLogs(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const logs = await this.botLogModel
            .find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await this.botLogModel.countDocuments();
        return {
            logs,
            total,
            page,
            pageSize: limit,
        };
    }
    mapAdminToDto(admin) {
        return {
            id: admin._id,
            email: admin.email,
            firstName: admin.firstName,
            lastName: admin.lastName,
            permissions: admin.permissions,
            isSuperAdmin: admin.isSuperAdmin,
            isActive: admin.isActive,
            lastLoginAt: admin.lastLoginAt,
            createdAt: admin.createdAt,
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(admin_schema_1.Admin.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(2, (0, mongoose_1.InjectModel)(deposit_schema_1.Deposit.name)),
    __param(3, (0, mongoose_1.InjectModel)(withdraw_schema_1.Withdraw.name)),
    __param(4, (0, mongoose_1.InjectModel)(bot_log_schema_1.BotLog.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], AdminService);
//# sourceMappingURL=admin.service.js.map