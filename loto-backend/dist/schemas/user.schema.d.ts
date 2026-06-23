import { Document } from 'mongoose';
export type UserDocument = User & Document;
export declare class User {
    _id: string;
    email: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    balance: number;
    role: string;
    language: string;
    emailVerified: boolean;
    emailVerificationToken?: string;
    googleId?: string;
    phoneNumber?: string;
    country?: string;
    city?: string;
    isBanned: boolean;
    bannedReason?: string;
    twoFactorEnabled: boolean;
    twoFactorSecret?: string;
    lastLoginAt?: Date;
    totalDeposited: number;
    totalWithdrawn: number;
    totalWinnings: number;
    gamesPlayed: number;
    gamesWon: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const UserSchema: import("mongoose").Schema<User, import("mongoose").Model<User, any, any, any, Document<unknown, any, User> & User & Required<{
    _id: string;
}>, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, User, Document<unknown, {}, import("mongoose").FlatRecord<User>> & import("mongoose").FlatRecord<User> & Required<{
    _id: string;
}>>;
//# sourceMappingURL=user.schema.d.ts.map