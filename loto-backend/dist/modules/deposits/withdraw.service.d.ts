import { Model } from 'mongoose';
import { WithdrawDocument } from '../../schemas/withdraw.schema';
import { UserDocument } from '../../schemas/user.schema';
import { TransactionDocument } from '../../schemas/transaction.schema';
import { TelegramService } from '../telegram/telegram.service';
import { CreateWithdrawDto, WithdrawDto, WithdrawListDto } from '../../dtos/withdraw.dto';
export declare class WithdrawService {
    private withdrawModel;
    private userModel;
    private transactionModel;
    private telegramService;
    constructor(withdrawModel: Model<WithdrawDocument>, userModel: Model<UserDocument>, transactionModel: Model<TransactionDocument>, telegramService: TelegramService);
    createWithdraw(createWithdrawDto: CreateWithdrawDto, userId: string, email: string): Promise<WithdrawDto>;
    /**
     * Called by the Telegram bot (or admin API) once approved.
     * Balance was already deducted at request time, so this just records
     * the transaction and finalizes status.
     */
    approveWithdraw(withdrawId: string, approvedBy: string): Promise<WithdrawDto>;
    /**
     * Called by the Telegram bot (or admin API) on rejection.
     * Refunds the reserved balance back to the user.
     */
    rejectWithdraw(withdrawId: string, rejectedBy: string, reason: string): Promise<WithdrawDto>;
    getUserWithdraws(userId: string, page?: number, limit?: number): Promise<WithdrawListDto>;
    getAllWithdraws(page?: number, limit?: number, status?: string): Promise<WithdrawListDto>;
    getPendingWithdraws(): Promise<WithdrawDocument[]>;
    private mapWithdrawToDto;
}
//# sourceMappingURL=withdraw.service.d.ts.map