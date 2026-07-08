import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../database/base.repository';
import { PrismaService } from '../../database/prisma.service';
import { Tenant } from '@prisma/client';

@Injectable()
export class TenantsRepository extends BaseRepository<Tenant, any, any> {
  constructor(prisma: PrismaService) {
    super(prisma, 'tenant');
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({
      where: { slug },
    });
  }

  async updateSettings(id: string, settings: any): Promise<Tenant> {
    return this.prisma.tenant.update({
      where: { id },
      data: { settings },
    });
  }
}
