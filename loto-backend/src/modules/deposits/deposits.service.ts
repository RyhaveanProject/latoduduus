import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Deposit, DepositDocument } from '../../schemas/deposit.schema';
import { User, UserDocument } from '../../schemas/user.schema';
import { Transaction, TransactionDocument } from '../../schemas/transaction.schema';
import { TelegramService } from '../telegram/telegram.service';
import {
  CreateDepositDto,
  ApproveDepositDto,
  RejectDepositDto,
  DepositDto,
  DepositListDto,
} from '../../dtos/deposit.dto';

@Injectable()
export class DepositsService {
  constructor(
    @InjectModel(Deposit.name) private depositModel: Model<DepositDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    private telegramService: TelegramService,
  ) {}

  async createDeposit(createDepositDto: CreateDepositDto, userId: string, email: string): Promise<DepositDto> {
    const deposit = new this.depositModel({
      userId,
      email,
      amount: createDepositDto.amount,
      paymentMethod: createDepositDto.paymentMethod,
      currency: createDepositDto.currency,
      cardNumber: createDepositDto.cardNumber,
      cardHolder: createDepositDto.cardHolder,
      walletAddress: createDepositDto.walletAddress,
      screenshotUrl: createDepositDto.screenshotUrl,
      status: 'pending',
    });

    const savedDeposit = await deposit.save();

    // ⚠️ Manual approve is forbidden — only the Telegram bot can approve deposits.
    await this.telegramService.sendDepositNotification(savedDeposit);

    return this.mapDepositToDto(savedDeposit);
  }

  async getDepositsList(page: number = 1, limit: number = 20, status?: string): Promise<DepositListDto> {
    const skip = (page - 1) * limit;
    const filter: any = {};

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

  async getUserDeposits(userId: string, page: number = 1, limit: number = 20): Promise<DepositListDto> {
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

  async getPendingDeposits(): Promise<Deposit[]> {
    return this.depositModel.find({ status: 'pending' }).sort({ createdAt: 1 });
  }

  private mapDepositToDto(deposit: DepositDocument): DepositDto {
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
}
