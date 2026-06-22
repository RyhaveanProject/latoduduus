import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { rateLimit } from 'express-rate-limit';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AppModule } from './app.module';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const compression = require('compression');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });

  const configService = app.get(ConfigService);
  
  // Render-in təyin etdiyi PORT-u götürmək üçün əsaslı yoxlanış
  const port = process.env.PORT || configService.get<number>('PORT', 3000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  app.use(helmet());
  app.use(compression());

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

  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Loto Backend API')
      .setDescription('Russian Lotto Game Backend API Documentation')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  // PORT dəyişənini explicit (açıq) şəkildə string/number çeviririk
  await app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`🔧 Environment: ${nodeEnv}`);
  });
}

bootstrap();
