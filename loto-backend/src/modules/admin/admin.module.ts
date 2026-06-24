import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { Admin, AdminSchema } from '../../schemas/admin.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { Deposit, DepositSchema } from '../../schemas/deposit.schema';
import { Withdraw, WithdrawSchema } from '../../schemas/withdraw.schema';
import { BotLog, BotLogSchema } from '../../schemas/bot-log.schema';
import { Transaction, TransactionSchema } from '../../schemas/transaction.schema';
import { Room, RoomSchema } from '../../schemas/room.schema';
import { Game, GameSchema } from '../../schemas/game.schema';
import { DepositsModule } from '../deposits/deposits.module';

@Module({
  imports: [
    DepositsModule,
    MongooseModule.forFeature([
      { name: Admin.name, schema: AdminSchema },
      { name: User.name, schema: UserSchema },
      { name: Deposit.name, schema: DepositSchema },
      { name: Withdraw.name, schema: WithdrawSchema },
      { name: BotLog.name, schema: BotLogSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: Room.name, schema: RoomSchema },
      { name: Game.name, schema: GameSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
