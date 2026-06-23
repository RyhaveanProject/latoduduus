import {
  IsString,
  IsOptional,
  IsEmail,
  IsNumber,
  IsArray,
  IsBoolean,
  IsEnum,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateAdminDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  password: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  permissions?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isSuperAdmin?: boolean;
}

export class UpdateAdminDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  permissions?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class BanUserDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class SetBalanceDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Target amount for set, or delta for increase/decrease' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ required: false, enum: ['set', 'increase', 'decrease'], default: 'set' })
  @IsOptional()
  @IsEnum(['set', 'increase', 'decrease'])
  operation?: 'set' | 'increase' | 'decrease';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class AdminStatsDto {
  @ApiProperty()
  totalUsers: number;

  @ApiProperty()
  totalActiveGames: number;

  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  totalDeposits: number;

  @ApiProperty()
  totalWithdraws: number;

  @ApiProperty()
  pendingDeposits: number;

  @ApiProperty()
  pendingWithdraws: number;

  @ApiProperty()
  bannedUsers: number;

  @ApiProperty()
  totalRooms: number;

  @ApiProperty()
  activeRooms: number;
}

export class AdminDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName?: string;

  @ApiProperty()
  lastName?: string;

  @ApiProperty()
  permissions: string[];

  @ApiProperty()
  isSuperAdmin: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  lastLoginAt?: Date;

  @ApiProperty()
  createdAt: Date;
}

export class AdminListDto {
  @ApiProperty()
  admins: AdminDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;
}
