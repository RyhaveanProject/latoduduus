"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const admin_service_1 = require("./admin.service");
const admin_controller_1 = require("./admin.controller");
const admin_schema_1 = require("../../schemas/admin.schema");
const user_schema_1 = require("../../schemas/user.schema");
const deposit_schema_1 = require("../../schemas/deposit.schema");
const withdraw_schema_1 = require("../../schemas/withdraw.schema");
const bot_log_schema_1 = require("../../schemas/bot-log.schema");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: admin_schema_1.Admin.name, schema: admin_schema_1.AdminSchema },
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: deposit_schema_1.Deposit.name, schema: deposit_schema_1.DepositSchema },
                { name: withdraw_schema_1.Withdraw.name, schema: withdraw_schema_1.WithdrawSchema },
                { name: bot_log_schema_1.BotLog.name, schema: bot_log_schema_1.BotLogSchema },
            ]),
        ],
        controllers: [admin_controller_1.AdminController],
        providers: [admin_service_1.AdminService],
        exports: [admin_service_1.AdminService],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map