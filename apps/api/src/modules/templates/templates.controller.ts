import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../database/prisma.service';

@ApiTags('templates')
@Controller({ path: 'templates', version: '1' })
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class TemplatesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Get document checklists for specific destinations' })
  @ApiResponse({ status: 200, description: 'Checklist rules retrieved' })
  async getTemplates(@Query('countryCode') countryCode?: string) {
    if (countryCode) {
      return this.prisma.template.findMany({
        where: { countryCode: countryCode.toUpperCase() },
      });
    }
    return this.prisma.template.findMany();
  }
}
