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
var TelegramModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const telegram_service_1 = require("./telegram.service");
const telegram_controller_1 = require("./telegram.controller");
const deposit_schema_1 = require("../../schemas/deposit.schema");
const withdraw_schema_1 = require("../../schemas/withdraw.schema");
const user_schema_1 = require("../../schemas/user.schema");
const bot_log_schema_1 = require("../../schemas/bot-log.schema");
const transaction_schema_1 = require("../../schemas/transaction.schema");
let TelegramModule = TelegramModule_1 = class TelegramModule {
    constructor(telegramService) {
        this.telegramService = telegramService;
        this.logger = new common_1.Logger(TelegramModule_1.name);
    }
    async onModuleInit() {
        try {
            await this.telegramService.startBot();
            this.logger.log('✅ Telegram bot initialized');
        }
        catch (error) {
            this.logger.error('❌ Telegram bot initialization failed', error);
        }
    }
    async onModuleDestroy() {
        await this.telegramService.stopBot();
    }
};
exports.TelegramModule = TelegramModule;
exports.TelegramModule = TelegramModule = TelegramModule_1 = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: deposit_schema_1.Deposit.name, schema: deposit_schema_1.DepositSchema },
                { name: withdraw_schema_1.Withdraw.name, schema: withdraw_schema_1.WithdrawSchema },
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: bot_log_schema_1.BotLog.name, schema: bot_log_schema_1.BotLogSchema },
                { name: transaction_schema_1.Transaction.name, schema: transaction_schema_1.TransactionSchema },
            ]),
        ],
        controllers: [telegram_controller_1.TelegramController],
        providers: [telegram_service_1.TelegramService],
        exports: [telegram_service_1.TelegramService],
    }),
    __metadata("design:paramtypes", [telegram_service_1.TelegramService])
], TelegramModule);
//# sourceMappingURL=telegram.module.js.map