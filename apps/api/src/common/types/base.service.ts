import { Injectable, Logger } from '@nestjs/common';
import { BaseRepository } from '../../database/base.repository';

/**
 * Abstract BaseService containing boilerplate CRUD logic.
 * Ensures the Repository pattern is decoupled cleanly from Controllers.
 */
@Injectable()
export abstract class BaseService<T, CreateDto, UpdateDto> {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    protected readonly repository: BaseRepository<T, CreateDto, UpdateDto>,
  ) {}

  async findOne(tenantId: string, id: string): Promise<T | null> {
    this.logger.log(`Fetching record ${id} for tenant ${tenantId}`);
    return this.repository.findOne(tenantId, { id });
  }

  async findAll(
    tenantId: string,
    query: { page?: number; limit?: number; search?: Record<string, any> } = {},
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    this.logger.log(`Fetching page ${page} (limit: ${limit}) for tenant ${tenantId}`);

    const [data, total] = await Promise.all([
      this.repository.findAll(tenantId, {
        skip,
        take: limit,
        where: query.search,
        orderBy: { createdAt: 'desc' } as any,
      }),
      this.repository.count(tenantId, query.search),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(tenantId: string, dto: CreateDto): Promise<T> {
    this.logger.log(`Creating record for tenant ${tenantId}`);
    return this.repository.create(tenantId, dto);
  }

  async update(tenantId: string, id: string, dto: UpdateDto): Promise<T> {
    this.logger.log(`Updating record ${id} for tenant ${tenantId}`);
    return this.repository.update(tenantId, id, dto);
  }

  async delete(tenantId: string, id: string): Promise<T> {
    this.logger.log(`Deleting record ${id} for tenant ${tenantId}`);
    return this.repository.delete(tenantId, id);
  }
}
