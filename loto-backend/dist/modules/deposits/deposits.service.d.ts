import { Model } from 'mongoose';
import { Deposit, DepositDocument } from '../../schemas/deposit.schema';
import { UserDocument } from '../../schemas/user.schema';
import { TransactionDocument } from '../../schemas/transaction.schema';
import { TelegramService } from '../telegram/telegram.service';
import { CreateDepositDto, DepositDto, DepositListDto } from '../../dtos/deposit.dto';
export declare class DepositsService {
    private depositModel;
    private userModel;
    private transactionModel;
    private telegramService;
    constructor(depositModel: Model<DepositDocument>, userModel: Model<UserDocument>, transactionModel: Model<TransactionDocument>, telegramService: TelegramService);
    createDeposit(createDepositDto: CreateDepositDto, userId: string, email: string, proofFile?: Express.Multer.File): Promise<DepositDto>;
    getDepositsList(page?: number, limit?: number, status?: string): Promise<DepositListDto>;
    getUserDeposits(userId: string, page?: number, limit?: number): Promise<DepositListDto>;
    getPendingDeposits(): Promise<Deposit[]>;
    private mapDepositToDto;
}
//# sourceMappingURL=deposits.service.d.ts.map