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
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Platform level Super Admins bypass tenant isolation checks
    if (user && user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    const headerTenantId = request.headers['x-tenant-id'];
    const userTenantId = user?.tenantId;

    if (!userTenantId) {
      this.logger.warn('Access denied: Authentication context is missing tenant assignment.');
      throw new ForbiddenException('Tenant authorization scope context is missing');
    }

    // Assert request context matches user tenant scope
    if (headerTenantId && headerTenantId !== userTenantId) {
      this.logger.warn(`Tenant access violation: User belonging to ${userTenantId} attempted to access x-tenant-id: ${headerTenantId}`);
      throw new ForbiddenException('Access denied: Unauthorized tenant target context');
    }

    return true;
  }
}
