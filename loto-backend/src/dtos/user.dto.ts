import { IsString, IsOptional, IsEmail, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
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
  @IsString()
  avatar?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(['en', 'az', 'ru', 'tr'])
  language?: string;
}

export class UserProfileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName?: string;

  @ApiProperty()
  lastName?: string;

  @ApiProperty()
  avatar?: string;

  @ApiProperty()
  balance: number;

  @ApiProperty()
  phoneNumber?: string;

  @ApiProperty()
  country?: string;

  @ApiProperty()
  city?: string;

  @ApiProperty()
  language: string;

  @ApiProperty()
  emailVerified: boolean;

  @ApiProperty()
  gamesPlayed: number;

  @ApiProperty()
  gamesWon: number;

  @ApiProperty()
  totalWinnings: number;

  @ApiProperty()
  totalDeposited: number;

  @ApiProperty()
  totalWithdrawn: number;

  @ApiProperty()
  lastLoginAt?: Date;

  @ApiProperty()
  createdAt: Date;
}

export class UserStatsDto {
  @ApiProperty()
  gamesPlayed: number;

  @ApiProperty()
  gamesWon: number;

  @ApiProperty()
  totalWinnings: number;

  @ApiProperty()
  totalDeposited: number;

  @ApiProperty()
  totalWithdrawn: number;

  @ApiProperty()
  currentBalance: number;

  @ApiProperty()
  winRate: number;
}

export class UserListDto {
  @ApiProperty()
  users: UserProfileDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;
}
