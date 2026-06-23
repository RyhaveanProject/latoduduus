"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepositsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const deposits_service_1 = require("./deposits.service");
const deposits_controller_1 = require("./deposits.controller");
const withdraw_service_1 = require("./withdraw.service");
const withdraw_controller_1 = require("./withdraw.controller");
const deposit_schema_1 = require("../../schemas/deposit.schema");
const withdraw_schema_1 = require("../../schemas/withdraw.schema");
const user_schema_1 = require("../../schemas/user.schema");
const transaction_schema_1 = require("../../schemas/transaction.schema");
const telegram_module_1 = require("../telegram/telegram.module");
let DepositsModule = class DepositsModule {
};
exports.DepositsModule = DepositsModule;
exports.DepositsModule = DepositsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: deposit_schema_1.Deposit.name, schema: deposit_schema_1.DepositSchema },
                { name: withdraw_schema_1.Withdraw.name, schema: withdraw_schema_1.WithdrawSchema },
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: transaction_schema_1.Transaction.name, schema: transaction_schema_1.TransactionSchema },
            ]),
            telegram_module_1.TelegramModule,
        ],
        controllers: [deposits_controller_1.DepositsController, withdraw_controller_1.WithdrawController],
        providers: [deposits_service_1.DepositsService, withdraw_service_1.WithdrawService],
        exports: [deposits_service_1.DepositsService, withdraw_service_1.WithdrawService],
    })
], DepositsModule);
//# sourceMappingURL=deposits.module.js.map