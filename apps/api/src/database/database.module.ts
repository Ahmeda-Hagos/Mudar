import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * DatabaseModule — global Prisma provider.
 *
 * Marked @Global so PrismaService is available everywhere
 * without importing DatabaseModule in every feature module.
 * Feature modules import only their own Repository classes.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
