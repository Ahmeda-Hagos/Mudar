# Coding & Architectural Conventions

## Naming Conventions
- **TypeScript Files**: `kebab-case` (e.g. `application.service.ts`)
- **React Components**: `PascalCase` (e.g. `ApplicationCard.tsx`)
- **Classes**: `PascalCase` (e.g. `ApplicationService`)
- **Interfaces**: `PascalCase` with `I` prefix (e.g. `IApplicationRepository`)
- **Types**: `PascalCase` with `T` prefix (e.g. `TCreateApplicationDto`)
- **Enums**: `PascalCase` (e.g. `UserRole`) with `UPPER_SNAKE_CASE` values
- **Constants**: `UPPER_SNAKE_CASE` (e.g. `MAX_FILE_SIZE_BYTES`)
- **Variables/Functions**: `camelCase` (e.g. `createApplication()`)
- **CSS classes**: `kebab-case` (e.g. `application-card`)
- **Database Tables/Columns**: `snake_case` (e.g. `created_at`)

## Core Architectural Policies
- **Clean Architecture**: Controller / Routing Layer ➔ Service / Business Logic Layer ➔ Repository / Data Access Layer.
- **Provider Abstraction**: Supabase APIs (Auth, Storage, Database) must always be wrapped behind local interface contracts to allow easy future migration to AWS Cognito, S3, or Amazon RDS.
- **Multi-Tenant Scoping**: Every database entity query must automatically hook the tenant scope context parameter. No database query is allowed to read without verifying `tenantId`.
- **Validation**: All endpoints must validate request parameters using decorators (`class-validator`) and schemas (`zod`).
