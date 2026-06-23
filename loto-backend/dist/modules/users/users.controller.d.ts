import { UsersService } from './users.service';
import { UpdateProfileDto, UserProfileDto, UserStatsDto, UserListDto } from '../../dtos/user.dto';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getProfile(userId: string): Promise<UserProfileDto>;
    updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<UserProfileDto>;
    getStats(userId: string): Promise<UserStatsDto>;
    getTransactions(userId: string, page?: number, limit?: number): Promise<{
        transactions: (import("mongoose").Document<unknown, {}, import("../../schemas/transaction.schema").TransactionDocument> & import("../../schemas/transaction.schema").Transaction & import("mongoose").Document<any, any, any> & {
            _id: import("mongoose").Types.ObjectId;
        })[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
    listUsers(page?: number, limit?: number): Promise<UserListDto>;
}
//# sourceMappingURL=users.controller.d.ts.map