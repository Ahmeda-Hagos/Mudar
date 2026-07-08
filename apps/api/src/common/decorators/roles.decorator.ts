import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@visaflow/types';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
