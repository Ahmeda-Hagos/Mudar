import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@mudar/types';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

