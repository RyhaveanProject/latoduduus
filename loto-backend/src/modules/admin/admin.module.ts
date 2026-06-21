import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { Admin, AdminSchema } from '../../schemas/admin.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { Deposit, DepositSchema } from '../../schemas/deposit.schema';
import { Withdraw, WithdrawSchema } from '../../schemas/withdraw.schema';
import { BotLog, BotLogSchema } from '../../schemas/bot-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Admin.name, schema: AdminSchema },
      { name: User.name, schema: UserSchema },
      { name: Deposit.name, schema: DepositSchema },
      { name: Withdraw.name, schema: WithdrawSchema },
      { name: BotLog.name, schema: BotLogSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
