import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Admin, AdminDocument } from '../../schemas/admin.schema';
import { User, UserDocument } from '../../schemas/user.schema';
import { Deposit, DepositDocument } from '../../schemas/deposit.schema';
import { Withdraw, WithdrawDocument } from '../../schemas/withdraw.schema';
import { BotLog, BotLogDocument } from '../../schemas/bot-log.schema';
import { Transaction, TransactionDocument } from '../../schemas/transaction.schema';
import {
  CreateAdminDto,
  UpdateAdminDto,
  BanUserDto,
  SetBalanceDto,
  AdminStatsDto,
  AdminDto,
  AdminListDto,
} from '../../dtos/admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Deposit.name) private depositModel: Model<DepositDocument>,
    @InjectModel(Withdraw.name) private withdrawModel: Model<WithdrawDocument>,
    @InjectModel(BotLog.name) private botLogModel: Model<BotLogDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
  ) {}

  async createAdmin(createAdminDto: CreateAdminDto): Promise<AdminDto> {
    const email = createAdminDto.email.trim().toLowerCase();
    const existingAdmin = await this.adminModel.findOne({ email });
    if (existingAdmin) {
      throw new ConflictException('Admin with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createAdminDto.password, 10);

    const admin = new this.adminModel({
      email,
      password: hashedPassword,
      firstName: createAdminDto.firstName,
      lastName: createAdminDto.lastName,
      permissions: createAdminDto.permissions || [
        'view_users',
        'manage_users',
        'manage_deposits',
        'manage_withdraws',
      ],
      isSuperAdmin: createAdminDto.isSuperAdmin || false,
      isActive: true,
    });

    const savedAdmin = await admin.save();
    return this.mapAdminToDto(savedAdmin);
  }

  async updateAdmin(adminId: string, updateAdminDto: UpdateAdminDto): Promise<AdminDto> {
    const admin = await this.adminModel.findByIdAndUpdate(
      adminId,
      { $set: updateAdminDto },
      { new: true },
    );

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return this.mapAdminToDto(admin);
  }

  async banUser(banUserDto: BanUserDto): Promise<void> {
    const user = await this.userModel.findById(banUserDto.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isBanned = true;
    user.bannedReason = banUserDto.reason?.trim() || 'Blocked by admin';
    await user.save();
  }

  async unbanUser(userId: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isBanned = false;
    user.bannedReason = undefined;
    await user.save();
  }

  async setUserBalance(setBalanceDto: SetBalanceDto) {
    const user = await this.userModel.findById(setBalanceDto.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const operation = setBalanceDto.operation || 'set';
    const amount = Number(setBalanceDto.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      throw new BadRequestException('Invalid amount');
    }

    const balanceBefore = user.balance;
    let balanceAfter = balanceBefore;

    if (operation === 'set') {
      balanceAfter = amount;
    } else if (operation === 'increase') {
      balanceAfter = balanceBefore + amount;
    } else if (operation === 'decrease') {
      if (balanceBefore < amount) {
        throw new BadRequestException('Insufficient balance for decrease operation');
      }
      balanceAfter = balanceBefore - amount;
    }

    user.balance = balanceAfter;
    await user.save();

    const delta = balanceAfter - balanceBefore;
    if (delta !== 0) {
      await this.transactionModel.create({
        userId: user._id,
        type: delta > 0 ? 'deposit' : 'withdraw',
        amount: Math.abs(delta),
        balanceBefore,
        balanceAfter,
        description: setBalanceDto.reason?.trim() || `Admin balance adjustment (${operation})`,
        status: 'completed',
      });
    }

    return {
      message: 'Balance updated successfully',
      userId: user._id,
      balanceBefore,
      balanceAfter,
      operation,
    };
  }

  async getAdminStats(): Promise<AdminStatsDto> {
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

    const totalRevenue =
      (approvedDepositsData[0]?.total || 0) - (approvedWithdrawsData[0]?.total || 0);

    return {
      totalUsers,
      totalActiveGames: 0,
      totalRevenue,
      totalDeposits,
      totalWithdraws,
      pendingDeposits,
      pendingWithdraws,
      bannedUsers,
      totalRooms: 0,
      activeRooms: 0,
    };
  }

  async getAdminsList(page: number = 1, limit: number = 20): Promise<AdminListDto> {
    const safePage = Number(page) || 1;
    const safeLimit = Number(limit) || 20;
    const skip = (safePage - 1) * safeLimit;

    const admins = await this.adminModel
      .find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit);

    const total = await this.adminModel.countDocuments();

    return {
      admins: admins.map((admin) => this.mapAdminToDto(admin)),
      total,
      page: safePage,
      pageSize: safeLimit,
    };
  }

  async getUsersList(page: number = 1, limit: number = 20, search?: string) {
    const safePage = Number(page) || 1;
    const safeLimit = Number(limit) || 20;
    const skip = (safePage - 1) * safeLimit;

    const filter: FilterQuery<UserDocument> = {};
    const normalizedSearch = search?.trim();

    if (normalizedSearch) {
      const escaped = normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [
        { email: regex },
        { firstName: regex },
        { lastName: regex },
        { _id: regex },
      ] as any;
    }

    const users = await this.userModel
      .find(filter)
      .select('-password -emailVerificationToken -twoFactorSecret')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .exec();

    const total = await this.userModel.countDocuments(filter);

    return {
      users: users.map((user) => ({
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        balance: user.balance,
        role: user.role,
        phoneNumber: user.phoneNumber,
        country: user.country,
        city: user.city,
        language: user.language,
        emailVerified: user.emailVerified,
        isBanned: user.isBanned,
        bannedReason: user.bannedReason,
        gamesPlayed: user.gamesPlayed,
        gamesWon: user.gamesWon,
        totalWinnings: user.totalWinnings,
        totalDeposited: user.totalDeposited,
        totalWithdrawn: user.totalWithdrawn,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      })),
      total,
      page: safePage,
      pageSize: safeLimit,
    };
  }

  async getDepositsHistory(page: number = 1, limit: number = 20) {
    const safePage = Number(page) || 1;
    const safeLimit = Number(limit) || 20;
    const skip = (safePage - 1) * safeLimit;

    const deposits = await this.depositModel
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean();

    const total = await this.depositModel.countDocuments();

    return {
      deposits: deposits.map((deposit) => ({
        id: deposit._id,
        userId: deposit.userId,
        userEmail: deposit.email,
        email: deposit.email,
        amount: deposit.amount,
        currency: deposit.currency,
        paymentMethod: deposit.paymentMethod,
        status: deposit.status,
        screenshotUrl: deposit.screenshotUrl,
        approvedAt: deposit.approvedAt,
        rejectionReason: deposit.rejectionReason,
        createdAt: deposit.createdAt,
      })),
      total,
      page: safePage,
      pageSize: safeLimit,
    };
  }

  async getWithdrawsHistory(page: number = 1, limit: number = 20) {
    const safePage = Number(page) || 1;
    const safeLimit = Number(limit) || 20;
    const skip = (safePage - 1) * safeLimit;

    const withdraws = await this.withdrawModel
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean();

    const total = await this.withdrawModel.countDocuments();

    return {
      withdraws: withdraws.map((withdraw) => ({
        id: withdraw._id,
        userId: withdraw.userId,
        userEmail: withdraw.email,
        email: withdraw.email,
        amount: withdraw.amount,
        currency: withdraw.currency,
        paymentMethod: withdraw.paymentMethod,
        cardNumber: withdraw.cardNumber,
        walletAddress: withdraw.walletAddress,
        status: withdraw.status,
        rejectionReason: withdraw.rejectionReason,
        approvedAt: withdraw.approvedAt,
        createdAt: withdraw.createdAt,
      })),
      total,
      page: safePage,
      pageSize: safeLimit,
    };
  }

  async getTelegramLogs(page: number = 1, limit: number = 20) {
    const safePage = Number(page) || 1;
    const safeLimit = Number(limit) || 20;
    const skip = (safePage - 1) * safeLimit;

    const logs = await this.botLogModel
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean();

    const total = await this.botLogModel.countDocuments();

    return {
      logs: logs.map((log) => ({
        id: log._id,
        event: log.action,
        message: log.messageText,
        amount: log.amount,
        status: log.status,
        relatedUserId: log.relatedUserId,
        messageId: log.messageId,
        createdAt: (log as any).createdAt,
      })),
      total,
      page: safePage,
      pageSize: safeLimit,
    };
  }

  private mapAdminToDto(admin: AdminDocument): AdminDto {
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
}
