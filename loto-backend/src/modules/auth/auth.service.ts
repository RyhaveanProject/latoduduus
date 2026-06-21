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
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, firstName, lastName, language } = registerDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new this.userModel({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      language: language || 'en',
      emailVerificationToken: uuidv4(),
    });

    const savedUser = await user.save();

    // Generate tokens
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

    // Find user
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is banned
    if (user.isBanned) {
      throw new UnauthorizedException(
        `Account is banned. Reason: ${user.bannedReason || 'No reason provided'}`,
      );
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate tokens
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
    // In production, verify the ID token with Google's servers
    // For now, we'll extract the payload from the token

    let profile: any;
    try {
      // Verify and decode token (simplified - in production use google-auth-library)
      const parts = googleAuthDto.idToken.split('.');
      const decoded = Buffer.from(parts[1], 'base64').toString('utf-8');
      profile = JSON.parse(decoded);
    } catch (error) {
      throw new BadRequestException('Invalid Google token');
    }

    const { email, given_name, family_name, picture, sub: googleId } = profile;

    // Find or create user
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

    // Check if user is banned
    if (user.isBanned) {
      throw new UnauthorizedException(
        `Account is banned. Reason: ${user.bannedReason || 'No reason provided'}`,
      );
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate tokens
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

      const user = await this.userModel.findById(payload.sub);
      if (!user || user.isBanned) {
        throw new UnauthorizedException('Invalid refresh token');
      }

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
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const { email } = forgotPasswordDto;

    const user = await this.userModel.findOne({ email });
    if (!user) {
      // Don't reveal if email exists
      return;
    }

    // Generate reset token
    const resetToken = uuidv4();
    user.emailVerificationToken = resetToken;
    await user.save();

    // In production, send email with reset link
    // await this.emailService.sendPasswordResetEmail(email, resetToken);
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

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET', 'secret'),
      expiresIn: this.configService.get<string>('JWT_EXPIRATION', '1h'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'refresh-secret'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d'),
    });

    return { accessToken, refreshToken };
  }
}
