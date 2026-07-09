import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@visaflow/types';

/**
 * TenantAccessGuard — Enforces tenant data isolation at the middleware gate.
 * Validates request scopes to ensure a tenant user NEVER calls endpoints
 * targeting a different tenant resource.
 */
@Injectable()
export class TenantAccessGuard implements CanActivate {
  private readonly logger = new Logger(TenantAccessGuard.name);

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User authentication required');
    }

    // Platform level Super Admins bypass tenant isolation checks
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    const headerTenantId = request.headers['x-tenant-id'];
    const userTenantId = user.tenantId;

    if (!userTenantId) {
      this.logger.warn('Access denied: Authentication context is missing tenant assignment.');
      throw new ForbiddenException('Tenant authorization scope context is missing');
    }

    // Treat header purely as a consistency check if provided
    if (headerTenantId && headerTenantId !== userTenantId) {
      this.logger.warn(`Tenant access violation: User belonging to ${userTenantId} attempted to access x-tenant-id: ${headerTenantId}`);
      throw new ForbiddenException('Access denied: Unauthorized tenant target context');
    }

    // Attach the true tenant ID to the request object so controllers don't rely on the header
    request.tenantId = userTenantId;

    return true;
  }
}
