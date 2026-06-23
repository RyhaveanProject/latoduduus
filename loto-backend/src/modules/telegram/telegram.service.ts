import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Telegraf, Context } from 'telegraf';
import { Deposit, DepositDocument } from '../../schemas/deposit.schema';
import { Withdraw, WithdrawDocument } from '../../schemas/withdraw.schema';
import { User, UserDocument } from '../../schemas/user.schema';
import { BotLog, BotLogDocument } from '../../schemas/bot-log.schema';
import { Transaction, TransactionDocument } from '../../schemas/transaction.schema';

@Injectable()
export class TelegramService {
  private bot: Telegraf;
  private adminChatId: string;
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private configService: ConfigService,
    @InjectModel(Deposit.name) private depositModel: Model<DepositDocument>,
    @InjectModel(Withdraw.name) private withdrawModel: Model<WithdrawDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(BotLog.name) private botLogModel: Model<BotLogDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
  ) {
    const botToken = configService.get<string>('TELEGRAM_BOT_TOKEN');
    this.adminChatId = configService.get<string>('TELEGRAM_ADMIN_CHAT_ID') ?? '';

    if (botToken) {
      this.bot = new Telegraf(botToken);
      this.initializeBot();
    }
  }

  private initializeBot(): void {
    // Regex: (approve|reject)_(deposit|withdraw)_(ID) şəklində qruplaşdırılır
    // Bu sayədə match[1] -> action, match[2] -> type, match[3] -> id olur
    this.bot.action(/^(approve|reject)_(deposit|withdraw)_(.+)$/, (ctx) => this.handleCallback(ctx));

    this.bot.catch((err) => {
      this.logger.error('Telegram bot error:', err);
    });
  }

  private async handleCallback(ctx: Context): Promise<void> {
    const telegramCtx = ctx as any;
    const action = telegramCtx.match[1]; // approve və ya reject
    const type = telegramCtx.match[2];   // deposit və ya withdraw
    const id = telegramCtx.match[3];     // MONGODB ID

    try {
      if (type === 'deposit') {
        if (action === 'approve') await this.handleApproveDeposit(ctx, id);
        else await this.handleRejectDeposit(ctx, id);
      } else {
        if (action === 'approve') await this.handleApproveWithdraw(ctx, id);
        else await this.handleRejectWithdraw(ctx, id);
      }
    } catch (error) {
      this.logger.error('Callback handling error:', error);
      await ctx.answerCbQuery('❌ Xəta baş verdi', { show_alert: true }).catch(() => {});
    }
  }

  async sendDepositNotification(deposit: DepositDocument): Promise<void> {
    if (!this.bot) return;

    const message = `💳 *Yeni Depozit Sorğusu*\n\n👤 ID: \`${deposit.userId}\`\n💰 Məbləğ: ${deposit.amount} ${deposit.currency}`;
    
    // Callback data-nı belə formatlayırıq ki, regex ilə rahat ayıraq
    const keyboard = {
      inline_keyboard: [[
        { text: '✅ Təsdiqlə', callback_data: `approve_deposit_${deposit._id}` },
        { text: '❌ Rədd et', callback_data: `reject_deposit_${deposit._id}` },
      ]],
    };

    const sentMessage = await this.bot.telegram.sendMessage(this.adminChatId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });

    deposit.telegramMessageId = sentMessage.message_id.toString();
    deposit.telegramChatId = this.adminChatId;
    await deposit.save();
  }

  private async handleApproveDeposit(ctx: Context, id: string): Promise<void> {
    await ctx.answerCbQuery('⏳ İşlənir...');
    const deposit = await this.depositModel.findById(id);

    if (!deposit || deposit.status !== 'pending') {
      await ctx.answerCbQuery('⚠️ Depozit artıq işlənib və ya tapılmadı!', { show_alert: true });
      return;
    }

    const user = await this.userModel.findById(deposit.userId);
    if (user) {
      user.balance += deposit.amount;
      await user.save();
    }

    deposit.status = 'approved';
    await deposit.save();

    await ctx.editMessageText(`✅ *Depozit Təsdiqləndi*\n\n👤 İstifadəçi: ${deposit.email}\n💰 Məbləğ: ${deposit.amount} ${deposit.currency}`, { parse_mode: 'Markdown' });
  }

  private async handleRejectDeposit(ctx: Context, id: string): Promise<void> {
    await ctx.answerCbQuery('⏳ İşlənir...');
    const deposit = await this.depositModel.findById(id);

    if (!deposit || deposit.status !== 'pending') {
      await ctx.answerCbQuery('⚠️ Depozit artıq işlənib və ya tapılmadı!', { show_alert: true });
      return;
    }

    deposit.status = 'rejected';
    await deposit.save();

    await ctx.editMessageText(`❌ *Depozit Rədd Edildi*\n\n👤 İstifadəçi: ${deposit.email}\n💰 Məbləğ: ${deposit.amount} ${deposit.currency}`, { parse_mode: 'Markdown' });
  }

  // Eyni məntiqi handleApproveWithdraw və handleRejectWithdraw üçün də tətbiq edirsiniz
  private async handleApproveWithdraw(ctx: Context, id: string): Promise<void> {
     // Withdraw üçün məntiq
     await ctx.answerCbQuery('✅ Çıxarış təsdiqləndi');
     // ... (bura öz çıxarış təsdiq kodunuzu yerləşdirin)
  }

  private async handleRejectWithdraw(ctx: Context, id: string): Promise<void> {
     // Withdraw üçün məntiq
     await ctx.answerCbQuery('❌ Çıxarış rədd edildi');
     // ... (bura öz çıxarış rədd etmə kodunuzu yerləşdirin)
  }

  async startBot(): Promise<void> {
    if (!this.bot) return;
    const webhookUrl = this.configService.get<string>('TELEGRAM_WEBHOOK_URL');
    if (webhookUrl) {
      await this.bot.telegram.setWebhook(`${webhookUrl}/api/telegram/webhook`);
    } else {
      this.bot.launch();
    }
  }
}
