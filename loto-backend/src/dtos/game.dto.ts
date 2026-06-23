import { IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGameDto {
  @ApiProperty()
  @IsString()
  roomId!: string;

  @ApiProperty({ required: false, default: 0 })
  @IsNumber()
  entryFee!: number;

  @ApiProperty({ required: false, default: 6 })
  @IsNumber()
  maxPlayers!: number;
}

export class GameCard {
  @ApiProperty()
  row!: number;

  @ApiProperty({ example: [0, 12, 0, 0, 49, 53, 0, 77, 88] })
  cells!: number[];

  @ApiProperty({ example: [12, 49, 53, 77, 88] })
  numbers!: number[];
}

export class GameTicketDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  gameId!: string;

  @ApiProperty()
  roomId!: string;

  @ApiProperty({ type: () => [GameCard] })
  card!: GameCard[];

  @ApiProperty()
  markedNumbers!: number[];

  @ApiProperty()
  boardIndex!: number;
}

export class GameStateDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  roomId!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  drawNumbers!: number[];

  @ApiProperty()
  drawnNumbers!: number[];

  @ApiProperty()
  currentDrawIndex!: number;

  @ApiProperty({ required: false })
  currentNumber?: number | null;

  @ApiProperty()
  totalPool!: number;

  @ApiProperty()
  commissionRate!: number;

  @ApiProperty()
  commissionAmount!: number;

  @ApiProperty()
  payoutAmount!: number;

  @ApiProperty({ required: false })
  winnerId?: string;

  @ApiProperty({ required: false })
  winnerType?: 'real' | 'bot' | null;

  @ApiProperty({ required: false })
  winnerName?: string;

  @ApiProperty({ required: false })
  completedAt?: Date;
}
