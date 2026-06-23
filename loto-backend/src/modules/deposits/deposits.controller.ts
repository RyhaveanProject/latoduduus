import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { DepositsService } from './deposits.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import {
  CreateDepositDto,
  DepositDto,
  DepositListDto,
} from '../../dtos/deposit.dto';
import { plainToInstance } from 'class-transformer';

@ApiTags('Deposits')
@Controller('deposits')
export class DepositsController {
  constructor(private depositsService: DepositsService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create deposit request' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FileInterceptor('proof'))
  async createDeposit(
    @Body() body: any,
    @UploadedFile() proofFile: Express.Multer.File | undefined,
    @GetUser('sub') userId: string,
    @GetUser('email') email: string,
  ): Promise<DepositDto> {
    // Transform and validate body (supports both JSON and multipart)
    const createDepositDto = plainToInstance(CreateDepositDto, {
      amount: body.amount,
      paymentMethod: body.paymentMethod ?? body.method,
      currency: body.currency,
      cardNumber: body.cardNumber,
      cardHolder: body.cardHolder,
      walletAddress: body.walletAddress,
      walletNetwork: body.walletNetwork,
      bankId: body.bankId,
      screenshotUrl: body.screenshotUrl ?? '',
    });

    return this.depositsService.createDeposit(
      createDepositDto,
      userId,
      email,
      proofFile,
    );
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
