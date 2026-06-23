import { DepositsService } from './deposits.service';
import { DepositDto, DepositListDto } from '../../dtos/deposit.dto';
export declare class DepositsController {
    private depositsService;
    constructor(depositsService: DepositsService);
    createDeposit(body: any, proofFile: Express.Multer.File | undefined, userId: string, email: string): Promise<DepositDto>;
    getMyDeposits(userId: string, page?: number, limit?: number): Promise<DepositListDto>;
    listDeposits(page?: number, limit?: number, status?: string): Promise<DepositListDto>;
    getPending(): Promise<import("../../schemas/deposit.schema").Deposit[]>;
}
//# sourceMappingURL=deposits.controller.d.ts.map