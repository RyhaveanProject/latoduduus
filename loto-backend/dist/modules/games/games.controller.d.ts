import { GamesService } from './games.service';
import { CreateGameDto, GameStateDto } from '../../dtos/game.dto';
export declare class GamesController {
    private gamesService;
    constructor(gamesService: GamesService);
    createGame(createGameDto: CreateGameDto): Promise<import("../../schemas/game.schema").Game>;
    generateTicket(gameId: string, userId: string): Promise<import("../../schemas/ticket.schema").Ticket>;
    drawNumber(gameId: string, drawIndex: number): Promise<{
        drawnNumber: number;
    }>;
    getGameState(gameId: string): Promise<GameStateDto>;
    getGameTickets(gameId: string): Promise<(import("mongoose").Document<unknown, {}, import("../../schemas/ticket.schema").TicketDocument> & import("../../schemas/ticket.schema").Ticket & import("mongoose").Document<any, any, any> & {
        _id: import("mongoose").Types.ObjectId;
    })[]>;
    getMyTicket(gameId: string, userId: string): Promise<(import("mongoose").Document<unknown, {}, import("../../schemas/ticket.schema").TicketDocument> & import("../../schemas/ticket.schema").Ticket & import("mongoose").Document<any, any, any> & {
        _id: import("mongoose").Types.ObjectId;
    }) | null>;
    completeGame(gameId: string): Promise<{
        message: string;
    }>;
    getActiveGames(roomId?: string): Promise<(import("mongoose").Document<unknown, {}, import("../../schemas/game.schema").GameDocument> & import("../../schemas/game.schema").Game & import("mongoose").Document<any, any, any> & {
        _id: import("mongoose").Types.ObjectId;
    })[]>;
    getGameHistory(page?: number, limit?: number): Promise<{
        games: (import("mongoose").Document<unknown, {}, import("../../schemas/game.schema").GameDocument> & import("../../schemas/game.schema").Game & import("mongoose").Document<any, any, any> & {
            _id: import("mongoose").Types.ObjectId;
        })[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
}
//# sourceMappingURL=games.controller.d.ts.map