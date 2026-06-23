import { Controller, Post, Body, Headers, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from './telegram.service';

@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);
  private readonly secretToken: string;

  constructor(
    private readonly telegramService: TelegramService,
    private readonly configService: ConfigService,
  ) {
    // Optional: Telegram webhook secret token for extra security
    this.secretToken = this.configService.get<string>('TELEGRAM_WEBHOOK_SECRET') ?? '';
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() update: any,
    @Headers('x-telegram-bot-api-secret-token') secretHeader?: string,
  ): Promise<{ ok: boolean }> {
    // Validate secret token if configured
    if (this.secretToken && secretHeader !== this.secretToken) {
      this.logger.warn('Webhook received with invalid secret token');
      return { ok: false };
    }

    try {
      await this.telegramService.handleWebhookUpdate(update);
    } catch (error) {
      this.logger.error('Webhook processing error:', error);
    }

    return { ok: true };
  }
}
