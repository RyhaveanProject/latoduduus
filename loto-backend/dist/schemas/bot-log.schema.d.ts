import { Document } from 'mongoose';
export type BotLogDocument = BotLog & Document;
export declare class BotLog {
    _id: string;
    telegramUserId?: string;
    relatedUserId?: string;
    action: string;
    amount?: number;
    messageId?: string;
    messageText: string;
    callbackData?: string;
    metadata?: Record<string, any>;
    status: string;
    errorMessage?: string;
}
export declare const BotLogSchema: import("mongoose").Schema<BotLog, import("mongoose").Model<BotLog, any, any, any, Document<unknown, any, BotLog> & BotLog & Required<{
    _id: string;
}>, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, BotLog, Document<unknown, {}, import("mongoose").FlatRecord<BotLog>> & import("mongoose").FlatRecord<BotLog> & Required<{
    _id: string;
}>>;
//# sourceMappingURL=bot-log.schema.d.ts.map