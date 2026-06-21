import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GamesService } from './games.service';
import { GamesController } from './games.controller';
import { Game, GameSchema } from '../../schemas/game.schema';
import { Ticket, TicketSchema } from '../../schemas/ticket.schema';
import { Room, RoomSchema } from '../../schemas/room.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { Transaction, TransactionSchema } from '../../schemas/transaction.schema';
import { GameEngineService } from '../../services/game-engine.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Game.name, schema: GameSchema },
      { name: Ticket.name, schema: TicketSchema },
      { name: Room.name, schema: RoomSchema },
      { name: User.name, schema: UserSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
    UsersModule,
  ],
  controllers: [GamesController],
  providers: [GamesService, GameEngineService],
  exports: [GamesService, GameEngineService],
})
export class GamesModule {}
