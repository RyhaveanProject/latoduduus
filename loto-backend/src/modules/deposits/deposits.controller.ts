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
import { DepositsService } from './deposits.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import {
  CreateDepositDto,
  ApproveDepositDto,
  RejectDepositDto,
  DepositDto,
  DepositListDto,
} from '../../dtos/deposit.dto';

@ApiTags('Deposits')
@Controller('deposits')
export class DepositsController {
  constructor(private depositsService: DepositsService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create deposit request' })
  async createDeposit(
    @Body() createDepositDto: CreateDepositDto,
    @GetUser('sub') userId: string,
    @GetUser('email') email: string,
  ): Promise<DepositDto> {
    return this.depositsService.createDeposit(createDepositDto, userId, email);
  }

  @Get('my-deposits')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my deposits' })
  async getMyDeposits(
    @GetUser('sub') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<DepositListDto> {
    return this.depositsService.getUserDeposits(userId, page, limit);
  }

  @Get('list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all deposits (admin only)' })
  async listDeposits(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
  ): Promise<DepositListDto> {
    return this.depositsService.getDepositsList(page, limit, status);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pending deposits (admin only)' })
  async getPending() {
    return this.depositsService.getPendingDeposits();
  }
}
