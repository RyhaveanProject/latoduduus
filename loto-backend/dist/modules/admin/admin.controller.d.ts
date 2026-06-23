import { AdminService } from './admin.service';
import { CreateAdminDto, UpdateAdminDto, BanUserDto, SetBalanceDto, AdminStatsDto, AdminDto, AdminListDto } from '../../dtos/admin.dto';
export declare class AdminController {
    private adminService;
    constructor(adminService: AdminService);
    createAdmin(createAdminDto: CreateAdminDto): Promise<AdminDto>;
    updateAdmin(adminId: string, updateAdminDto: UpdateAdminDto): Promise<AdminDto>;
    banUser(banUserDto: BanUserDto): Promise<{
        message: string;
    }>;
    unbanUser(userId: string): Promise<{
        message: string;
    }>;
    setBalance(setBalanceDto: SetBalanceDto): Promise<{
        message: string;
    }>;
    getStats(): Promise<AdminStatsDto>;
    getAdminsList(page?: number, limit?: number): Promise<AdminListDto>;
    getUsersList(page?: number, limit?: number): Promise<any>;
    getDepositsHistory(page?: number, limit?: number): Promise<any>;
    getWithdrawsHistory(page?: number, limit?: number): Promise<any>;
    getTelegramLogs(page?: number, limit?: number): Promise<any>;
}
//# sourceMappingURL=admin.controller.d.ts.map