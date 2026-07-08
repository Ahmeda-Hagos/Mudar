# Architecture Documentation — VisaFlow AI

This guide documents the enterprise architecture of the VisaFlow AI SaaS platform.

## 1. Monorepo Workspace Structure
```
visaflow-ai/              ← Workspace Root
  apps/
    web/                  ← Next.js 15 App (Frontend)
    api/                  ← NestJS API App (Backend)
  packages/
    types/                ← Shared TypeScript interfaces
    constants/            ← Standard constants (Workflow, storage, quotas)
  docs/                   ← Code standards, Git policies, deployment instructions
```

## 2. Multi-Tenant Logical Security Isolation
Strict data isolation is enforced at two separate validation gates:

### Request Gate (`TenantAccessGuard`)
- Automatically validates the HTTP `x-tenant-id` header against the verified JWT session token payload.
- Blocks cross-tenant access.

### Database Gate (`BaseRepository`)
- All prisma queries route through a generic `BaseRepository` subclass injecting `tenantId` into parameters automatically.
- Direct database calls from controller routing modules are forbidden.

## 3. Provider-Agnostic Services
To prevent vendor lock-in, infrastructure interfaces are decoupled from Supabase APIs:
- **Authentication**: `IAuthService` abstracts login and validation pipelines. `SupabaseAuthService` maps client calls.
- **File Storage**: `IStorageService` defines folder naming conventions `/{tenantId}/{category}/{filename}` and plan quota limits.
- **SaaS Billing**: `IBillingService` abstracts subscription updates.
