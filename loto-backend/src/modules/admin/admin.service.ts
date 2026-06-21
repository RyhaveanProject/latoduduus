import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Admin, AdminDocument } from '../../schemas/admin.schema';
import { User, UserDocument } from '../../schemas/user.schema';
import { Deposit, DepositDocument } from '../../schemas/deposit.schema';
import { Withdraw, WithdrawDocument } from '../../schemas/withdraw.schema';
import { BotLog, BotLogDocument } from '../../schemas/bot-log.schema';
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
  ) {}

  async createAdmin(createAdminDto: CreateAdminDto): Promise<AdminDto> {
    const { email, password } = createAdminDto;

    // Check if admin exists
    const existingAdmin = await this.adminModel.findOne({ email });
    if (existingAdmin) {
      throw new ConflictException('Admin with this email already exists');
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
    user.bannedReason = banUserDto.reason;
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

  async setUserBalance(setBalanceDto: SetBalanceDto): Promise<void> {
    const user = await this.userModel.findById(setBalanceDto.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.balance = setBalanceDto.amount;
    await user.save();
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

  async getAdminsList(page: number = 1, limit: number = 20): Promise<AdminListDto> {
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

  async getUsersList(page: number = 1, limit: number = 20): Promise<any> {
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

  async getDepositsHistory(page: number = 1, limit: number = 20): Promise<any> {
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

  async getWithdrawsHistory(page: number = 1, limit: number = 20): Promise<any> {
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

  async getTelegramLogs(page: number = 1, limit: number = 20): Promise<any> {
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
