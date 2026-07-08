import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Provider Registry Service.
 * Acts as the centralized controller deciding which concrete adapters
 * to inject based on the environment configurations.
 */
@Injectable()
export class ProviderRegistryService implements OnModuleInit {
  private readonly logger = new Logger(ProviderRegistryService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const nodeEnv = this.configService.get<string>('app.nodeEnv') ?? 'development';
    const emailProvider = this.configService.get<string>('app.emailProvider') ?? 'console';

    this.logger.log(`
┌────────────────────────────────────────────────────────┐
│   INFRASTRUCTURE AGNOSTIC ADAPTER REGISTRY             │
├────────────────────────────────────────────────────────┤
│   Active Node Env   : ${nodeEnv.padEnd(25)}│
│   Auth Provider     : Supabase Auth Adapter             │
│   Storage Provider  : Supabase Storage Adapter          │
│   Email Provider    : ${emailProvider.padEnd(28)}│
└────────────────────────────────────────────────────────┘
    `);
  }
}
