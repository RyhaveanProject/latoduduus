"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamesModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const games_service_1 = require("./games.service");
const games_controller_1 = require("./games.controller");
const game_schema_1 = require("../../schemas/game.schema");
const ticket_schema_1 = require("../../schemas/ticket.schema");
const room_schema_1 = require("../../schemas/room.schema");
const user_schema_1 = require("../../schemas/user.schema");
const transaction_schema_1 = require("../../schemas/transaction.schema");
const game_engine_service_1 = require("../../services/game-engine.service");
const users_module_1 = require("../users/users.module");
let GamesModule = class GamesModule {
};
exports.GamesModule = GamesModule;
exports.GamesModule = GamesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: game_schema_1.Game.name, schema: game_schema_1.GameSchema },
                { name: ticket_schema_1.Ticket.name, schema: ticket_schema_1.TicketSchema },
                { name: room_schema_1.Room.name, schema: room_schema_1.RoomSchema },
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: transaction_schema_1.Transaction.name, schema: transaction_schema_1.TransactionSchema },
            ]),
            users_module_1.UsersModule,
        ],
        controllers: [games_controller_1.GamesController],
        providers: [games_service_1.GamesService, game_engine_service_1.GameEngineService],
        exports: [games_service_1.GamesService, game_engine_service_1.GameEngineService],
    })
], GamesModule);
//# sourceMappingURL=games.module.js.map