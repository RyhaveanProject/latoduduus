"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const games_module_1 = require("./modules/games/games.module");
const rooms_module_1 = require("./modules/rooms/rooms.module");
const deposits_module_1 = require("./modules/deposits/deposits.module");
const admin_module_1 = require("./modules/admin/admin.module");
const telegram_module_1 = require("./modules/telegram/telegram.module");
const gateways_module_1 = require("./gateways/gateways.module");
const health_controller_1 = require("./health.controller");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            mongoose_1.MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/loto-db'),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            games_module_1.GamesModule,
            rooms_module_1.RoomsModule,
            deposits_module_1.DepositsModule,
            admin_module_1.AdminModule,
            telegram_module_1.TelegramModule,
            gateways_module_1.GatewaysModule,
        ],
        controllers: [health_controller_1.HealthController],
        providers: [],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map