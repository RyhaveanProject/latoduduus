import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { GamesService } from '../modules/games/games.service';
import { RoomsService } from '../modules/rooms/rooms.service';
interface AuthenticatedSocket extends Socket {
    userId?: string;
    roomId?: string;
}
export declare class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private gamesService;
    private roomsService;
    server: Server;
    private readonly logger;
    private userSockets;
    constructor(gamesService: GamesService, roomsService: RoomsService);
    afterInit(server: Server): void;
    private getErrorMessage;
    handleConnection(socket: AuthenticatedSocket): Promise<void>;
    handleDisconnect(socket: AuthenticatedSocket): Promise<void>;
    handleJoinRoom(socket: AuthenticatedSocket, data: {
        roomId: string;
    }): Promise<void>;
    handleLeaveRoom(socket: AuthenticatedSocket, data: {
        roomId: string;
    }): Promise<void>;
    handleDrawNumber(socket: AuthenticatedSocket, data: {
        gameId: string;
        drawIndex: number;
    }): Promise<void>;
    handleCheckCard(socket: AuthenticatedSocket, data: {
        gameId: string;
        ticketId: string;
    }): Promise<void>;
    handleSendMessage(socket: AuthenticatedSocket, data: {
        roomId: string;
        message: string;
    }): Promise<void>;
    handleGameEnded(socket: AuthenticatedSocket, data: {
        gameId: string;
        roomId: string;
    }): Promise<void>;
    handlePing(socket: AuthenticatedSocket): void;
}
export {};
//# sourceMappingURL=game.gateway.d.ts.map