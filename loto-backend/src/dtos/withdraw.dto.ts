import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWithdrawDto {
  @ApiProperty()
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ enum: ['card', 'crypto'] })
  @IsEnum(['card', 'crypto'])
  paymentMethod: string;

  @ApiProperty({ enum: ['AZ', 'RU', 'TR', 'GE', 'EN', 'AR', 'CN'] })
  @IsEnum(['AZ', 'RU', 'TR', 'GE', 'EN', 'AR', 'CN'])
  currency: string;

  @ApiProperty({ required: false, description: 'Card number, required when paymentMethod is "card"' })
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
