import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({ enum: ['public', 'private'] })
  @IsEnum(['public', 'private'])
  visibility!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  roomCode?: string;

  @ApiProperty()
  @IsNumber()
  entryFee!: number;

  @ApiProperty({ default: 6 })
  @IsNumber()
  maxPlayers!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  requiresVerification?: boolean;
}

export class JoinRoomDto {
  @ApiProperty()
  @IsString()
  roomId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  roomCode?: string;
}

export class UpdateRoomDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  maxPlayers?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(['waiting', 'countdown', 'active', 'finished'])
  status?: string;
}

export class SendMessageDto {
  @ApiProperty()
  @IsString()
  roomId!: string;

  @ApiProperty()
  @IsString()
  message!: string;
}

export class RoomPlayerDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  firstName?: string;

  @ApiProperty()
  avatar?: string;

  @ApiProperty()
  balance!: number;

  @ApiProperty()
  gamesWon!: number;

  @ApiProperty({ default: false })
  isBot?: boolean;
}

export class RoomMessageDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty()
  username!: string;

  @ApiProperty()
  message!: string;

  @ApiProperty()
  timestamp!: Date;
}

export class RoomDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  visibility!: string;

  @ApiProperty()
  ownerId!: string;

  @ApiProperty({ type: () => [RoomPlayerDto] })
  players!: RoomPlayerDto[];

  @ApiProperty()
  spectators!: string[];

  @ApiProperty()
  entryFee!: number;

  @ApiProperty()
  maxPlayers!: number;

  @ApiProperty()
  currentPlayers!: number;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  totalPrizePool!: number;

  @ApiProperty({ type: () => [RoomMessageDto] })
  messages!: RoomMessageDto[];

  @ApiProperty({ required: false })
  currentGameId?: string;

  @ApiProperty({ required: false })
  countdownStartedAt?: Date;

  @ApiProperty({ required: false })
  countdownEndsAt?: Date;

  @ApiProperty({ required: false })
  lastWinnerName?: string;

  @ApiProperty()
  createdAt!: Date;
}

export class RoomListDto {
  @ApiProperty()
  rooms!: RoomDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;
}
