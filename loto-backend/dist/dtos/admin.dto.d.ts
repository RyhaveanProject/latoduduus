export declare class CreateAdminDto {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    permissions?: string[];
    isSuperAdmin?: boolean;
}
export declare class UpdateAdminDto {
    firstName?: string;
    lastName?: string;
    permissions?: string[];
    isActive?: boolean;
}
export declare class BanUserDto {
    userId: string;
    reason: string;
}
export declare class SetBalanceDto {
    userId: string;
    amount: number;
    reason?: string;
}
export declare class AdminStatsDto {
    totalUsers: number;
    totalActiveGames: number;
    totalRevenue: number;
    totalDeposits: number;
    totalWithdraws: number;
    pendingDeposits: number;
    pendingWithdraws: number;
    bannedUsers: number;
    totalRooms: number;
    activeRooms: number;
}
export declare class AdminDto {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    permissions: string[];
    isSuperAdmin: boolean;
    isActive: boolean;
    lastLoginAt?: Date;
    createdAt: Date;
}
export declare class AdminListDto {
    admins: AdminDto[];
    total: number;
    page: number;
    pageSize: number;
}
//# sourceMappingURL=admin.dto.d.ts.map