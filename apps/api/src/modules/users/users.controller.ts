import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@mudar/types';

@ApiTags('users')
@Controller({ path: 'users', version: '1' })
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all employee users in the tenant branch' })
  @ApiResponse({ status: 200, description: 'List of users' })
  async getStaff(@TenantId() tenantId: string) {
    return this.usersService.findAll(tenantId);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Onboard a new employee staff member' })
  @ApiResponse({ status: 201, description: 'Employee created' })
  async createEmployee(@TenantId() tenantId: string, @Body() dto: any) {
    return this.usersService.create(tenantId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Revoke employee staff workspace access' })
  @ApiResponse({ status: 200, description: 'Employee deleted' })
  async removeEmployee(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.usersService.delete(tenantId, id);
  }
}

