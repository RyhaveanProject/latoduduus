import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateDepositDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  amount: number;

  @ApiProperty({ enum: ['bank', 'crypto'] })
  @IsEnum(['bank', 'crypto'])
  paymentMethod: string;

  @ApiProperty({ enum: ['AZN', 'RUB', 'TRY', 'GEL', 'USD'] })
  @IsEnum(['AZN', 'RUB', 'TRY', 'GEL', 'USD'])
  currency: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cardNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cardHolder?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  walletAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  screenshotUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bankId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  walletNetwork?: string;
}

export class ApproveDepositDto {
  @ApiProperty()
  @IsString()
  depositId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectDepositDto {
  @ApiProperty()
  @IsString()
  depositId: string;

  @ApiProperty()
  @IsString()
  reason: string;
}

export class DepositListDto {
  @ApiProperty()
  deposits: DepositDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;
}

export class DepositDto {
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
  screenshotUrl?: string;

  @ApiProperty()
  approvedAt?: Date;

  @ApiProperty()
  rejectionReason?: string;

  @ApiProperty()
  createdAt: Date;
}
