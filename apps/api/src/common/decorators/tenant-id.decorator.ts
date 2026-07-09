import { createParamDecorator, ExecutionContext, ForbiddenException } from '@nestjs/common';

/**
 * Parameter decorator that extracts the verified tenant ID from the request.
 *
 * TenantAccessGuard sets request.tenantId from the JWT claim before any
 * controller runs. This decorator reads that trusted value — never the
 * raw x-tenant-id header — so tenant scope cannot be spoofed by a client.
 */
export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();

    // request.tenantId is set by TenantAccessGuard from the verified JWT payload
    const tenantId: string | undefined = request.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('Tenant context missing from request. Ensure TenantAccessGuard is active.');
    }

    return tenantId;
  },
);
