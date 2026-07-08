import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { StructuredLogger } from './common/logger/structured.logger';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Reflector } from '@nestjs/core';
import { TenantAccessGuard } from './common/guards/tenant-access.guard';
import { RolesGuard } from './common/guards/roles.guard';

/**
 * Bootstrap — NestJS application entrypoint.
 *
 * Production configuration applied here:
 *  - Global ValidationPipe (class-validator)
 *  - URI versioning (/v1/...)
 *  - Swagger/OpenAPI docs
 *  - CORS (configured per environment)
 *  - Shutdown hooks
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new StructuredLogger(),
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('app.port') ?? 3000;
  const nodeEnv = config.get<string>('app.nodeEnv') ?? 'development';

  // ── Security Headers (Helmet) ────────────────────────────────────────────────
  app.use(helmet());

  // ── Rate Limiting (Standard OWASP Protection) ────────────────────────────────
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per window
      message: 'Too many requests from this IP, please try again after 15 minutes',
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // ── Global Prefix & Versioning ──────────────────────────────────────────────
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // ── Global Exception Filter ─────────────────────────────────────────────────
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ── Global Security Guards ──────────────────────────────────────────────────
  const reflector = app.get(Reflector);
  app.useGlobalGuards(
    new TenantAccessGuard(reflector),
    new RolesGuard(reflector),
  );

  // ── Global Validation Pipe ──────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,         // Strip unknown properties
      forbidNonWhitelisted: true,
      transform: true,         // Auto-transform payloads to DTO class instances
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ── CORS ────────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: config.get<string>('app.corsOrigin') ?? 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
  });

  // ── Swagger (disabled in production) ───────────────────────────────────────
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('VisaFlow AI API')
      .setDescription('Enterprise Visa Management Platform — REST API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication & session management')
      .addTag('applications', 'Visa application workflow')
      .addTag('documents', 'Document upload & OCR')
      .addTag('templates', 'Embassy document checklists')
      .addTag('form-templates', 'PDF automation engine')
      .addTag('users', 'User management')
      .addTag('tenants', 'Multi-tenant management')
      .addTag('notifications', 'Notification service')
      .addTag('billing', 'Subscriptions & billing')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  // ── Graceful Shutdown ───────────────────────────────────────────────────────
  app.enableShutdownHooks();

  await app.listen(port);

  console.log(`
╔══════════════════════════════════════════════════╗
║   VisaFlow AI API                                ║
║   Environment : ${nodeEnv.padEnd(32)}║
║   Port        : ${String(port).padEnd(32)}║
║   Swagger     : http://localhost:${port}/docs${' '.repeat(14)}║
╚══════════════════════════════════════════════════╝
  `);
}

bootstrap();
