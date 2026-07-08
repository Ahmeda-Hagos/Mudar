import { Module } from '@nestjs/common';
import { AwsS3StorageService } from './aws-s3-storage.service';
import { IStorageServiceToken } from './storage.service.interface';

@Module({
  providers: [
    {
      provide: IStorageServiceToken,
      useClass: AwsS3StorageService,
    },
  ],
  exports: [IStorageServiceToken],
})
export class StorageModule {}
