import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsRepository } from './tenants.repository';
import { TenantsController } from './tenants.controller';

@Module({
  controllers: [TenantsController],
  providers: [TenantsService, TenantsRepository],
  exports: [TenantsService, TenantsRepository],
})
export class TenantsModule {}
