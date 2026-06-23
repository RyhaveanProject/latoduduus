export declare class RegisterDto {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    language?: string;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class ForgotPasswordDto {
    email: string;
}
export declare class ResetPasswordDto {
    token: string;
    newPassword: string;
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
export declare class VerifyEmailDto {
    token: string;
}
export declare class GoogleAuthDto {
    idToken: string;
    accessToken?: string;
}
export declare class AuthResponseDto {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
        balance: number;
        role: string;
    };
}
export declare class TokenPayloadDto {
    sub: string;
    email: string;
    role: string;
    iat: number;
    exp: number;
}
//# sourceMappingURL=auth.dto.d.ts.map