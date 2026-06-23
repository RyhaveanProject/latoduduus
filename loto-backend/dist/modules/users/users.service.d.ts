import { Model } from 'mongoose';
import { User, UserDocument } from '../../schemas/user.schema';
import { Transaction, TransactionDocument } from '../../schemas/transaction.schema';
import { UpdateProfileDto, UserProfileDto, UserStatsDto, UserListDto } from '../../dtos/user.dto';
export declare class UsersService {
    private userModel;
    private transactionModel;
    constructor(userModel: Model<UserDocument>, transactionModel: Model<TransactionDocument>);
    getUserProfile(userId: string): Promise<UserProfileDto>;
    updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<UserProfileDto>;
    getUserStats(userId: string): Promise<UserStatsDto>;
    getTransactionHistory(userId: string, page?: number, limit?: number): Promise<{
        transactions: (import("mongoose").Document<unknown, {}, TransactionDocument> & Transaction & import("mongoose").Document<any, any, any> & {
            _id: import("mongoose").Types.ObjectId;
        })[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
    addBalance(userId: string, amount: number, description: string): Promise<number>;
    deductBalance(userId: string, amount: number, description: string): Promise<number>;
    getUsersList(page?: number, limit?: number): Promise<UserListDto>;
    getUserById(userId: string): Promise<import("mongoose").Document<unknown, {}, UserDocument> & User & import("mongoose").Document<any, any, any> & {
        _id: import("mongoose").Types.ObjectId;
    }>;
    updateGameStats(userId: string, isWinner: boolean, winningsAmount?: number, entryFee?: number): Promise<void>;
}
//# sourceMappingURL=users.service.d.ts.map