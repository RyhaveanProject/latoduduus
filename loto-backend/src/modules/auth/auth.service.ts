import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../../schemas/user.schema';
import { Admin, AdminDocument } from '../../schemas/admin.schema';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  RefreshTokenDto,
  AuthResponseDto,
  GoogleAuthDto,
} from '../../dtos/auth.dto';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async getMe(userId: string) {
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
        createdAt: (admin as any).createdAt,
      };
    }

    throw new NotFoundException('User not found');
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, firstName, lastName, language } = registerDto;

    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new this.userModel({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      language: language || 'en',
      emailVerificationToken: uuidv4(),
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

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // 1) Check Admin collection first
    const admin = await this.adminModel.findOne({ email: email.toLowerCase() });
    if (admin) {
      if (!admin.isActive) {
        throw new UnauthorizedException('Admin account is not active');
      }
      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
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
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isBanned) {
      throw new UnauthorizedException(
        `Account is banned. Reason: ${user.bannedReason || 'No reason provided'}`,
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
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

  async googleAuth(googleAuthDto: GoogleAuthDto): Promise<AuthResponseDto> {
    let profile: any;
    try {
      const parts = googleAuthDto.idToken.split('.');
      const decoded = Buffer.from(parts[1], 'base64').toString('utf-8');
      profile = JSON.parse(decoded);
    } catch (error) {
      throw new BadRequestException('Invalid Google token');
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
    } else if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }

    if (user.isBanned) {
      throw new UnauthorizedException(
        `Account is banned. Reason: ${user.bannedReason || 'No reason provided'}`,
      );
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

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    try {
      const payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'refresh-secret'),
      });

      // Try User first, then Admin
      let entityId = payload.sub;
      let role = payload.role;
      let email = payload.email;
      let firstName: string | undefined;
      let lastName: string | undefined;
      let balance = 0;

      if (role === 'admin') {
        const admin = await this.adminModel.findById(entityId);
        if (!admin || !admin.isActive) {
          throw new UnauthorizedException('Invalid refresh token');
        }
        firstName = admin.firstName;
        lastName = admin.lastName;
        email = admin.email;
      } else {
        const user = await this.userModel.findById(entityId);
        if (!user || user.isBanned) {
          throw new UnauthorizedException('Invalid refresh token');
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
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const { email } = forgotPasswordDto;
    const user = await this.userModel.findOne({ email });
    if (!user) return;

    const resetToken = uuidv4();
    user.emailVerificationToken = resetToken;
    await user.save();
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { token, newPassword } = resetPasswordDto;

    const user = await this.userModel.findOne({
      emailVerificationToken: token,
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.emailVerificationToken = undefined;
    await user.save();
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await this.userModel.findOne({
      emailVerificationToken: token,
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload as any, {
      secret: this.configService.get<string>('JWT_SECRET', 'secret'),
      expiresIn: this.configService.get<string>('JWT_EXPIRATION', '1h') as any,
    });

    const refreshToken = this.jwtService.sign(payload as any, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'refresh-secret'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d') as any,
    });

    return { accessToken, refreshToken };
  }
}
