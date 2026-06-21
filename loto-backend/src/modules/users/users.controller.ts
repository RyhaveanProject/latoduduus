import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import {
  UpdateProfileDto,
  UserProfileDto,
  UserStatsDto,
  UserListDto,
} from '../../dtos/user.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  async getProfile(@GetUser('sub') userId: string): Promise<UserProfileDto> {
    return this.usersService.getUserProfile(userId);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user profile' })
  async updateProfile(
    @GetUser('sub') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    return this.usersService.updateProfile(userId, updateProfileDto);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user statistics' })
  async getStats(@GetUser('sub') userId: string): Promise<UserStatsDto> {
    return this.usersService.getUserStats(userId);
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user transaction history' })
  async getTransactions(
    @GetUser('sub') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.usersService.getTransactionHistory(userId, page, limit);
  }

  @Get('list')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users (admin only)' })
  async listUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<UserListDto> {
    return this.usersService.getUsersList(page, limit);
  }
}
