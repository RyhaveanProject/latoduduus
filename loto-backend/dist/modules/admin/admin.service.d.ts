import { Model } from 'mongoose';
import { AdminDocument } from '../../schemas/admin.schema';
import { UserDocument } from '../../schemas/user.schema';
import { DepositDocument } from '../../schemas/deposit.schema';
import { WithdrawDocument } from '../../schemas/withdraw.schema';
import { BotLogDocument } from '../../schemas/bot-log.schema';
import { CreateAdminDto, UpdateAdminDto, BanUserDto, SetBalanceDto, AdminStatsDto, AdminDto, AdminListDto } from '../../dtos/admin.dto';
export declare class AdminService {
    private adminModel;
    private userModel;
    private depositModel;
    private withdrawModel;
    private botLogModel;
    constructor(adminModel: Model<AdminDocument>, userModel: Model<UserDocument>, depositModel: Model<DepositDocument>, withdrawModel: Model<WithdrawDocument>, botLogModel: Model<BotLogDocument>);
    createAdmin(createAdminDto: CreateAdminDto): Promise<AdminDto>;
    updateAdmin(adminId: string, updateAdminDto: UpdateAdminDto): Promise<AdminDto>;
    banUser(banUserDto: BanUserDto): Promise<void>;
    unbanUser(userId: string): Promise<void>;
    setUserBalance(setBalanceDto: SetBalanceDto): Promise<void>;
    getAdminStats(): Promise<AdminStatsDto>;
    getAdminsList(page?: number, limit?: number): Promise<AdminListDto>;
    getUsersList(page?: number, limit?: number): Promise<any>;
    getDepositsHistory(page?: number, limit?: number): Promise<any>;
    getWithdrawsHistory(page?: number, limit?: number): Promise<any>;
    getTelegramLogs(page?: number, limit?: number): Promise<any>;
    private mapAdminToDto;
}
//# sourceMappingURL=admin.service.d.ts.map