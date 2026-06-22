import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { rateLimit } from 'express-rate-limit';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AppModule } from './app.module';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const compression = require('compression');

async function seedAdmin(app: any) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.log('--- ADMIN_EMAIL və ya ADMIN_PASSWORD env tapılmadı, seed atlandı ---');
      return;
    }

    const AdminModel = app.get(getModelToken('Admin'));
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
  } catch (err) {
    console.error('--- Admin seed xətası:', err);
  }
}

async function bootstrap() {
  console.log('--- Bootstrap prosesi başlayır ---');

  try {
    const app = await NestFactory.create(AppModule, {
      cors: true,
    });
    console.log('--- Nest Application yaradıldı ---');

    // FIX: '/' və '/health' route-ları prefix-dən kənar saxlanır
    // Render platforması bu endpoint-ləri health probe üçün yoxlayır
    app.setGlobalPrefix('api', {
      exclude: ['/', '/health'],
    });
    console.log('--- Global Prefix /api təyin edildi (/ və /health exclude edildi) ---');

    const configService = app.get(ConfigService);
    const port = Number(process.env.PORT ?? configService.get<string>('PORT') ?? 3000);
    const nodeEnv = configService.get<string>('NODE_ENV', 'development');

    console.log(`--- Konfiqurasiya oxundu, port: ${port}, env: ${nodeEnv} ---`);

    app.use(helmet());
    app.use(compression());
    console.log('--- Middleware-lər əlavə edildi ---');

    app.use(
      rateLimit({
        windowMs: configService.get<number>('RATE_LIMIT_WINDOW_MS', 900000),
        max: configService.get<number>('RATE_LIMIT_MAX_REQUESTS', 100),
        standardHeaders: true,
        legacyHeaders: false,
        message: {
          statusCode: 429,
          message: 'Too many requests, please try again later.',
        },
      }),
    );
    console.log('--- Rate Limit əlavə edildi ---');

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    console.log('--- Global Pipes/Filters/Interceptors quraşdırıldı ---');

    if (nodeEnv !== 'production') {
      const config = new DocumentBuilder()
        .setTitle('Loto Backend API')
        .setDescription('Russian Lotto Game Backend API Documentation')
        .setVersion('1.0.0')
        .addBearerAuth()
        .build();

      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('docs', app, document);
      console.log('--- Swagger quraşdırıldı ---');
    }

    // Seed super admin
    await seedAdmin(app);

    console.log(`--- Listen əmri çağırılır (port: ${port}) ---`);
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 Server uğurla işə düşdü və ${port} portunda dinləyir!`);
  } catch (error) {
    console.error('--- XƏTA BAŞ VERDİ: ---', error);
    setTimeout(() => process.exit(1), 500);
  }
}

bootstrap();
