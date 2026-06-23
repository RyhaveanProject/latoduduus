"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const bcrypt = __importStar(require("bcryptjs"));
const user_schema_1 = require("../../schemas/user.schema");
const admin_schema_1 = require("../../schemas/admin.schema");
const config_1 = require("@nestjs/config");
const uuid_1 = require("uuid");
let AuthService = class AuthService {
    constructor(userModel, adminModel, jwtService, configService) {
        this.userModel = userModel;
        this.adminModel = adminModel;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async getMe(userId) {
        // First try User collection
        const user = await this.userModel
            .findById(userId)
            .select('-password -emailVerificationToken -twoFactorSecret')
            .lean();
        if (user) {
            return {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                avatar: user.avatar,
                balance: user.balance,
                role: user.role,
                language: user.language,
                emailVerified: user.emailVerified,
                phoneNumber: user.phoneNumber,
                country: user.country,
                city: user.city,
                gamesPlayed: user.gamesPlayed,
                gamesWon: user.gamesWon,
                totalWinnings: user.totalWinnings,
                isBanned: user.isBanned,
                lastLoginAt: user.lastLoginAt,
                createdAt: user.createdAt,
            };
        }
        // Then try Admin collection
        const admin = await this.adminModel
            .findById(userId)
            .select('-password')
            .lean();
        if (admin) {
            return {
                id: admin._id,
                email: admin.email,
                firstName: admin.firstName,
                lastName: admin.lastName,
                role: 'admin',
                balance: 0,
                isSuperAdmin: admin.isSuperAdmin,
                permissions: admin.permissions,
                lastLoginAt: admin.lastLoginAt,
                createdAt: admin.createdAt,
            };
        }
        throw new common_1.NotFoundException('User not found');
    }
    async register(registerDto) {
        const { email, password, firstName, lastName, language } = registerDto;
        const existingUser = await this.userModel.findOne({ email });
        if (existingUser) {
            throw new common_1.ConflictException('Email already registered');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new this.userModel({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            language: language || 'en',
            emailVerificationToken: (0, uuid_1.v4)(),
        });
        const savedUser = await user.save();
        const tokens = await this.generateTokens(savedUser._id, email, 'user');
        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: {
                id: savedUser._id,
                email: savedUser.email,
                firstName: savedUser.firstName,
                lastName: savedUser.lastName,
                balance: savedUser.balance,
                role: savedUser.role,
            },
        };
    }
    async login(loginDto) {
        const { email, password } = loginDto;
        // 1) Check Admin collection first
        const admin = await this.adminModel.findOne({ email: email.toLowerCase() });
        if (admin) {
            if (!admin.isActive) {
                throw new common_1.UnauthorizedException('Admin account is not active');
            }
            const isPasswordValid = await bcrypt.compare(password, admin.password);
            if (!isPasswordValid) {
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            admin.lastLoginAt = new Date();
            await admin.save();
            const tokens = await this.generateTokens(admin._id, admin.email, 'admin');
            return {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                user: {
                    id: admin._id,
                    email: admin.email,
                    firstName: admin.firstName,
                    lastName: admin.lastName,
                    balance: 0,
                    role: 'admin',
                },
            };
        }
        // 2) Check User collection
        const user = await this.userModel.findOne({ email });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.isBanned) {
            throw new common_1.UnauthorizedException(`Account is banned. Reason: ${user.bannedReason || 'No reason provided'}`);
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        user.lastLoginAt = new Date();
        await user.save();
        const tokens = await this.generateTokens(user._id, user.email, user.role);
        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                balance: user.balance,
                role: user.role,
            },
        };
    }
    async googleAuth(googleAuthDto) {
        let profile;
        try {
            const parts = googleAuthDto.idToken.split('.');
            const decoded = Buffer.from(parts[1], 'base64').toString('utf-8');
            profile = JSON.parse(decoded);
        }
        catch (error) {
            throw new common_1.BadRequestException('Invalid Google token');
        }
        const { email, given_name, family_name, picture, sub: googleId } = profile;
        let user = await this.userModel.findOne({ email });
        if (!user) {
            user = new this.userModel({
                email,
                firstName: given_name,
                lastName: family_name,
                avatar: picture,
                googleId,
                emailVerified: true,
            });
            await user.save();
        }
        else if (!user.googleId) {
            user.googleId = googleId;
            await user.save();
        }
        if (user.isBanned) {
            throw new common_1.UnauthorizedException(`Account is banned. Reason: ${user.bannedReason || 'No reason provided'}`);
        }
        user.lastLoginAt = new Date();
        await user.save();
        const tokens = await this.generateTokens(user._id, user.email, user.role);
        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                balance: user.balance,
                role: user.role,
            },
        };
    }
    async refreshToken(refreshTokenDto) {
        try {
            const payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
                secret: this.configService.get('JWT_REFRESH_SECRET', 'refresh-secret'),
            });
            // Try User first, then Admin
            let entityId = payload.sub;
            let role = payload.role;
            let email = payload.email;
            let firstName;
            let lastName;
            let balance = 0;
            if (role === 'admin') {
                const admin = await this.adminModel.findById(entityId);
                if (!admin || !admin.isActive) {
                    throw new common_1.UnauthorizedException('Invalid refresh token');
                }
                firstName = admin.firstName;
                lastName = admin.lastName;
                email = admin.email;
            }
            else {
                const user = await this.userModel.findById(entityId);
                if (!user || user.isBanned) {
                    throw new common_1.UnauthorizedException('Invalid refresh token');
                }
                firstName = user.firstName;
                lastName = user.lastName;
                email = user.email;
                balance = user.balance;
                role = user.role;
            }
            const tokens = await this.generateTokens(entityId, email, role);
            return {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                user: {
                    id: entityId,
                    email,
                    firstName,
                    lastName,
                    balance,
                    role,
                },
            };
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async forgotPassword(forgotPasswordDto) {
        const { email } = forgotPasswordDto;
        const user = await this.userModel.findOne({ email });
        if (!user)
            return;
        const resetToken = (0, uuid_1.v4)();
        user.emailVerificationToken = resetToken;
        await user.save();
    }
    async resetPassword(resetPasswordDto) {
        const { token, newPassword } = resetPasswordDto;
        const user = await this.userModel.findOne({
            emailVerificationToken: token,
        });
        if (!user) {
            throw new common_1.BadRequestException('Invalid or expired reset token');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.emailVerificationToken = undefined;
        await user.save();
    }
    async verifyEmail(token) {
        const user = await this.userModel.findOne({
            emailVerificationToken: token,
        });
        if (!user) {
            throw new common_1.BadRequestException('Invalid or expired verification token');
        }
        user.emailVerified = true;
        user.emailVerificationToken = undefined;
        await user.save();
    }
    async generateTokens(userId, email, role) {
        const payload = { sub: userId, email, role };
        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_SECRET', 'secret'),
            expiresIn: this.configService.get('JWT_EXPIRATION', '1h'),
        });
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_REFRESH_SECRET', 'refresh-secret'),
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '7d'),
        });
        return { accessToken, refreshToken };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(admin_schema_1.Admin.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map