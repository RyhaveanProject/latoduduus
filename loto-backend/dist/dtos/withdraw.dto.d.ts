export declare class CreateWithdrawDto {
    amount: number;
    paymentMethod: string;
    currency: string;
    cardNumber?: string;
    walletAddress?: string;
}
export declare class ApproveWithdrawDto {
    withdrawId: string;
}
export declare class RejectWithdrawDto {
    withdrawId: string;
    reason: string;
}
export declare class WithdrawDto {
    id: string;
    userId: string;
    amount: number;
    paymentMethod: string;
    currency: string;
    status: string;
    rejectionReason?: string;
    approvedAt?: Date;
    createdAt: Date;
}
export declare class WithdrawListDto {
    withdraws: WithdrawDto[];
    total: number;
    page: number;
    pageSize: number;
}
//# sourceMappingURL=withdraw.dto.d.ts.map