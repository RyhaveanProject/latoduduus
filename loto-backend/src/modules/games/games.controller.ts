import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { GamesService } from './games.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { CreateGameDto, GameStateDto } from '../../dtos/game.dto';

@ApiTags('Games')
@Controller('games')
export class GamesController {
  constructor(private gamesService: GamesService) {}

  @Get('active/list')
  @ApiOperation({ summary: 'Get active games' })
  async getActiveGames(@Query('roomId') roomId?: string) {
    return this.gamesService.getActiveGames(roomId);
  }

  @Get('history/list')
  @ApiOperation({ summary: 'Get game history' })
  async getGameHistory(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.gamesService.getGameHistory(page, limit);
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new game' })
  async createGame(@Body() createGameDto: CreateGameDto) {
    return this.gamesService.createGame(createGameDto);
  }

  @Post(':gameId/ticket')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate ticket set for game' })
  async generateTicket(
    @Param('gameId') gameId: string,
    @GetUser('sub') userId: string,
  ) {
    return this.gamesService.generateTicket(gameId, userId);
  }

  @Post(':gameId/draw')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Draw next number in game' })
  async drawNumber(@Param('gameId') gameId: string) {
    return this.gamesService.drawNextNumber(gameId);
  }

  @Get(':gameId/tickets')
  @ApiOperation({ summary: 'Get all tickets for game' })
  async getGameTickets(@Param('gameId') gameId: string) {
    return this.gamesService.getGameTickets(gameId);
  }

  @Get(':gameId/my-ticket')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get first my ticket for a game' })
  async getMyTicket(
    @Param('gameId') gameId: string,
    @GetUser('sub') userId: string,
  ) {
    return this.gamesService.getUserTicketForGame(gameId, userId);
  }

  @Get(':gameId/my-tickets')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all my tickets for a game' })
  async getMyTickets(
    @Param('gameId') gameId: string,
    @GetUser('sub') userId: string,
  ) {
    return this.gamesService.getUserTicketsForGame(gameId, userId);
  }

  @Post(':gameId/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current completed game state' })
  async completeGame(@Param('gameId') gameId: string) {
    return this.gamesService.getGameState(gameId);
  }

  @Get(':gameId')
  @ApiOperation({ summary: 'Get game state' })
  async getGameState(@Param('gameId') gameId: string): Promise<GameStateDto> {
    return this.gamesService.getGameState(gameId);
  }
}
