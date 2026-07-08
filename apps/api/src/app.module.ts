import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { appConfig } from './config/app.config';
import { DatabaseModule } from './database/database.module';
import { ProviderRegistryModule } from './config/provider-registry.module';
import { AuthModule } from './modules/auth/auth.module';
import { StorageModule } from './modules/storage/storage.module';
import { BillingModule } from './modules/billing/billing.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { FormTemplatesModule } from './modules/form-templates/form-templates.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

/**
 * AppModule — Root module.
 *
 * Architecture:
 *   AppModule
 *   ├── ConfigModule      (environment & validation)
 *   ├── DatabaseModule    (Prisma service)
 *   ├── AuthModule        (abstracted auth service)
 *   ├── TenantsModule     (multi-tenant management)
 *   ├── UsersModule       (user CRUD)
 *   ├── ApplicationsModule (visa application workflow)
 *   ├── DocumentsModule   (upload, OCR, validation)
 *   ├── TemplatesModule   (embassy document checklists)
 *   ├── FormTemplatesModule (PDF automation engine)
 *   ├── NotificationsModule
 *   ├── StorageModule     (abstracted file storage)
 *   └── BillingModule     (subscriptions & quotas)
 *
 * Modules are added here in Phase 2 as they are implemented.
 * Each module import is a single line — all logic lives inside its module.
 */
@Module({
  imports: [
    // Configuration — must be first
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // Global Agnostic Registry
    ProviderRegistryModule,

    // Database — Prisma
    DatabaseModule,

    // Feature modules
    AuthModule,
    StorageModule,
    BillingModule,
    TenantsModule,
    UsersModule,
    ApplicationsModule,
    DocumentsModule,
    TemplatesModule,
    FormTemplatesModule,
    NotificationsModule,
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
