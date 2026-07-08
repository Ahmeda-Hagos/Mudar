import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { OcrService } from './ocr.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [DocumentsController],
  providers: [OcrService],
  exports: [OcrService],
})
export class DocumentsModule {}
