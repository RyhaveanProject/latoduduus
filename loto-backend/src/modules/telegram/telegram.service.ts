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
    configService: ConfigService,
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
    // Handle /start command
    this.bot.start((ctx) => {
      ctx.reply('🎰 Loto Bot started! Waiting for admin tasks...');
    });

    // Handle callback queries
    this.bot.action(/^approve_deposit_/, (ctx) => this.handleApproveDeposit(ctx));
    this.bot.action(/^reject_deposit_/, (ctx) => this.handleRejectDeposit(ctx));
    this.bot.action(/^approve_withdraw_/, (ctx) => this.handleApproveWithdraw(ctx));
    this.bot.action(/^reject_withdraw_/, (ctx) => this.handleRejectWithdraw(ctx));

    // Error handling
    this.bot.catch((err) => {
      this.logger.error('Telegram bot error:', err);
    });
  }

  async startBot(): Promise<void> {
    if (this.bot) {
      try {
        await this.bot.launch();
        this.logger.log('✅ Telegram bot started successfully');
      } catch (error) {
        this.logger.error('Failed to start Telegram bot:', error);
      }
    }
  }

  async stopBot(): Promise<void> {
    if (this.bot) {
      this.bot.stop();
      this.logger.log('🛑 Telegram bot stopped');
    }
  }

  async sendDepositNotification(deposit: DepositDocument): Promise<void> {
    if (!this.bot) return;

    const message = `
💳 *New Deposit Request*

👤 User ID: \`${deposit.userId}\`
📧 Email: \`${deposit.email}\`
💰 Amount: ${deposit.amount} ${deposit.currency}
🏦 Method: ${deposit.paymentMethod}
📸 Screenshot: [View](${deposit.screenshotUrl})

Created: ${deposit.createdAt.toLocaleString()}
    `;

    try {
      const sentMessage = await this.bot.telegram.sendMessage(
        this.adminChatId,
        message,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '✅ Approve',
                  callback_data: `approve_deposit_${deposit._id}`,
                },
                {
                  text: '❌ Reject',
                  callback_data: `reject_deposit_${deposit._id}`,
                },
              ],
            ],
          },
        },
      );

      // Save to database
      deposit.telegramMessageId = sentMessage.message_id.toString();
      deposit.telegramChatId = this.adminChatId;
      await deposit.save();

      await this.logBotAction('deposit_request', deposit.userId, deposit.amount, sentMessage.message_id.toString());
    } catch (error) {
      this.logger.error('Failed to send deposit notification:', error);
    }
  }

  async sendWithdrawNotification(withdraw: WithdrawDocument): Promise<void> {
    if (!this.bot) return;

    const message = `
🏦 *New Withdraw Request*

👤 User ID: \`${withdraw.userId}\`
📧 Email: \`${withdraw.email}\`
💰 Amount: ${withdraw.amount} ${withdraw.currency}
🏦 Method: ${withdraw.paymentMethod}

Created: ${withdraw.createdAt.toLocaleString()}
    `;

    try {
      const sentMessage = await this.bot.telegram.sendMessage(
        this.adminChatId,
        message,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '✅ Approve',
                  callback_data: `approve_withdraw_${withdraw._id}`,
                },
                {
                  text: '❌ Reject',
                  callback_data: `reject_withdraw_${withdraw._id}`,
                },
              ],
            ],
          },
        },
      );

      withdraw.telegramMessageId = sentMessage.message_id.toString();
      withdraw.telegramChatId = this.adminChatId;
      await withdraw.save();

      await this.logBotAction('withdraw_request', withdraw.userId, withdraw.amount, sentMessage.message_id.toString());
    } catch (error) {
      this.logger.error('Failed to send withdraw notification:', error);
    }
  }

  private async handleApproveDeposit(ctx: Context): Promise<void> {
    const telegramCtx = ctx as any;

    try {
      const depositId = telegramCtx.match[0].replace('approve_deposit_', '');
      const deposit = await this.depositModel.findById(depositId);

      if (!deposit) {
        await ctx.answerCbQuery('Deposit not found', { show_alert: true });
        return;
      }

      if (deposit.status !== 'pending') {
        await ctx.answerCbQuery('This deposit has already been processed', { show_alert: true });
        return;
      }

      // Update user balance
      const user = await this.userModel.findById(deposit.userId);
      if (!user) {
        await ctx.answerCbQuery('User not found', { show_alert: true });
        return;
      }

      const balanceBefore = user.balance;
      user.balance += deposit.amount;
      user.totalDeposited += deposit.amount;
      await user.save();

      // Create transaction
      await this.transactionModel.create({
        userId: deposit.userId,
        type: 'deposit',
        amount: deposit.amount,
        balanceBefore,
        balanceAfter: user.balance,
        relatedDepositId: deposit._id,
        description: `Telegram bot approved deposit: ${deposit.paymentMethod}`,
        status: 'completed',
      });

      // Update deposit
      deposit.status = 'approved';
      deposit.approvedAt = new Date();
      deposit.approvedBy = 'telegram_bot';
      await deposit.save();

      await ctx.editMessageText(`✅ *Deposit Approved*\n\nUser: ${deposit.email}\nAmount: ${deposit.amount} ${deposit.currency}`, {
        parse_mode: 'Markdown',
      });

      await ctx.answerCbQuery('Deposit approved!');

      await this.logBotAction('approval', deposit.userId, deposit.amount, telegramCtx.callbackQuery.id);
    } catch (error) {
      this.logger.error('Error approving deposit:', error);
      await ctx.answerCbQuery('Error processing request', { show_alert: true });
    }
  }

  private async handleRejectDeposit(ctx: Context): Promise<void> {
    const telegramCtx = ctx as any;

    try {
      const depositId = telegramCtx.match[0].replace('reject_deposit_', '');
      const deposit = await this.depositModel.findById(depositId);

      if (!deposit) {
        await ctx.answerCbQuery('Deposit not found', { show_alert: true });
        return;
      }

      if (deposit.status !== 'pending') {
        await ctx.answerCbQuery('This deposit has already been processed', { show_alert: true });
        return;
      }

      deposit.status = 'rejected';
      deposit.rejectedAt = new Date();
      deposit.rejectionReason = 'Rejected by admin via Telegram';
      deposit.approvedBy = 'telegram_bot';
      await deposit.save();

      await ctx.editMessageText(`❌ *Deposit Rejected*\n\nUser: ${deposit.email}\nAmount: ${deposit.amount} ${deposit.currency}`, {
        parse_mode: 'Markdown',
      });

      await ctx.answerCbQuery('Deposit rejected!');

      await this.logBotAction('rejection', deposit.userId, deposit.amount, telegramCtx.callbackQuery.id);
    } catch (error) {
      this.logger.error('Error rejecting deposit:', error);
      await ctx.answerCbQuery('Error processing request', { show_alert: true });
    }
  }

  private async handleApproveWithdraw(ctx: Context): Promise<void> {
    const telegramCtx = ctx as any;

    try {
      const withdrawId = telegramCtx.match[0].replace('approve_withdraw_', '');
      const withdraw = await this.withdrawModel.findById(withdrawId);

      if (!withdraw) {
        await ctx.answerCbQuery('Withdraw not found', { show_alert: true });
        return;
      }

      if (withdraw.status !== 'pending') {
        await ctx.answerCbQuery('This withdraw has already been processed', { show_alert: true });
        return;
      }

      withdraw.status = 'approved';
      withdraw.approvedAt = new Date();
      withdraw.approvedBy = 'telegram_bot';
      await withdraw.save();

      // Update user stats
      const user = await this.userModel.findById(withdraw.userId);
      if (user) {
        user.totalWithdrawn += withdraw.amount;
        await user.save();
      }

      await ctx.editMessageText(`✅ *Withdraw Approved*\n\nUser: ${withdraw.email}\nAmount: ${withdraw.amount} ${withdraw.currency}`, {
        parse_mode: 'Markdown',
      });

      await ctx.answerCbQuery('Withdraw approved!');

      await this.logBotAction('approval', withdraw.userId, withdraw.amount, telegramCtx.callbackQuery.id);
    } catch (error) {
      this.logger.error('Error approving withdraw:', error);
      await ctx.answerCbQuery('Error processing request', { show_alert: true });
    }
  }

  private async handleRejectWithdraw(ctx: Context): Promise<void> {
    const telegramCtx = ctx as any;

    try {
      const withdrawId = telegramCtx.match[0].replace('reject_withdraw_', '');
      const withdraw = await this.withdrawModel.findById(withdrawId);

      if (!withdraw) {
        await ctx.answerCbQuery('Withdraw not found', { show_alert: true });
        return;
      }

      if (withdraw.status !== 'pending') {
        await ctx.answerCbQuery('This withdraw has already been processed', { show_alert: true });
        return;
      }

      withdraw.status = 'rejected';
      withdraw.rejectedAt = new Date();
      withdraw.rejectionReason = 'Rejected by admin via Telegram';
      withdraw.approvedBy = 'telegram_bot';
      await withdraw.save();

      // Refund the balance that was reserved when the withdrawal was requested
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
          description: 'Withdrawal rejected via Telegram, funds returned',
          status: 'completed',
        });
      }

      await ctx.editMessageText(`❌ *Withdraw Rejected*\n\nUser: ${withdraw.email}\nAmount: ${withdraw.amount} ${withdraw.currency}`, {
        parse_mode: 'Markdown',
      });

      await ctx.answerCbQuery('Withdraw rejected!');

      await this.logBotAction('rejection', withdraw.userId, withdraw.amount, telegramCtx.callbackQuery.id);
    } catch (error) {
      this.logger.error('Error rejecting withdraw:', error);
      await ctx.answerCbQuery('Error processing request', { show_alert: true });
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
