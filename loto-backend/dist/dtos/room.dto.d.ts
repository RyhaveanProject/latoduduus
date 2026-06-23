export declare class CreateRoomDto {
    name: string;
    visibility: string;
    roomCode?: string;
    entryFee: number;
    maxPlayers: number;
    requiresVerification?: boolean;
}
export declare class JoinRoomDto {
    roomId: string;
    roomCode?: string;
}
export declare class UpdateRoomDto {
    name?: string;
    maxPlayers?: number;
    status?: string;
}
export declare class SendMessageDto {
    roomId: string;
    message: string;
}
export declare class RoomPlayerDto {
    id: string;
    email: string;
    firstName?: string;
    avatar?: string;
    balance: number;
    gamesWon: number;
}
export declare class RoomMessageDto {
    userId: string;
    username: string;
    message: string;
    timestamp: Date;
}
export declare class RoomDto {
    id: string;
    name: string;
    visibility: string;
    ownerId: string;
    players: RoomPlayerDto[];
    spectators: string[];
    entryFee: number;
    maxPlayers: number;
    currentPlayers: number;
    status: string;
    totalPrizePool: number;
    messages: RoomMessageDto[];
    createdAt: Date;
}
export declare class RoomListDto {
    rooms: RoomDto[];
    total: number;
    page: number;
    pageSize: number;
}
//# sourceMappingURL=room.dto.d.ts.map