import { IsString, IsNumber, IsEnum, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDepositDto {
  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty({ enum: ['card', 'crypto'] })
  @IsEnum(['card', 'crypto'])
  paymentMethod: string;

  @ApiProperty({ enum: ['AZ', 'RU', 'TR', 'GE', 'EN', 'AR', 'CN'] })
  @IsEnum(['AZ', 'RU', 'TR', 'GE', 'EN', 'AR', 'CN'])
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

  @ApiProperty()
  @IsString()
  screenshotUrl: string;
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
