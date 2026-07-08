import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Parameter decorator to retrieve validated User session payload from request object.
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
