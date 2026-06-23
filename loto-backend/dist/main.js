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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = __importDefault(require("helmet"));
const config_1 = require("@nestjs/config");
const express_rate_limit_1 = require("express-rate-limit");
const all_exceptions_filter_1 = require("./common/filters/all-exceptions.filter");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
const app_module_1 = require("./app.module");
const mongoose_1 = require("@nestjs/mongoose");
const bcrypt = __importStar(require("bcryptjs"));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const compression = require('compression');
async function seedAdmin(app) {
    try {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (!adminEmail || !adminPassword) {
            console.log('--- ADMIN_EMAIL və ya ADMIN_PASSWORD env tapılmadı, seed atlandı ---');
            return;
        }
        const AdminModel = app.get((0, mongoose_1.getModelToken)('Admin'));
        const existing = await AdminModel.findOne({ email: adminEmail });
        if (existing) {
            console.log(`--- Admin artıq mövcuddur: ${adminEmail} ---`);
            return;
        }
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await AdminModel.create({
            email: adminEmail,
            password: hashedPassword,
            firstName: 'Super',
            lastName: 'Admin',
            permissions: ['view_users', 'view_games', 'manage_deposits', 'manage_withdraws'],
            isSuperAdmin: true,
            isActive: true,
        });
        console.log(`✅ Admin uğurla yaradıldı: ${adminEmail}`);
    }
    catch (err) {
        console.error('--- Admin seed xətası:', err);
    }
}
async function bootstrap() {
    console.log('--- Bootstrap prosesi başlayır ---');
    try {
        // CORS: Allow frontend URL from env, plus localhost for dev
        const allowedOrigins = [
            'http://localhost:3001',
            'http://localhost:3000',
            ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
        ].filter(Boolean);
        console.log('--- İcazə verilən originlər:', allowedOrigins, '---');
        const app = await core_1.NestFactory.create(app_module_1.AppModule, {
            cors: {
                origin: (origin, callback) => {
                    // Allow requests with no origin (mobile apps, curl, Render health checks)
                    if (!origin)
                        return callback(null, true);
                    if (allowedOrigins.some((o) => origin === o) ||
                        origin.endsWith('.onrender.com') ||
                        origin.endsWith('.vercel.app') ||
                        origin.endsWith('.netlify.app')) {
                        return callback(null, true);
                    }
                    console.warn(`CORS: rədd edildi - ${origin}`);
                    return callback(new Error('Not allowed by CORS'));
                },
                credentials: true,
                methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
            },
        });
        console.log('--- Nest Application yaradıldı ---');
        app.setGlobalPrefix('api', {
            exclude: ['/', '/health'],
        });
        console.log('--- Global Prefix /api təyin edildi (/ və /health exclude edildi) ---');
        const configService = app.get(config_1.ConfigService);
        const port = Number(process.env.PORT ?? configService.get('PORT') ?? 3000);
        const nodeEnv = configService.get('NODE_ENV', 'development');
        console.log(`--- Konfiqurasiya oxundu, port: ${port}, env: ${nodeEnv} ---`);
        app.use((0, helmet_1.default)());
        app.use(compression());
        console.log('--- Middleware-lər əlavə edildi ---');
        app.use((0, express_rate_limit_1.rateLimit)({
            windowMs: configService.get('RATE_LIMIT_WINDOW_MS', 900000),
            max: configService.get('RATE_LIMIT_MAX_REQUESTS', 100),
            standardHeaders: true,
            legacyHeaders: false,
            message: {
                statusCode: 429,
                message: 'Too many requests, please try again later.',
            },
        }));
        console.log('--- Rate Limit əlavə edildi ---');
        app.useGlobalPipes(new common_1.ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }));
        app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter());
        app.useGlobalInterceptors(new transform_interceptor_1.TransformInterceptor());
        console.log('--- Global Pipes/Filters/Interceptors quraşdırıldı ---');
        if (nodeEnv !== 'production') {
            const config = new swagger_1.DocumentBuilder()
                .setTitle('Loto Backend API')
                .setDescription('Russian Lotto Game Backend API Documentation')
                .setVersion('1.0.0')
                .addBearerAuth()
                .build();
            const document = swagger_1.SwaggerModule.createDocument(app, config);
            swagger_1.SwaggerModule.setup('docs', app, document);
            console.log('--- Swagger quraşdırıldı ---');
        }
        // Seed super admin
        await seedAdmin(app);
        console.log(`--- Listen əmri çağırılır (port: ${port}) ---`);
        await app.listen(port, '0.0.0.0');
        console.log(`🚀 Server uğurla işə düşdü və ${port} portunda dinləyir!`);
    }
    catch (error) {
        console.error('--- XƏTA BAŞ VERDİ: ---', error);
        setTimeout(() => process.exit(1), 500);
    }
}
bootstrap();
//# sourceMappingURL=main.js.map
