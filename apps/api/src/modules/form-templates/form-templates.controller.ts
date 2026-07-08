import { Controller, Get, Post, Body, Param, Res, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FormEngineService } from './form-engine.service';
import { PrismaService } from '../../database/prisma.service';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { Response } from 'express';

@ApiTags('form-templates')
@Controller({ path: 'form-templates', version: '1' })
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class FormTemplatesController {
  constructor(
    private readonly formEngine: FormEngineService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all available form automation templates' })
  async list(@TenantId() tenantId: string) {
    return this.prisma.formTemplate.findMany({
      where: {
        OR: [
          { tenantId },
          { tenantId: null }, // Global system default templates
        ],
      },
    });
  }

  @Post(':id/fill')
  @ApiOperation({ summary: 'Generates and fills a completed embassy AcroForm PDF' })
  async fill(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body('applicationId') applicationId: string,
    @Body('filledState') filledState: any,
    @Res() res: Response,
  ) {
    const template = await this.prisma.formTemplate.findUnique({ where: { id } });
    const application = await this.prisma.application.findUnique({ where: { id: applicationId } });

    if (!template || !application) {
      throw new BadRequestException('Template or Application parameters mismatch');
    }

    const filledPdfBuffer = await this.formEngine.fillPdfForm(
      tenantId,
      template,
      application,
      filledState,
    );

    // Save filled record in history
    await this.prisma.fillHistory.create({
      data: {
        applicationId,
        formTemplateId: id,
        formName: template.formName,
        countryCode: template.countryCode,
        filledByName: 'الموظف المسؤول',
        completionPct: 100,
        missingFields: [],
      },
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=filled-${template.countryCode.toLowerCase()}.pdf`,
      'Content-Length': filledPdfBuffer.length,
    });

    res.end(filledPdfBuffer);
  }
}
