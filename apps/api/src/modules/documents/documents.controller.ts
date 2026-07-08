import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, Body, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { IStorageService, IStorageServiceToken } from '../storage/storage.service.interface';
import { Inject } from '@nestjs/common';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { OcrService } from './ocr.service';
import { PrismaService } from '../../database/prisma.service';

import { StorageQuotaGuard } from '../../common/guards/storage-quota.guard';

@ApiTags('documents')
@Controller({ path: 'documents', version: '1' })
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class DocumentsController {
  constructor(
    @Inject(IStorageServiceToken)
    private readonly storageService: IStorageService,
    private readonly ocrService: OcrService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('upload')
  @UseGuards(StorageQuotaGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload applicant document and run automatic AI OCR extraction' })
  @ApiResponse({ status: 201, description: 'File uploaded and parsed successfully' })
  async upload(
    @TenantId() tenantId: string,
    @UploadedFile() file: any,
    @Body('applicationId') applicationId: string,
    @Body('type') type: string,
  ) {
    if (!file) {
      throw new BadRequestException('File buffer is required');
    }

    // 1. Upload to Supabase Storage Bucket using path
    const { storagePath, publicUrl } = await this.storageService.uploadFile(
      tenantId,
      'PASSPORTS' as any,
      file.originalname,
      file.buffer,
      file.mimetype,
    );

    // 2. Perform OCR text extraction if it's a Passport
    let ocrData: any = null;
    if (type.toUpperCase() === 'PASSPORT') {
      ocrData = await this.ocrService.processPassport(file.buffer);
    }

    // 3. Create document record
    const document = await this.prisma.document.create({
      data: {
        applicationId,
        type,
        filename: file.originalname,
        storagePath,
        mimeType: file.mimetype,
        sizeBytes: file.buffer.length,
        ocrData: ocrData ? JSON.parse(JSON.stringify(ocrData)) : undefined,
      },
    });

    // 4. Pre-fill application extracted passport data if OCR was successful
    if (ocrData) {
      await this.prisma.application.update({
        where: { id: applicationId },
        data: {
          extractedData: JSON.parse(JSON.stringify(ocrData)),
        },
      });
    }

    return {
      document,
      ocrData,
      publicUrl,
    };
  }
}
