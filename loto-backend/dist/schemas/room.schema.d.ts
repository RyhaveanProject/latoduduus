import { Document } from 'mongoose';
export type RoomDocument = Room & Document;
export declare class Room {
    _id: string;
    name: string;
    visibility: string;
    roomCode?: string;
    ownerId: string;
    players: string[];
    spectators: string[];
    messages: Array<{
        userId: string;
        username: string;
        message: string;
        timestamp: Date;
    }>;
    entryFee: number;
    maxPlayers: number;
    currentPlayers: number;
    status: string;
    currentGameId?: string;
    totalPrizePool: number;
    requiresVerification: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const RoomSchema: import("mongoose").Schema<Room, import("mongoose").Model<Room, any, any, any, Document<unknown, any, Room> & Room & Required<{
    _id: string;
}>, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Room, Document<unknown, {}, import("mongoose").FlatRecord<Room>> & import("mongoose").FlatRecord<Room> & Required<{
    _id: string;
}>>;
//# sourceMappingURL=room.schema.d.ts.map