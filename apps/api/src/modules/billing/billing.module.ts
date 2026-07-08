import { Module } from '@nestjs/common';
import { StripeBillingService } from './stripe-billing.service';
import { IBillingServiceToken } from './billing.service.interface';
import { BillingController } from './billing.controller';

@Module({
  controllers: [BillingController],
  providers: [
    StripeBillingService,
    {
      provide: IBillingServiceToken,
      useClass: StripeBillingService,
    },
  ],
  exports: [StripeBillingService, IBillingServiceToken],
})
export class BillingModule {}
