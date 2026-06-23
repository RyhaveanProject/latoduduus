import { Document } from 'mongoose';
export type DepositDocument = Deposit & Document;
export declare class Deposit {
    _id: string;
    userId: string;
    email: string;
    amount: number;
    paymentMethod: string;
    currency: string;
    cardNumber?: string;
    cardHolder?: string;
    walletAddress?: string;
    walletNetwork?: string;
    bankId?: string;
    screenshotUrl?: string;
    status: string;
    rejectionReason?: string;
    approvedAt?: Date;
    rejectedAt?: Date;
    approvedBy?: string;
    telegramMessageId?: string;
    telegramChatId?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const DepositSchema: import("mongoose").Schema<Deposit, import("mongoose").Model<Deposit, any, any, any, Document<unknown, any, Deposit> & Deposit & Required<{
    _id: string;
}>, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Deposit, Document<unknown, {}, import("mongoose").FlatRecord<Deposit>> & import("mongoose").FlatRecord<Deposit> & Required<{
    _id: string;
}>>;
//# sourceMappingURL=deposit.schema.d.ts.map