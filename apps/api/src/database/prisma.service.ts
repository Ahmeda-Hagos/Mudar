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
}
