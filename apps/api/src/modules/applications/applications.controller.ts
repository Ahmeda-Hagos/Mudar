import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ApplicationsService } from './applications.service';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@mudar/types';
import { AppStatus } from '@prisma/client';

@ApiTags('applications')
@Controller({ path: 'applications', version: '1' })
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'List all applications under tenant branch' })
  @ApiResponse({ status: 200, description: 'List of applications' })
  async list(@TenantId() tenantId: string) {
    return this.applicationsService.findAll(tenantId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get application details along with documents, notes, and audit logs' })
  @ApiResponse({ status: 200, description: 'Application detail payload' })
  async getDetails(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.applicationsService.findOne(tenantId, id);
  }

  @Put(':id/status')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Update workflow state stage' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateStatus(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('status') status: AppStatus,
  ) {
    return this.applicationsService.updateStatus(tenantId, id, user.id, user.name, status);
  }

  @Post(':id/notes')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Add a new internal log note' })
  @ApiResponse({ status: 201, description: 'Note added' })
  async addNote(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('content') content: string,
  ) {
    return this.applicationsService.addNote(tenantId, id, user.id, user.name, content);
  }

  @Put(':id/travel-accommodation')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Save travel accommodation fields' })
  @ApiResponse({ status: 200, description: 'Travel details updated' })
  async saveTravelAccommodation(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() travelAccommodation: any,
  ) {
    return this.applicationsService.saveTravelAccommodation(tenantId, id, user.id, user.name, travelAccommodation);
  }
}

