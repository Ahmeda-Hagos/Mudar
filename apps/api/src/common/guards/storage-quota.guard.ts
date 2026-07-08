import { Injectable, CanActivate, ExecutionContext, PayloadTooLargeException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class StorageQuotaGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.headers['x-tenant-id'];

    if (!tenantId) return true;

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) return true;

    // Check if the current storage usage exceeds the allocated quota limit (in bytes)
    if (tenant.storageUsedBytes >= tenant.storageQuotaBytes) {
      throw new PayloadTooLargeException(
        `Tenant storage quota limit exceeded. Storage limit: ${tenant.storageQuotaBytes} bytes.`
      );
    }

    return true;
  }
}
