import { Controller, Post, Body, Get, UseGuards, Headers, HttpCode } from '@nestjs/common';
import { StripeBillingService } from './stripe-billing.service';
import { TenantAccessGuard } from '../../common/guards/tenant-access.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: StripeBillingService) {}

  @Post('checkout')
  @ApiBearerAuth()
  @UseGuards(TenantAccessGuard)
  @ApiOperation({ summary: 'Create billing checkout session' })
  async checkout(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: { plan: string; cycle: 'MONTHLY' | 'ANNUAL' }
  ) {
    const url = await this.billingService.createCheckoutSession(tenantId, body.plan, body.cycle);
    return { url };
  }

  @Get('subscription')
  @ApiBearerAuth()
  @UseGuards(TenantAccessGuard)
  @ApiOperation({ summary: 'Get current subscription details' })
  async getSubscription(@Headers('x-tenant-id') tenantId: string) {
    return this.billingService.getSubscription(tenantId);
  }

  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Mock Stripe billing webhook event handler' })
  async mockWebhook(@Body() payload: any) {
    // Simulated billing event handler to upgrade plans dynamically on database records
    return { received: true };
  }
}
