import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GamesModule } from '../modules/games/games.module';
import { RoomsModule } from '../modules/rooms/rooms.module';

@Module({
  imports: [GamesModule, RoomsModule],
  providers: [GameGateway],
  exports: [GameGateway],
})
export class GatewaysModule {}
