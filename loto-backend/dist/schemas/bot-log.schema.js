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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotLogSchema = exports.BotLog = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const uuid_1 = require("uuid");
let BotLog = class BotLog {
};
exports.BotLog = BotLog;
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        default: () => (0, uuid_1.v4)(),
    }),
    __metadata("design:type", String)
], BotLog.prototype, "_id", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], BotLog.prototype, "telegramUserId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], BotLog.prototype, "relatedUserId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: ['deposit_request', 'withdraw_request', 'approval', 'rejection', 'error'],
    }),
    __metadata("design:type", String)
], BotLog.prototype, "action", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], BotLog.prototype, "amount", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], BotLog.prototype, "messageId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], BotLog.prototype, "messageText", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], BotLog.prototype, "callbackData", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.SchemaTypes.Mixed }),
    __metadata("design:type", Object)
], BotLog.prototype, "metadata", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'success', enum: ['success', 'error'] }),
    __metadata("design:type", String)
], BotLog.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], BotLog.prototype, "errorMessage", void 0);
exports.BotLog = BotLog = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], BotLog);
exports.BotLogSchema = mongoose_1.SchemaFactory.createForClass(BotLog);
//# sourceMappingURL=bot-log.schema.js.map