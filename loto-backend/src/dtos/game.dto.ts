import { IsString, IsNumber, IsArray, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGameDto {
  @ApiProperty()
  @IsString()
  roomId: string;

  @ApiProperty()
  @IsNumber()
  entryFee: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  maxPlayers: number;
}

export class GenerateCardDto {
  @ApiProperty()
  @IsString()
  gameId: string;

  @ApiProperty()
  @IsString()
  userId: string;
}

export class DrawNumberDto {
  @ApiProperty()
  @IsString()
  gameId: string;

  @ApiProperty()
  @IsNumber()
  number: number;
}

export class CheckWinnerDto {
  @ApiProperty()
  @IsString()
  gameId: string;

  @ApiProperty()
  @IsString()
  ticketId: string;

  @ApiProperty({ enum: ['stage1', 'stage2', 'stage3'] })
  @IsEnum(['stage1', 'stage2', 'stage3'])
  stage: string;
}

export class GameCard {
  @ApiProperty()
  row: number;

  @ApiProperty({ example: [1, 2, 3, 4, 5] })
  numbers: number[];
}

export class LottoCard {
  @ApiProperty({ type: () => [GameCard] })
  card: GameCard[];
}

export class GameTicket {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  gameId: string;

  @ApiProperty()
  roomId: string;

  @ApiProperty({ type: () => [GameCard] })
  card: GameCard[];

  @ApiProperty()
  markedNumbers: number[];

  @ApiProperty()
  stage1Completed: boolean;

  @ApiProperty()
  stage2Completed: boolean;

  @ApiProperty()
  stage3Completed: boolean;
}

export class GameStateDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  roomId: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  drawNumbers: number[];

  @ApiProperty()
  stage1Winners: string[];

  @ApiProperty()
  stage2Winners: string[];

  @ApiProperty()
  stage3Winners: string[];

  @ApiProperty()
  totalPool: number;

  @ApiProperty()
  stage1Prize?: number;

  @ApiProperty()
  stage2Prize?: number;

  @ApiProperty()
  stage3Prize?: number;
}
