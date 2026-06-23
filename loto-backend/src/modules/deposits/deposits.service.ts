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

  async createDeposit(
    createDepositDto: CreateDepositDto,
    userId: string,
    email: string,
    proofFile?: Express.Multer.File,
  ): Promise<DepositDto> {
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

  async approveDeposit(depositId: string, approvedBy: string): Promise<DepositDto> {
    const deposit = await this.depositModel.findById(depositId);
    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }

    if (deposit.status !== 'pending') {
      throw new BadRequestException('Deposit is not pending');
    }

    const user = await this.userModel.findById(deposit.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const balanceBefore = user.balance;
    user.balance += deposit.amount;
    user.totalDeposited += deposit.amount;
    await user.save();

    await this.transactionModel.create({
      userId: deposit.userId,
      type: 'deposit',
      amount: deposit.amount,
      balanceBefore,
      balanceAfter: user.balance,
      relatedDepositId: deposit._id,
      description: `Deposit approved: ${deposit.paymentMethod} - ${deposit.currency}`,
      status: 'completed',
    });

    deposit.status = 'approved';
    deposit.approvedAt = new Date();
    deposit.approvedBy = approvedBy;
    const savedDeposit = await deposit.save();

    return this.mapDepositToDto(savedDeposit);
  }

  async rejectDeposit(depositId: string, rejectedBy: string, reason: string): Promise<DepositDto> {
    const deposit = await this.depositModel.findById(depositId);
    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }

    if (deposit.status !== 'pending') {
      throw new BadRequestException('Deposit is not pending');
    }

    deposit.status = 'rejected';
    deposit.rejectedAt = new Date();
    deposit.rejectionReason = reason;
    deposit.approvedBy = rejectedBy;
    const savedDeposit = await deposit.save();

    return this.mapDepositToDto(savedDeposit);
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
