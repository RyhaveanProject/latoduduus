import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../schemas/user.schema';
import { Transaction, TransactionDocument } from '../../schemas/transaction.schema';
import {
  UpdateProfileDto,
  UserProfileDto,
  UserStatsDto,
  UserListDto,
} from '../../dtos/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
  ) {}

  async getUserProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
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

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<UserProfileDto> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      {
        $set: updateProfileDto,
      },
      { new: true },
    );

    if (!user) {
      throw new NotFoundException('User not found');
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

  async getUserStats(userId: string): Promise<UserStatsDto> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
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

  async getTransactionHistory(userId: string, page: number = 1, limit: number = 20) {
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

  async addBalance(userId: string, amount: number, description: string): Promise<number> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
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

  async deductBalance(userId: string, amount: number, description: string): Promise<number> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.balance < amount) {
      throw new ConflictException('Insufficient balance');
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

  async getUsersList(page: number = 1, limit: number = 20): Promise<UserListDto> {
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

  async getUserById(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateGameStats(
    userId: string,
    isWinner: boolean,
    winningsAmount: number = 0,
    entryFee: number = 0,
  ): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.gamesPlayed += 1;
    if (isWinner) {
      user.gamesWon += 1;
      user.totalWinnings += winningsAmount;
    }

    user.totalDeposited += entryFee;
    await user.save();
  }
}
