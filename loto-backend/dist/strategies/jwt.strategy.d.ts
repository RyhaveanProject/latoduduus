import { ConfigService } from '@nestjs/config';
import { TokenPayloadDto } from '../dtos/auth.dto';
declare const JwtStrategy_base: new (...args: any[]) => any;
export declare class JwtStrategy extends JwtStrategy_base {
    constructor(configService: ConfigService);
    validate(payload: any): TokenPayloadDto;
}
export {};
//# sourceMappingURL=jwt.strategy.d.ts.map