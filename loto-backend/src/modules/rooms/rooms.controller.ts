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
import { RoomsService } from './rooms.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import {
  CreateRoomDto,
  JoinRoomDto,
  UpdateRoomDto,
  SendMessageDto,
  RoomDto,
  RoomListDto,
} from '../../dtos/room.dto';

@ApiTags('Rooms')
@Controller('rooms')
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new room' })
  async createRoom(
    @Body() createRoomDto: CreateRoomDto,
    @GetUser('sub') userId: string,
  ): Promise<RoomDto> {
    return this.roomsService.createRoom(createRoomDto, userId);
  }

  @Post('join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Join a room' })
  async joinRoom(
    @Body() joinRoomDto: JoinRoomDto,
    @GetUser('sub') userId: string,
  ): Promise<RoomDto> {
    return this.roomsService.joinRoom(joinRoomDto, userId);
  }

  @Get('list/all')
  @ApiOperation({ summary: 'Get all rooms' })
  async listRooms(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<RoomListDto> {
    return this.roomsService.getRoomsList(page, limit);
  }

  @Get('list/public')
  @ApiOperation({ summary: 'Get public rooms' })
  async getPublicRooms(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<RoomListDto> {
    return this.roomsService.getPublicRooms(page, limit);
  }

  @Get(':roomId/prize-pool')
  @ApiOperation({ summary: 'Get room prize pool' })
  async getPrizePool(@Param('roomId') roomId: string): Promise<{ prizePool: number }> {
    const prizePool = await this.roomsService.calculatePrizePool(roomId);
    return { prizePool };
  }

  @Post(':roomId/leave')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Leave a room' })
  async leaveRoom(
    @Param('roomId') roomId: string,
    @GetUser('sub') userId: string,
  ): Promise<{ message: string }> {
    await this.roomsService.leaveRoom(roomId, userId);
    return { message: 'Left room successfully' };
  }

  @Post(':roomId/spectate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Join as spectator' })
  async addSpectator(
    @Param('roomId') roomId: string,
    @GetUser('sub') userId: string,
  ): Promise<RoomDto> {
    return this.roomsService.addSpectator(roomId, userId);
  }

  @Post(':roomId/message')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send message to room' })
  async sendMessage(
    @Param('roomId') roomId: string,
    @Body() sendMessageDto: SendMessageDto,
    @GetUser('sub') userId: string,
  ): Promise<RoomDto> {
    return this.roomsService.sendMessage(roomId, sendMessageDto, userId);
  }

  @Get(':roomId')
  @ApiOperation({ summary: 'Get room details' })
  async getRoomById(@Param('roomId') roomId: string): Promise<RoomDto> {
    return this.roomsService.getRoomById(roomId);
  }

  @Put(':roomId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update room' })
  async updateRoom(
    @Param('roomId') roomId: string,
    @Body() updateRoomDto: UpdateRoomDto,
    @GetUser('sub') userId: string,
  ): Promise<RoomDto> {
    return this.roomsService.updateRoom(roomId, updateRoomDto, userId);
  }
}
