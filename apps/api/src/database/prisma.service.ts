import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService — Database access layer.
 *
 * Extends PrismaClient and handles connection lifecycle.
 * Every Repository class receives this via constructor injection.
 *
 * IMPORTANT: No module reads PrismaClient directly — all database
 * access goes through a Repository class that receives PrismaService.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { level: 'query',   emit: 'event' },
        { level: 'error',   emit: 'stdout' },
        { level: 'warn',    emit: 'stdout' },
      ],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Database connected');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  /**
   * Scopes all queries inside the execution callback to a specific tenant
   * using database-level Row-Level Security (RLS).
   */
  async $withTenant<T>(tenantId: string, run: (tx: any) => Promise<T>): Promise<T> {
    // Validate UUID to prevent basic injection attempts
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      throw new Error('Invalid tenantId format');
    }

    return this.$transaction(async (tx) => {
      // Set the session context parameter before executing the query block
      // using parameterized queries to prevent SQL injection
      await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`;
      return run(tx);
    });
  }
}
