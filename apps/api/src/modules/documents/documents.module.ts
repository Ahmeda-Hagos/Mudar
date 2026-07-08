import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DocumentsController } from './documents.controller';
import { OcrService } from './ocr.service';
import { RetentionLifecycleService } from './retention-lifecycle.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    StorageModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [DocumentsController],
  providers: [
    OcrService,
    RetentionLifecycleService,
  ],
  exports: [OcrService],
})
export class DocumentsModule {}
