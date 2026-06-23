import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  CreateAdminDto,
  UpdateAdminDto,
  BanUserDto,
  SetBalanceDto,
  AdminStatsDto,
  AdminDto,
  AdminListDto,
} from '../../dtos/admin.dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Post('create-admin')
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new admin' })
  async createAdmin(@Body() createAdminDto: CreateAdminDto): Promise<AdminDto> {
    return this.adminService.createAdmin(createAdminDto);
  }

  @Put('admin/:adminId')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update admin' })
  async updateAdmin(
    @Param('adminId') adminId: string,
    @Body() updateAdminDto: UpdateAdminDto,
  ): Promise<AdminDto> {
    return this.adminService.updateAdmin(adminId, updateAdminDto);
  }

  @Post('ban-user')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ban user' })
  async banUser(@Body() banUserDto: BanUserDto): Promise<{ message: string }> {
    await this.adminService.banUser(banUserDto);
    return { message: 'User banned successfully' };
  }

  @Post('unban-user/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unban user' })
  async unbanUser(@Param('userId') userId: string): Promise<{ message: string }> {
    await this.adminService.unbanUser(userId);
    return { message: 'User unbanned successfully' };
  }

  @Post('set-balance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set, increase or decrease user balance' })
  async setBalance(@Body() setBalanceDto: SetBalanceDto) {
    return this.adminService.setUserBalance(setBalanceDto);
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get admin statistics' })
  async getStats(): Promise<AdminStatsDto> {
    return this.adminService.getAdminStats();
  }

  @Get('admins/list')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all admins' })
  async getAdminsList(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<AdminListDto> {
    return this.adminService.getAdminsList(page, limit);
  }

  @Get('users/list')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all users' })
  async getUsersList(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('search') search?: string,
  ) {
    return this.adminService.getUsersList(page, limit, search);
  }

  @Get('deposits/history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get deposits history' })
  async getDepositsHistory(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.adminService.getDepositsHistory(page, limit);
  }

  @Get('withdraws/history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get withdraws history' })
  async getWithdrawsHistory(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.adminService.getWithdrawsHistory(page, limit);
  }

  @Get('telegram/logs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Telegram bot logs' })
  async getTelegramLogs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.adminService.getTelegramLogs(page, limit);
  }
}
