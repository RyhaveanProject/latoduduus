"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TelegramService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const telegraf_1 = require("telegraf");
const deposit_schema_1 = require("../../schemas/deposit.schema");
const withdraw_schema_1 = require("../../schemas/withdraw.schema");
const user_schema_1 = require("../../schemas/user.schema");
const bot_log_schema_1 = require("../../schemas/bot-log.schema");
const transaction_schema_1 = require("../../schemas/transaction.schema");
let TelegramService = TelegramService_1 = class TelegramService {
    constructor(configService, depositModel, withdrawModel, userModel, botLogModel, transactionModel) {
        this.configService = configService;
        this.depositModel = depositModel;
        this.withdrawModel = withdrawModel;
        this.userModel = userModel;
        this.botLogModel = botLogModel;
        this.transactionModel = transactionModel;
        this.logger = new common_1.Logger(TelegramService_1.name);
        // Track which messages were sent as photos (have caption instead of text)
        this.photoMessageIds = new Set();
        const botToken = configService.get('TELEGRAM_BOT_TOKEN');
        this.adminChatId = configService.get('TELEGRAM_ADMIN_CHAT_ID') ?? '';
        if (botToken) {
            this.bot = new telegraf_1.Telegraf(botToken);
            this.initializeBot();
        }
    }
    initializeBot() {
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
    async startBot() {
        if (!this.bot)
            return;
        const webhookUrl = this.configService.get('TELEGRAM_WEBHOOK_URL');
        if (webhookUrl) {
            // Webhook mode — preferred for Render deployments
            try {
                const secretToken = this.configService.get('TELEGRAM_WEBHOOK_SECRET') ?? undefined;
                await this.bot.telegram.deleteWebhook({ drop_pending_updates: true });
                await this.bot.telegram.setWebhook(`${webhookUrl}/api/telegram/webhook`, {
                    secret_token: secretToken,
                });
                this.logger.log(`✅ Telegram webhook set: ${webhookUrl}/api/telegram/webhook`);
            }
            catch (error) {
                this.logger.error('Failed to set webhook, falling back to polling:', error);
                this.startPolling();
            }
        }
        else {
            // Polling mode — for local/dev
            this.startPolling();
        }
    }
    startPolling() {
        this.bot.launch({ dropPendingUpdates: true }).catch((error) => {
            this.logger.error('Failed to start Telegram bot polling:', error);
        });
        this.logger.log('✅ Telegram bot polling started (non-blocking)');
    }
    async stopBot() {
        if (this.bot) {
            this.bot.stop();
            this.logger.log('🛑 Telegram bot stopped');
        }
    }
    // Called by the webhook controller to process incoming updates
    async handleWebhookUpdate(update) {
        if (this.bot) {
            await this.bot.handleUpdate(update);
        }
    }
    async sendDepositNotification(deposit) {
        if (!this.bot)
            return;
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
            let sentMessage;
            let isPhoto = false;
            if (deposit.screenshotUrl && deposit.screenshotUrl.startsWith('data:')) {
                const matches = deposit.screenshotUrl.match(/^data:(.+);base64,(.+)$/);
                if (matches) {
                    const buffer = Buffer.from(matches[2], 'base64');
                    sentMessage = await this.bot.telegram.sendPhoto(this.adminChatId, { source: buffer }, { caption: message, parse_mode: 'Markdown', reply_markup: keyboard });
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
        }
        catch (error) {
            this.logger.error('Failed to send deposit notification:', error);
        }
    }
    async sendWithdrawNotification(withdraw) {
        if (!this.bot)
            return;
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
        }
        catch (error) {
            this.logger.error('Failed to send withdraw notification:', error);
        }
    }
    // Helper: edit a message that may be a photo (caption) or plain text
    async editBotMessage(chatId, messageId, newText) {
        const msgIdStr = messageId.toString();
        const isPhoto = this.photoMessageIds.has(msgIdStr);
        const tryEditText = async () => {
            await this.bot.telegram.editMessageText(chatId, Number(messageId), undefined, newText, { parse_mode: 'Markdown' });
        };
        const tryEditCaption = async () => {
            await this.bot.telegram.editMessageCaption(chatId, Number(messageId), undefined, newText, { parse_mode: 'Markdown' });
            this.photoMessageIds.delete(msgIdStr);
        };
        try {
            if (isPhoto) {
                await tryEditCaption();
            }
            else {
                await tryEditText();
            }
        }
        catch (err) {
            const message = err?.message ?? '';
            if (message.includes('message is not modified')) {
                return;
            }
            try {
                if (isPhoto) {
                    await tryEditText();
                }
                else {
                    await tryEditCaption();
                }
                return;
            }
            catch (fallbackErr) {
                if (!(fallbackErr?.message ?? '').includes('message is not modified')) {
                    this.logger.warn('editBotMessage error (non-critical):', fallbackErr?.message ?? message);
                }
            }
        }
    }
    async handleApproveDeposit(ctx) {
        const telegramCtx = ctx;
        try {
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
            const successText = `✅ *Depozit Təsdiqləndi*\n\n` +
                `👤 İstifadəçi: ${deposit.email}\n` +
                `💰 Məbləğ: ${deposit.amount} ${deposit.currency}\n` +
                `💳 Yeni Balans: ${user.balance} ${deposit.currency}`;
            if (deposit.telegramChatId && deposit.telegramMessageId) {
                await this.editBotMessage(deposit.telegramChatId, deposit.telegramMessageId, successText);
            }
            await ctx.answerCbQuery('✅ Depozit təsdiqləndi!', { show_alert: true });
            await this.logBotAction('approval', deposit.userId, deposit.amount, telegramCtx.callbackQuery?.id ?? '');
        }
        catch (error) {
            this.logger.error('Error approving deposit:', error);
            await ctx.answerCbQuery('❌ Xəta baş verdi', { show_alert: true }).catch(() => { });
        }
    }
    async handleRejectDeposit(ctx) {
        const telegramCtx = ctx;
        try {
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
            const rejectText = `❌ *Depozit Rədd Edildi*\n\n` +
                `👤 İstifadəçi: ${deposit.email}\n` +
                `💰 Məbləğ: ${deposit.amount} ${deposit.currency}\n` +
                `📋 Səbəb: Admin tərəfindən rədd edildi`;
            if (deposit.telegramChatId && deposit.telegramMessageId) {
                await this.editBotMessage(deposit.telegramChatId, deposit.telegramMessageId, rejectText);
            }
            await ctx.answerCbQuery('❌ Depozit rədd edildi!', { show_alert: true });
            await this.logBotAction('rejection', deposit.userId, deposit.amount, telegramCtx.callbackQuery?.id ?? '');
        }
        catch (error) {
            this.logger.error('Error rejecting deposit:', error);
            await ctx.answerCbQuery('❌ Xəta baş verdi', { show_alert: true }).catch(() => { });
        }
    }
    async handleApproveWithdraw(ctx) {
        const telegramCtx = ctx;
        try {
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
            const successText = `✅ *Çıxarış Təsdiqləndi*\n\n` +
                `👤 İstifadəçi: ${withdraw.email}\n` +
                `💰 Məbləğ: ${withdraw.amount} ${withdraw.currency}`;
            if (withdraw.telegramChatId && withdraw.telegramMessageId) {
                await this.editBotMessage(withdraw.telegramChatId, withdraw.telegramMessageId, successText);
            }
            await ctx.answerCbQuery('✅ Çıxarış təsdiqləndi!', { show_alert: true });
            await this.logBotAction('approval', withdraw.userId, withdraw.amount, telegramCtx.callbackQuery?.id ?? '');
        }
        catch (error) {
            this.logger.error('Error approving withdraw:', error);
            await ctx.answerCbQuery('❌ Xəta baş verdi', { show_alert: true }).catch(() => { });
        }
    }
    async handleRejectWithdraw(ctx) {
        const telegramCtx = ctx;
        try {
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
            const rejectText = `❌ *Çıxarış Rədd Edildi*\n\n` +
                `👤 İstifadəçi: ${withdraw.email}\n` +
                `💰 Məbləğ: ${withdraw.amount} ${withdraw.currency}\n` +
                `💸 Məbləğ balansa geri qaytarıldı`;
            if (withdraw.telegramChatId && withdraw.telegramMessageId) {
                await this.editBotMessage(withdraw.telegramChatId, withdraw.telegramMessageId, rejectText);
            }
            await ctx.answerCbQuery('❌ Çıxarış rədd edildi!', { show_alert: true });
            await this.logBotAction('rejection', withdraw.userId, withdraw.amount, telegramCtx.callbackQuery?.id ?? '');
        }
        catch (error) {
            this.logger.error('Error rejecting withdraw:', error);
            await ctx.answerCbQuery('❌ Xəta baş verdi', { show_alert: true }).catch(() => { });
        }
    }
    async logBotAction(action, userId, amount, messageId) {
        try {
            await this.botLogModel.create({
                action,
                relatedUserId: userId,
                amount,
                messageId,
                messageText: `Bot action: ${action}`,
                status: 'success',
            });
        }
        catch (error) {
            this.logger.error('Error logging bot action:', error);
        }
    }
};
exports.TelegramService = TelegramService;
exports.TelegramService = TelegramService = TelegramService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, mongoose_1.InjectModel)(deposit_schema_1.Deposit.name)),
    __param(2, (0, mongoose_1.InjectModel)(withdraw_schema_1.Withdraw.name)),
    __param(3, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(4, (0, mongoose_1.InjectModel)(bot_log_schema_1.BotLog.name)),
    __param(5, (0, mongoose_1.InjectModel)(transaction_schema_1.Transaction.name)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], TelegramService);
//# sourceMappingURL=telegram.service.js.map