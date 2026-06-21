import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DepositsService } from './deposits.service';
import { DepositsController } from './deposits.controller';
import { WithdrawService } from './withdraw.service';
import { WithdrawController } from './withdraw.controller';
import { Deposit, DepositSchema } from '../../schemas/deposit.schema';
import { Withdraw, WithdrawSchema } from '../../schemas/withdraw.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { Transaction, TransactionSchema } from '../../schemas/transaction.schema';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Deposit.name, schema: DepositSchema },
      { name: Withdraw.name, schema: WithdrawSchema },
      { name: User.name, schema: UserSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
    TelegramModule,
  ],
  controllers: [DepositsController, WithdrawController],
  providers: [DepositsService, WithdrawService],
  exports: [DepositsService, WithdrawService],
})
export class DepositsModule {}
