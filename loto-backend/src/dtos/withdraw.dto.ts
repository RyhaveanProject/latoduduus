import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateWithdrawDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ enum: ['bank', 'card', 'crypto'] })
  @IsEnum(['bank', 'card', 'crypto'])
  paymentMethod: string;

  @ApiProperty({ enum: ['AZN', 'RUB', 'TRY', 'GEL', 'USD'] })
  @IsEnum(['AZN', 'RUB', 'TRY', 'GEL', 'USD'])
  currency: string;

  @ApiProperty({ required: false, description: 'Card number, required when paymentMethod is "bank" or "card"' })
  @IsOptional()
  @IsString()
  cardNumber?: string;

  @ApiProperty({ required: false, description: 'Wallet address, required when paymentMethod is "crypto"' })
  @IsOptional()
  @IsString()
  walletAddress?: string;
}

export class ApproveWithdrawDto {
  @ApiProperty()
  @IsString()
  withdrawId: string;
}

export class RejectWithdrawDto {
  @ApiProperty()
  @IsString()
  withdrawId: string;

  @ApiProperty()
  @IsString()
  reason: string;
}

export class WithdrawDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  paymentMethod: string;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  rejectionReason?: string;

  @ApiProperty()
  approvedAt?: Date;

  @ApiProperty()
  createdAt: Date;
}

export class WithdrawListDto {
  @ApiProperty({ type: () => [WithdrawDto] })
  withdraws: WithdrawDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;
}
