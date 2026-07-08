import { Module } from '@nestjs/common';
import { SupabaseStorageService } from './supabase-storage.service';
import { IStorageServiceToken } from './storage.service.interface';

@Module({
  providers: [
    {
      provide: IStorageServiceToken,
      useClass: SupabaseStorageService,
    },
  ],
  exports: [IStorageServiceToken],
})
export class StorageModule {}
