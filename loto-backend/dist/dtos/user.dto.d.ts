export declare class UpdateProfileDto {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    phoneNumber?: string;
    country?: string;
    city?: string;
    language?: string;
}
export declare class UserProfileDto {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    balance: number;
    phoneNumber?: string;
    country?: string;
    city?: string;
    language: string;
    emailVerified: boolean;
    gamesPlayed: number;
    gamesWon: number;
    totalWinnings: number;
    totalDeposited: number;
    totalWithdrawn: number;
    lastLoginAt?: Date;
    createdAt: Date;
}
export declare class UserStatsDto {
    gamesPlayed: number;
    gamesWon: number;
    totalWinnings: number;
    totalDeposited: number;
    totalWithdrawn: number;
    currentBalance: number;
    winRate: number;
}
export declare class UserListDto {
    users: UserProfileDto[];
    total: number;
    page: number;
    pageSize: number;
}
//# sourceMappingURL=user.dto.d.ts.map