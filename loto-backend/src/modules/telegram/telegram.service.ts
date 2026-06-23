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
  // Track which messages were sent as photos (have caption instead of text)
  private photoMessageIds = new Set<string>();

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
    this.bot.start((ctx) => {
      ctx.reply('🎰 Loto Bot started! Waiting for admin tasks...');
    });

    this.bot.action(/^approve_deposit_/, (ctx) => this.handleApproveDeposit(ctx));
    this.bot.action(/^reject_deposit_/, (ctx) => this.handleRejectDeposit(ctx));
    this.bot.action(/^approve_withdraw_/, (ctx) => this.handleApproveWithdraw(ctx));
    this.bot.action(/^reject_withdraw_/, (ctx) => this.handleRejectWithdraw(ctx));

    this.bot.catch((err) => {
      this.logger.error('Telegram bot error:', err);
    });
  }

  async startBot(): Promise<void> {
    if (!this.bot) return;

    const webhookUrl = this.configService.get<string>('TELEGRAM_WEBHOOK_URL');

    if (webhookUrl) {
      // Webhook mode — preferred for Render deployments
      try {
        await this.bot.telegram.deleteWebhook({ drop_pending_updates: true });
        await this.bot.telegram.setWebhook(`${webhookUrl}/api/telegram/webhook`);
        this.logger.log(`✅ Telegram webhook set: ${webhookUrl}/api/telegram/webhook`);
      } catch (error) {
        this.logger.error('Failed to set webhook, falling back to polling:', error);
        this.startPolling();
      }
    } else {
      // Polling mode — for local/dev
      this.startPolling();
    }
  }

  private startPolling(): void {
    this.bot.launch({ dropPendingUpdates: true }).catch((error) => {
      this.logger.error('Failed to start Telegram bot polling:', error);
    });
    this.logger.log('✅ Telegram bot polling started (non-blocking)');
  }

  async stopBot(): Promise<void> {
    if (this.bot) {
      this.bot.stop();
      this.logger.log('🛑 Telegram bot stopped');
    }
  }

  // Called by the webhook controller to process incoming updates
  async handleWebhookUpdate(update: any): Promise<void> {
    if (this.bot) {
      await this.bot.handleUpdate(update);
    }
  }

  async sendDepositNotification(deposit: DepositDocument): Promise<void> {
    if (!this.bot) return;

    const methodLabel = deposit.paymentMethod === 'bank' ? '🏦 Bank/Kart' : '🪙 Kripto';
    const message = `
💳 *Yeni Depozit Sorğusu*

👤 İstifadəçi ID: \`${deposit.userId}\`
📧 Email: \`${deposit.email}\`
💰 Məbləğ: ${deposit.amount} ${deposit.currency}
${methodLabel}
${deposit.bankId ? `🏧 Bank ID: ${deposit.bankId}` : ''}
${deposit.walletNetwork ? `🔗 Şəbəkə: ${deposit.walletNetwork}` : ''}

📅 Tarix: ${deposit.createdAt.toLocaleString()}
    `.trim();

    const keyboard = {
      inline_keyboard: [
        [
          { text: '✅ Təsdiqlə', callback_data: `approve_deposit_${deposit._id}` },
          { text: '❌ Rədd et', callback_data: `reject_deposit_${deposit._id}` },
        ],
      ],
    };

    try {
      let sentMessage: any;
      let isPhoto = false;

      if (deposit.screenshotUrl && deposit.screenshotUrl.startsWith('data:')) {
        const matches = deposit.screenshotUrl.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
          const buffer = Buffer.from(matches[2], 'base64');
          sentMessage = await this.bot.telegram.sendPhoto(
            this.adminChatId,
            { source: buffer },
            { caption: message, parse_mode: 'Markdown', reply_markup: keyboard },
          );
          isPhoto = true;
        }
      }

      if (!sentMessage) {
        sentMessage = await this.bot.telegram.sendMessage(this.adminChatId, message, {
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        });
      }

      deposit.telegramMessageId = sentMessage.message_id.toString();
      deposit.telegramChatId = this.adminChatId;
      // Store whether this message is a photo so we know how to edit it later
      if (isPhoto) {
        this.photoMessageIds.add(sentMessage.message_id.toString());
      }
      await deposit.save();

      await this.logBotAction('deposit_request', deposit.userId, deposit.amount, sentMessage.message_id.toString());
    } catch (error) {
      this.logger.error('Failed to send deposit notification:', error);
    }
  }

  async sendWithdrawNotification(withdraw: WithdrawDocument): Promise<void> {
    if (!this.bot) return;

    const message = `
🏦 *Yeni Çıxarış Sorğusu*

👤 İstifadəçi ID: \`${withdraw.userId}\`
📧 Email: \`${withdraw.email}\`
💰 Məbləğ: ${withdraw.amount} ${withdraw.currency}
🏦 Metod: ${withdraw.paymentMethod}

📅 Tarix: ${withdraw.createdAt.toLocaleString()}
    `.trim();

    try {
      const sentMessage = await this.bot.telegram.sendMessage(this.adminChatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Təsdiqlə', callback_data: `approve_withdraw_${withdraw._id}` },
              { text: '❌ Rədd et', callback_data: `reject_withdraw_${withdraw._id}` },
            ],
          ],
        },
      });

      withdraw.telegramMessageId = sentMessage.message_id.toString();
      withdraw.telegramChatId = this.adminChatId;
      await withdraw.save();

      await this.logBotAction('withdraw_request', withdraw.userId, withdraw.amount, sentMessage.message_id.toString());
    } catch (error) {
      this.logger.error('Failed to send withdraw notification:', error);
    }
  }

  // Helper: edit a message that may be a photo (caption) or plain text
  private async editBotMessage(
    chatId: string,
    messageId: string,
    newText: string,
  ): Promise<void> {
    const msgIdStr = messageId.toString();
    const isPhoto = this.photoMessageIds.has(msgIdStr);

    try {
      if (isPhoto) {
        await this.bot.telegram.editMessageCaption(
          chatId,
          Number(messageId),
          undefined,
          newText,
          { parse_mode: 'Markdown' },
        );
        this.photoMessageIds.delete(msgIdStr);
      } else {
        await this.bot.telegram.editMessageText(
          chatId,
          Number(messageId),
          undefined,
          newText,
          { parse_mode: 'Markdown' },
        );
      }
    } catch (err: any) {
      // "message is not modified" is harmless — ignore it
      if (!err?.message?.includes('message is not modified')) {
        this.logger.warn('editBotMessage error (non-critical):', err?.message);
      }
    }
  }

  private async handleApproveDeposit(ctx: Context): Promise<void> {
    const telegramCtx = ctx as any;

    try {
      // Always answer callback immediately to stop Telegram's loading spinner
      await ctx.answerCbQuery('⏳ Emal edilir...').catch(() => {});

      const depositId = telegramCtx.match[0].replace('approve_deposit_', '');
      const deposit = await this.depositModel.findById(depositId);

      if (!deposit) {
        await ctx.answerCbQuery('❌ Depozit tapılmadı', { show_alert: true });
        return;
      }

      if (deposit.status !== 'pending') {
        await ctx.answerCbQuery('⚠️ Bu depozit artıq emal edilib', { show_alert: true });
        return;
      }

      const user = await this.userModel.findById(deposit.userId);
      if (!user) {
        await ctx.answerCbQuery('❌ İstifadəçi tapılmadı', { show_alert: true });
        return;
      }

      const balanceBefore = user.balance;
      user.balance += deposit.amount;
      user.totalDeposited += deposit.amount;
      await user.save();

      await this.transactionModel.create({
        userId: deposit.userId,
        type: 'deposit',
        amount: deposit.amount,
        balanceBefore,
        balanceAfter: user.balance,
        relatedDepositId: deposit._id,
        description: `Telegram bot tərəfindən depozit təsdiqləndi: ${deposit.paymentMethod}`,
        status: 'completed',
      });

      deposit.status = 'approved';
      deposit.approvedAt = new Date();
      deposit.approvedBy = 'telegram_bot';
      await deposit.save();

      const successText =
        `✅ *Depozit Təsdiqləndi*\n\n` +
        `👤 İstifadəçi: ${deposit.email}\n` +
        `💰 Məbləğ: ${deposit.amount} ${deposit.currency}\n` +
        `💳 Yeni Balans: ${user.balance} ${deposit.currency}`;

      if (deposit.telegramChatId && deposit.telegramMessageId) {
        await this.editBotMessage(deposit.telegramChatId, deposit.telegramMessageId, successText);
      }

      await ctx.answerCbQuery('✅ Depozit təsdiqləndi!', { show_alert: true });
      await this.logBotAction('approval', deposit.userId, deposit.amount, telegramCtx.callbackQuery?.id ?? '');
    } catch (error) {
      this.logger.error('Error approving deposit:', error);
      await ctx.answerCbQuery('❌ Xəta baş verdi', { show_alert: true }).catch(() => {});
    }
  }

  private async handleRejectDeposit(ctx: Context): Promise<void> {
    const telegramCtx = ctx as any;

    try {
      await ctx.answerCbQuery('⏳ Emal edilir...').catch(() => {});

      const depositId = telegramCtx.match[0].replace('reject_deposit_', '');
      const deposit = await this.depositModel.findById(depositId);

      if (!deposit) {
        await ctx.answerCbQuery('❌ Depozit tapılmadı', { show_alert: true });
        return;
      }

      if (deposit.status !== 'pending') {
        await ctx.answerCbQuery('⚠️ Bu depozit artıq emal edilib', { show_alert: true });
        return;
      }

      deposit.status = 'rejected';
      deposit.rejectedAt = new Date();
      deposit.rejectionReason = 'Admin tərəfindən Telegram vasitəsilə rədd edildi';
      deposit.approvedBy = 'telegram_bot';
      await deposit.save();

      const rejectText =
        `❌ *Depozit Rədd Edildi*\n\n` +
        `👤 İstifadəçi: ${deposit.email}\n` +
        `💰 Məbləğ: ${deposit.amount} ${deposit.currency}\n` +
        `📋 Səbəb: Admin tərəfindən rədd edildi`;

      if (deposit.telegramChatId && deposit.telegramMessageId) {
        await this.editBotMessage(deposit.telegramChatId, deposit.telegramMessageId, rejectText);
      }

      await ctx.answerCbQuery('❌ Depozit rədd edildi!', { show_alert: true });
      await this.logBotAction('rejection', deposit.userId, deposit.amount, telegramCtx.callbackQuery?.id ?? '');
    } catch (error) {
      this.logger.error('Error rejecting deposit:', error);
      await ctx.answerCbQuery('❌ Xəta baş verdi', { show_alert: true }).catch(() => {});
    }
  }

  private async handleApproveWithdraw(ctx: Context): Promise<void> {
    const telegramCtx = ctx as any;

    try {
      await ctx.answerCbQuery('⏳ Emal edilir...').catch(() => {});

      const withdrawId = telegramCtx.match[0].replace('approve_withdraw_', '');
      const withdraw = await this.withdrawModel.findById(withdrawId);

      if (!withdraw) {
        await ctx.answerCbQuery('❌ Çıxarış tapılmadı', { show_alert: true });
        return;
      }

      if (withdraw.status !== 'pending') {
        await ctx.answerCbQuery('⚠️ Bu çıxarış artıq emal edilib', { show_alert: true });
        return;
      }

      withdraw.status = 'approved';
      withdraw.approvedAt = new Date();
      withdraw.approvedBy = 'telegram_bot';
      await withdraw.save();

      const user = await this.userModel.findById(withdraw.userId);
      if (user) {
        user.totalWithdrawn += withdraw.amount;
        await user.save();
      }

      await this.transactionModel.create({
        userId: withdraw.userId,
        type: 'withdraw',
        amount: withdraw.amount,
        balanceBefore: user ? user.balance + withdraw.amount : 0,
        balanceAfter: user ? user.balance : 0,
        relatedWithdrawId: withdraw._id,
        description: 'Telegram bot tərəfindən çıxarış təsdiqləndi',
        status: 'completed',
      });

      const successText =
        `✅ *Çıxarış Təsdiqləndi*\n\n` +
        `👤 İstifadəçi: ${withdraw.email}\n` +
        `💰 Məbləğ: ${withdraw.amount} ${withdraw.currency}`;

      if (withdraw.telegramChatId && withdraw.telegramMessageId) {
        await this.editBotMessage(withdraw.telegramChatId, withdraw.telegramMessageId, successText);
      }

      await ctx.answerCbQuery('✅ Çıxarış təsdiqləndi!', { show_alert: true });
      await this.logBotAction('approval', withdraw.userId, withdraw.amount, telegramCtx.callbackQuery?.id ?? '');
    } catch (error) {
      this.logger.error('Error approving withdraw:', error);
      await ctx.answerCbQuery('❌ Xəta baş verdi', { show_alert: true }).catch(() => {});
    }
  }

  private async handleRejectWithdraw(ctx: Context): Promise<void> {
    const telegramCtx = ctx as any;

    try {
      await ctx.answerCbQuery('⏳ Emal edilir...').catch(() => {});

      const withdrawId = telegramCtx.match[0].replace('reject_withdraw_', '');
      const withdraw = await this.withdrawModel.findById(withdrawId);

      if (!withdraw) {
        await ctx.answerCbQuery('❌ Çıxarış tapılmadı', { show_alert: true });
        return;
      }

      if (withdraw.status !== 'pending') {
        await ctx.answerCbQuery('⚠️ Bu çıxarış artıq emal edilib', { show_alert: true });
        return;
      }

      withdraw.status = 'rejected';
      withdraw.rejectedAt = new Date();
      withdraw.rejectionReason = 'Admin tərəfindən Telegram vasitəsilə rədd edildi';
      withdraw.approvedBy = 'telegram_bot';
      await withdraw.save();

      // Refund the reserved balance
      const user = await this.userModel.findById(withdraw.userId);
      if (user) {
        const balanceBefore = user.balance;
        user.balance += withdraw.amount;
        await user.save();

        await this.transactionModel.create({
          userId: withdraw.userId,
          type: 'refund',
          amount: withdraw.amount,
          balanceBefore,
          balanceAfter: user.balance,
          relatedWithdrawId: withdraw._id,
          description: 'Çıxarış rədd edildi, məbləğ geri qaytarıldı',
          status: 'completed',
        });
      }

      const rejectText =
        `❌ *Çıxarış Rədd Edildi*\n\n` +
        `👤 İstifadəçi: ${withdraw.email}\n` +
        `💰 Məbləğ: ${withdraw.amount} ${withdraw.currency}\n` +
        `💸 Məbləğ balansa geri qaytarıldı`;

      if (withdraw.telegramChatId && withdraw.telegramMessageId) {
        await this.editBotMessage(withdraw.telegramChatId, withdraw.telegramMessageId, rejectText);
      }

      await ctx.answerCbQuery('❌ Çıxarış rədd edildi!', { show_alert: true });
      await this.logBotAction('rejection', withdraw.userId, withdraw.amount, telegramCtx.callbackQuery?.id ?? '');
    } catch (error) {
      this.logger.error('Error rejecting withdraw:', error);
      await ctx.answerCbQuery('❌ Xəta baş verdi', { show_alert: true }).catch(() => {});
    }
  }

  private async logBotAction(
    action: string,
    userId: string,
    amount: number,
    messageId: string,
  ): Promise<void> {
    try {
      await this.botLogModel.create({
        action,
        relatedUserId: userId,
        amount,
        messageId,
        messageText: `Bot action: ${action}`,
        status: 'success',
      });
    } catch (error) {
      this.logger.error('Error logging bot action:', error);
    }
  }
}
