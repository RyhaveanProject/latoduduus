import { Document } from 'mongoose';
export type TicketDocument = Ticket & Document;
export declare class Ticket {
    _id: string;
    userId: string;
    gameId: string;
    roomId: string;
    card: Array<{
        row: number;
        numbers: number[];
    }>;
    markedNumbers: number[];
    stage1Completed: boolean;
    stage2Completed: boolean;
    stage3Completed: boolean;
    entryFee: number;
    stage1Prize?: number;
    stage2Prize?: number;
    stage3Prize?: number;
    totalWinnings: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const TicketSchema: import("mongoose").Schema<Ticket, import("mongoose").Model<Ticket, any, any, any, Document<unknown, any, Ticket> & Ticket & Required<{
    _id: string;
}>, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Ticket, Document<unknown, {}, import("mongoose").FlatRecord<Ticket>> & import("mongoose").FlatRecord<Ticket> & Required<{
    _id: string;
}>>;
//# sourceMappingURL=ticket.schema.d.ts.map