import { Module, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { Deposit, DepositSchema } from '../../schemas/deposit.schema';
import { Withdraw, WithdrawSchema } from '../../schemas/withdraw.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { BotLog, BotLogSchema } from '../../schemas/bot-log.schema';
import { Transaction, TransactionSchema } from '../../schemas/transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Deposit.name, schema: DepositSchema },
      { name: Withdraw.name, schema: WithdrawSchema },
      { name: User.name, schema: UserSchema },
      { name: BotLog.name, schema: BotLogSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  controllers: [TelegramController],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramModule.name);

  constructor(private telegramService: TelegramService) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.telegramService.startBot();
      this.logger.log('✅ Telegram bot initialized');
    } catch (error) {
      this.logger.error('❌ Telegram bot initialization failed', error as any);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.telegramService.stopBot();
  }
}
