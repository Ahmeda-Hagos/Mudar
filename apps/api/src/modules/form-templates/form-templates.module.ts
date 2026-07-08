import { Module } from '@nestjs/common';
import { FormTemplatesController } from './form-templates.controller';
import { FormEngineService } from './form-engine.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [FormTemplatesController],
  providers: [FormEngineService],
  exports: [FormEngineService],
})
export class FormTemplatesModule {}
