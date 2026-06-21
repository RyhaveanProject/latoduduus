import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WithdrawService } from './withdraw.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import {
  CreateWithdrawDto,
  WithdrawDto,
  WithdrawListDto,
} from '../../dtos/withdraw.dto';

// ⚠️ There are intentionally no approve/reject endpoints here.
// Withdrawals (just like deposits) can ONLY be approved or rejected
// through the Telegram bot — see TelegramService.handleApproveWithdraw /
// handleRejectWithdraw. This is a hard product requirement, not an
// oversight.
@ApiTags('Withdraws')
@Controller('withdraws')
export class WithdrawController {
  constructor(private withdrawService: WithdrawService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create withdraw request (funds are reserved immediately)' })
  async createWithdraw(
    @Body() createWithdrawDto: CreateWithdrawDto,
    @GetUser('sub') userId: string,
    @GetUser('email') email: string,
  ): Promise<WithdrawDto> {
    return this.withdrawService.createWithdraw(createWithdrawDto, userId, email);
  }

  @Get('my-withdraws')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my withdraw requests' })
  async getMyWithdraws(
    @GetUser('sub') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<WithdrawListDto> {
    return this.withdrawService.getUserWithdraws(userId, page, limit);
  }

  @Get('list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all withdraw requests (admin only)' })
  async listWithdraws(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
  ): Promise<WithdrawListDto> {
    return this.withdrawService.getAllWithdraws(page, limit, status);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pending withdraw requests (admin only)' })
  async getPending() {
    return this.withdrawService.getPendingWithdraws();
  }
}
