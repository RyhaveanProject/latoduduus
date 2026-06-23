import { Module, OnModuleDestroy } from '@nestjs/common';
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
export class TelegramModule implements OnModuleDestroy {
  constructor(private telegramService: TelegramService) {}

  async onModuleDestroy(): Promise<void> {
    await this.telegramService.stopBot();
  }
}
