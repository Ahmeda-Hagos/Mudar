import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantsRepository } from './tenants.repository';
import { Tenant } from '@prisma/client';

@Injectable()
export class TenantsService {
  constructor(private readonly repository: TenantsRepository) {}

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.repository.findOne(id, { id });
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    return tenant;
  }

  async findBySlug(slug: string): Promise<Tenant> {
    const tenant = await this.repository.findBySlug(slug);
    if (!tenant) {
      throw new NotFoundException(`Tenant with slug ${slug} not found`);
    }
    return tenant;
  }

  async updateSettings(id: string, settings: any): Promise<Tenant> {
    await this.findOne(id);
    return this.repository.updateSettings(id, settings);
  }
}
