import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Generic BaseRepository class implementing the Repository Pattern.
 * Automatically enforces tenant isolation for all standard CRUD operations.
 */
@Injectable()
export abstract class BaseRepository<T, CreateDto, UpdateDto> {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly modelName: string,
  ) {}

  /**
   * Safe access to the delegate client model.
   */
  protected get modelDelegate(): any {
    const delegate = (this.prisma as any)[this.modelName];
    if (!delegate) {
      throw new InternalServerErrorException(
        `Prisma model delegate for name "${this.modelName}" could not be found.`,
      );
    }
    return delegate;
  }

  /**
   * Find a single record by dynamic criteria, scoped by tenant using RLS.
   */
  async findOne(tenantId: string, where: Record<string, any>): Promise<T | null> {
    return this.prisma.$withTenant(tenantId, (tx) =>
      tx[this.modelName].findFirst({
        where: {
          ...where,
          tenantId,
        },
      })
    );
  }

  /**
   * Find all records scoped by tenant with basic pagination using RLS.
   */
  async findAll(
    tenantId: string,
    params: {
      skip?: number;
      take?: number;
      where?: Record<string, any>;
      orderBy?: Record<string, 'asc' | 'desc'>;
    } = {},
  ): Promise<T[]> {
    const { skip, take, where, orderBy } = params;
    return this.prisma.$withTenant(tenantId, (tx) =>
      tx[this.modelName].findMany({
        skip,
        take,
        where: {
          ...where,
          tenantId,
        },
        orderBy,
      })
    );
  }

  /**
   * Count total records for the given criteria using RLS.
   */
  async count(tenantId: string, where: Record<string, any> = {}): Promise<number> {
    return this.prisma.$withTenant(tenantId, (tx) =>
      tx[this.modelName].count({
        where: {
          ...where,
          tenantId,
        },
      })
    );
  }

  /**
   * Create a new record bound to a specific tenant using RLS.
   */
  async create(tenantId: string, data: CreateDto): Promise<T> {
    return this.prisma.$withTenant(tenantId, (tx) =>
      tx[this.modelName].create({
        data: {
          ...data,
          tenantId,
        },
      })
    );
  }

  /**
   * Update an existing record.
   * Safety check ensures the record belongs to the tenant.
   */
  async update(tenantId: string, id: string, data: UpdateDto): Promise<T> {
    return this.prisma.$withTenant(tenantId, async (tx) => {
      // Find first ensures we don't update another tenant's item
      const existing = await tx[this.modelName].findFirst({
        where: { id, tenantId },
      });
      
      if (!existing) {
        throw new Error(`Record ${id} not found in tenant ${tenantId}`);
      }

      return tx[this.modelName].update({
        where: { id },
        data,
      });
    });
  }

  /**
   * Delete a record.
   * Safety check ensures it belongs to the tenant.
   */
  async delete(tenantId: string, id: string): Promise<T> {
    return this.prisma.$withTenant(tenantId, async (tx) => {
      const existing = await tx[this.modelName].findFirst({
        where: { id, tenantId },
      });
      
      if (!existing) {
        throw new Error(`Record ${id} not found in tenant ${tenantId}`);
      }

      return tx[this.modelName].delete({
        where: { id },
      });
    });
  }

  /**
   * Enforces that the item belongs to the tenant.
   * Throws an exception or error if isolation check fails.
   */
  protected async verifyOwnership(tenantId: string, id: string): Promise<void> {
    const record = await this.modelDelegate.findFirst({
      where: {
        id,
        tenantId,
      },
    });
    if (!record) {
      throw new InternalServerErrorException(
        `Unauthorized access attempt. Resource "${id}" does not exist or does not belong to tenant "${tenantId}".`,
      );
    }
  }
}
