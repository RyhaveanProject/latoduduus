import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Withdraw, WithdrawDocument } from '../../schemas/withdraw.schema';
import { User, UserDocument } from '../../schemas/user.schema';
import { Transaction, TransactionDocument } from '../../schemas/transaction.schema';
import { TelegramService } from '../telegram/telegram.service';
import {
  CreateWithdrawDto,
  WithdrawDto,
  WithdrawListDto,
} from '../../dtos/withdraw.dto';

@Injectable()
export class WithdrawService {
  constructor(
    @InjectModel(Withdraw.name) private withdrawModel: Model<WithdrawDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    private telegramService: TelegramService,
  ) {}

  async createWithdraw(
    createWithdrawDto: CreateWithdrawDto,
    userId: string,
    email: string,
  ): Promise<WithdrawDto> {
    const { amount, paymentMethod, currency, cardNumber, walletAddress } = createWithdrawDto;

    if ((paymentMethod === 'bank' || paymentMethod === 'card') && !cardNumber) {
      throw new BadRequestException('cardNumber is required for bank/card withdrawals');
    }
    if (paymentMethod === 'crypto' && !walletAddress) {
      throw new BadRequestException('walletAddress is required for crypto withdrawals');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.balance < amount) {
      throw new BadRequestException('Insufficient balance for withdrawal');
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
  async approveWithdraw(withdrawId: string, approvedBy: string): Promise<WithdrawDto> {
    const withdraw = await this.withdrawModel.findById(withdrawId);
    if (!withdraw) {
      throw new NotFoundException('Withdraw not found');
    }

    if (withdraw.status !== 'pending') {
      throw new BadRequestException('Withdraw is not pending');
    }

    const user = await this.userModel.findById(withdraw.userId);
    if (!user) {
      throw new NotFoundException('User not found');
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
  async rejectWithdraw(withdrawId: string, rejectedBy: string, reason: string): Promise<WithdrawDto> {
    const withdraw = await this.withdrawModel.findById(withdrawId);
    if (!withdraw) {
      throw new NotFoundException('Withdraw not found');
    }

    if (withdraw.status !== 'pending') {
      throw new BadRequestException('Withdraw is not pending');
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

  async getUserWithdraws(userId: string, page: number = 1, limit: number = 20): Promise<WithdrawListDto> {
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

  async getAllWithdraws(page: number = 1, limit: number = 20, status?: string): Promise<WithdrawListDto> {
    const skip = (page - 1) * limit;
    const filter: any = {};

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

  async getPendingWithdraws(): Promise<WithdrawDocument[]> {
    return this.withdrawModel.find({ status: 'pending' }).sort({ createdAt: 1 });
  }

  private mapWithdrawToDto(withdraw: WithdrawDocument): WithdrawDto {
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
}
