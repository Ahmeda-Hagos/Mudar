import { Controller, Get, Body, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TenantsService } from './tenants.service';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@visaflow/types';

@ApiTags('tenants')
@Controller({ path: 'tenants', version: '1' })
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('me')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get current tenant settings and workspace data' })
  @ApiResponse({ status: 200, description: 'Tenant data retrieved' })
  async getMyTenant(@TenantId() tenantId: string) {
    return this.tenantsService.findOne(tenantId);
  }

  @Put('settings')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update tenant config parameters' })
  @ApiResponse({ status: 200, description: 'Tenant settings updated' })
  async updateSettings(@TenantId() tenantId: string, @Body() settings: any) {
    return this.tenantsService.updateSettings(tenantId, settings);
  }
}
