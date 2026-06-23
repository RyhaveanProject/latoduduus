import { Document } from 'mongoose';
export type WithdrawDocument = Withdraw & Document;
export declare class Withdraw {
    _id: string;
    userId: string;
    email: string;
    amount: number;
    paymentMethod: string;
    currency: string;
    cardNumber?: string;
    walletAddress?: string;
    status: string;
    rejectionReason?: string;
    approvedAt?: Date;
    rejectedAt?: Date;
    approvedBy?: string;
    telegramMessageId?: string;
    telegramChatId?: string;
    transactionHash?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const WithdrawSchema: import("mongoose").Schema<Withdraw, import("mongoose").Model<Withdraw, any, any, any, Document<unknown, any, Withdraw> & Withdraw & Required<{
    _id: string;
}>, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Withdraw, Document<unknown, {}, import("mongoose").FlatRecord<Withdraw>> & import("mongoose").FlatRecord<Withdraw> & Required<{
    _id: string;
}>>;
//# sourceMappingURL=withdraw.schema.d.ts.map