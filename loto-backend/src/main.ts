import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import rateLimit from 'express-rate-limit';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // Security middleware
  app.use(helmet());
  app.use(compression());

  // Global rate limiting
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

  // Global validation pipe
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

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global interceptor
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger documentation
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Loto Backend API')
      .setDescription('Russian Lotto Game Backend API Documentation')
      .setVersion('1.0.0')
      .addBearerAuth()
      .addTag('Auth', 'Authentication endpoints')
      .addTag('Games', 'Game management endpoints')
      .addTag('Rooms', 'Room management endpoints')
      .addTag('Users', 'User management endpoints')
      .addTag('Deposits', 'Deposit management endpoints')
      .addTag('Admin', 'Admin endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📚 Swagger docs: http://localhost:${port}/docs`);
    console.log(`🔧 Environment: ${nodeEnv}`);
  });
}

bootstrap();
