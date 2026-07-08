import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ApplicationsRepository } from './applications.repository';
import { ApplicationsController } from './applications.controller';

@Module({
  controllers: [ApplicationsController],
  providers: [ApplicationsService, ApplicationsRepository],
  exports: [ApplicationsService, ApplicationsRepository],
})
export class ApplicationsModule {}
