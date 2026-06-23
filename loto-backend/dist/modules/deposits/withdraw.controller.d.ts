import { WithdrawService } from './withdraw.service';
import { CreateWithdrawDto, WithdrawDto, WithdrawListDto } from '../../dtos/withdraw.dto';
export declare class WithdrawController {
    private withdrawService;
    constructor(withdrawService: WithdrawService);
    createWithdraw(createWithdrawDto: CreateWithdrawDto, userId: string, email: string): Promise<WithdrawDto>;
    getMyWithdraws(userId: string, page?: number, limit?: number): Promise<WithdrawListDto>;
    listWithdraws(page?: number, limit?: number, status?: string): Promise<WithdrawListDto>;
    getPending(): Promise<import("../../schemas/withdraw.schema").WithdrawDocument[]>;
}
//# sourceMappingURL=withdraw.controller.d.ts.map