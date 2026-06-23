import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { TelegramService } from './telegram.service';
export declare class TelegramModule implements OnModuleInit, OnModuleDestroy {
    private telegramService;
    private readonly logger;
    constructor(telegramService: TelegramService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
//# sourceMappingURL=telegram.module.d.ts.map