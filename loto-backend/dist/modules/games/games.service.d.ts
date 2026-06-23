import { Model } from 'mongoose';
import { Game, GameDocument } from '../../schemas/game.schema';
import { Ticket, TicketDocument } from '../../schemas/ticket.schema';
import { RoomDocument } from '../../schemas/room.schema';
import { GameEngineService } from '../../services/game-engine.service';
import { CreateGameDto, GameStateDto } from '../../dtos/game.dto';
import { UsersService } from '../users/users.service';
export declare class GamesService {
    private gameModel;
    private ticketModel;
    private roomModel;
    private gameEngineService;
    private usersService;
    constructor(gameModel: Model<GameDocument>, ticketModel: Model<TicketDocument>, roomModel: Model<RoomDocument>, gameEngineService: GameEngineService, usersService: UsersService);
    createGame(createGameDto: CreateGameDto): Promise<Game>;
    generateTicket(gameId: string, userId: string): Promise<Ticket>;
    drawNumber(gameId: string, drawIndex: number): Promise<number>;
    getGameState(gameId: string): Promise<GameStateDto>;
    getGameTickets(gameId: string): Promise<(import("mongoose").Document<unknown, {}, TicketDocument> & Ticket & import("mongoose").Document<any, any, any> & {
        _id: import("mongoose").Types.ObjectId;
    })[]>;
    getUserTicketForGame(gameId: string, userId: string): Promise<(import("mongoose").Document<unknown, {}, TicketDocument> & Ticket & import("mongoose").Document<any, any, any> & {
        _id: import("mongoose").Types.ObjectId;
    }) | null>;
    completeGame(gameId: string): Promise<void>;
    getActiveGames(roomId?: string): Promise<(import("mongoose").Document<unknown, {}, GameDocument> & Game & import("mongoose").Document<any, any, any> & {
        _id: import("mongoose").Types.ObjectId;
    })[]>;
    getGameHistory(page?: number, limit?: number): Promise<{
        games: (import("mongoose").Document<unknown, {}, GameDocument> & Game & import("mongoose").Document<any, any, any> & {
            _id: import("mongoose").Types.ObjectId;
        })[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
}
//# sourceMappingURL=games.service.d.ts.map