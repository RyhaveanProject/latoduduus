import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, RefreshTokenDto, AuthResponseDto, GoogleAuthDto } from '../../dtos/auth.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<AuthResponseDto>;
    login(loginDto: LoginDto): Promise<AuthResponseDto>;
    googleAuth(googleAuthDto: GoogleAuthDto): Promise<AuthResponseDto>;
    refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto>;
    forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    verifyEmail(token?: string): Promise<{
        message: string;
    }>;
    getCurrentUser(user: any): Promise<{
        id: any;
        email: string;
        firstName: string | undefined;
        lastName: string | undefined;
        avatar: string | undefined;
        balance: number;
        role: string;
        language: string;
        emailVerified: boolean;
        phoneNumber: string | undefined;
        country: string | undefined;
        city: string | undefined;
        gamesPlayed: number;
        gamesWon: number;
        totalWinnings: number;
        isBanned: boolean;
        lastLoginAt: Date | undefined;
        createdAt: Date;
        isSuperAdmin?: undefined;
        permissions?: undefined;
    } | {
        id: any;
        email: string;
        firstName: string | undefined;
        lastName: string | undefined;
        role: string;
        balance: number;
        isSuperAdmin: boolean;
        permissions: string[];
        lastLoginAt: Date | undefined;
        createdAt: any;
        avatar?: undefined;
        language?: undefined;
        emailVerified?: undefined;
        phoneNumber?: undefined;
        country?: undefined;
        city?: undefined;
        gamesPlayed?: undefined;
        gamesWon?: undefined;
        totalWinnings?: undefined;
        isBanned?: undefined;
    }>;
    logout(): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=auth.controller.d.ts.map