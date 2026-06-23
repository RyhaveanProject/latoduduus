export declare class CreateDepositDto {
    amount: number;
    paymentMethod: string;
    currency: string;
    cardNumber?: string;
    cardHolder?: string;
    walletAddress?: string;
    screenshotUrl?: string;
    bankId?: string;
    walletNetwork?: string;
}
export declare class ApproveDepositDto {
    depositId: string;
    notes?: string;
}
export declare class RejectDepositDto {
    depositId: string;
    reason: string;
}
export declare class DepositListDto {
    deposits: DepositDto[];
    total: number;
    page: number;
    pageSize: number;
}
export declare class DepositDto {
    id: string;
    userId: string;
    amount: number;
    paymentMethod: string;
    currency: string;
    status: string;
    screenshotUrl?: string;
    approvedAt?: Date;
    rejectionReason?: string;
    createdAt: Date;
}
//# sourceMappingURL=deposit.dto.d.ts.map