import { Document } from 'mongoose';
export type TransactionDocument = Transaction & Document;
export declare class Transaction {
    _id: string;
    userId: string;
    type: string;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    relatedGameId?: string;
    relatedTicketId?: string;
    relatedDepositId?: string;
    relatedWithdrawId?: string;
    description: string;
    status: string;
    failureReason?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const TransactionSchema: import("mongoose").Schema<Transaction, import("mongoose").Model<Transaction, any, any, any, Document<unknown, any, Transaction> & Transaction & Required<{
    _id: string;
}>, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Transaction, Document<unknown, {}, import("mongoose").FlatRecord<Transaction>> & import("mongoose").FlatRecord<Transaction> & Required<{
    _id: string;
}>>;
//# sourceMappingURL=transaction.schema.d.ts.map