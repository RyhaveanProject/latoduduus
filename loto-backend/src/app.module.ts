import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { GamesModule } from './modules/games/games.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { DepositsModule } from './modules/deposits/deposits.module';
import { AdminModule } from './modules/admin/admin.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { GatewaysModule } from './gateways/gateways.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/loto-db',
    ),
    AuthModule,
    UsersModule,
    GamesModule,
    RoomsModule,
    DepositsModule,
    AdminModule,
    TelegramModule,
    GatewaysModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
