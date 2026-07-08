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
   * Find a single record by dynamic criteria, scoped by tenant.
   */
  async findOne(tenantId: string, where: Record<string, any>): Promise<T | null> {
    return this.modelDelegate.findFirst({
      where: {
        ...where,
        tenantId,
      },
    });
  }

  /**
   * Find all records scoped by tenant with basic pagination.
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
    return this.modelDelegate.findMany({
      skip,
      take,
      where: {
        ...where,
        tenantId,
      },
      orderBy,
    });
  }

  /**
   * Count total items matching criteria, scoped by tenant.
   */
  async count(tenantId: string, where: Record<string, any> = {}): Promise<number> {
    return this.modelDelegate.count({
      where: {
        ...where,
        tenantId,
      },
    });
  }

  /**
   * Create a new record scoped by tenant.
   */
  async create(tenantId: string, data: CreateDto): Promise<T> {
    return this.modelDelegate.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  /**
   * Update a record scoped by tenant.
   */
  async update(tenantId: string, id: string, data: UpdateDto): Promise<T> {
    // Assert tenant ownership first
    await this.verifyOwnership(tenantId, id);

    return this.modelDelegate.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a record scoped by tenant.
   */
  async delete(tenantId: string, id: string): Promise<T> {
    // Assert tenant ownership first
    await this.verifyOwnership(tenantId, id);

    return this.modelDelegate.delete({
      where: { id },
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
