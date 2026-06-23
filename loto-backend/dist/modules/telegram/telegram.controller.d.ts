import { ConfigService } from '@nestjs/config';
import { TelegramService } from './telegram.service';
export declare class TelegramController {
    private readonly telegramService;
    private readonly configService;
    private readonly logger;
    private readonly secretToken;
    constructor(telegramService: TelegramService, configService: ConfigService);
    handleWebhook(update: any, secretHeader?: string): Promise<{
        ok: boolean;
    }>;
}
//# sourceMappingURL=telegram.controller.d.ts.map