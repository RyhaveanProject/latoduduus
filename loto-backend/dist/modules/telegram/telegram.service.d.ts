import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { DepositDocument } from '../../schemas/deposit.schema';
import { WithdrawDocument } from '../../schemas/withdraw.schema';
import { UserDocument } from '../../schemas/user.schema';
import { BotLogDocument } from '../../schemas/bot-log.schema';
import { TransactionDocument } from '../../schemas/transaction.schema';
export declare class TelegramService {
    private configService;
    private depositModel;
    private withdrawModel;
    private userModel;
    private botLogModel;
    private transactionModel;
    private bot;
    private adminChatId;
    private readonly logger;
    private photoMessageIds;
    constructor(configService: ConfigService, depositModel: Model<DepositDocument>, withdrawModel: Model<WithdrawDocument>, userModel: Model<UserDocument>, botLogModel: Model<BotLogDocument>, transactionModel: Model<TransactionDocument>);
    private initializeBot;
    startBot(): Promise<void>;
    private startPolling;
    stopBot(): Promise<void>;
    handleWebhookUpdate(update: any): Promise<void>;
    sendDepositNotification(deposit: DepositDocument): Promise<void>;
    sendWithdrawNotification(withdraw: WithdrawDocument): Promise<void>;
    private editBotMessage;
    private handleApproveDeposit;
    private handleRejectDeposit;
    private handleApproveWithdraw;
    private handleRejectWithdraw;
    private logBotAction;
}
//# sourceMappingURL=telegram.service.d.ts.map