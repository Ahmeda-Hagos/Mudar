-- ============================================================
-- Baseline migration: full schema + RLS
-- Applied via: prisma migrate deploy
-- ============================================================

-- Enums
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'CUSTOMER');
CREATE TYPE "AppStatus" AS ENUM (
  'NEW_REQUEST', 'WAITING_DOCUMENTS', 'UNDER_REVIEW',
  'READY_FOR_BOOKING', 'APPOINTMENT_BOOKED', 'RESERVATIONS_PREPARED',
  'READY_FOR_PICKUP', 'COMPLETED'
);
CREATE TYPE "FormTemplateStatus" AS ENUM ('DRAFT', 'APPROVED', 'ARCHIVED');
CREATE TYPE "SubscriptionPlan" AS ENUM ('STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE');

-- Tenant
CREATE TABLE "Tenant" (
  "id"                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"              TEXT        NOT NULL,
  "slug"              TEXT        NOT NULL UNIQUE,
  "logo"              TEXT,
  "settings"          JSONB       NOT NULL DEFAULT '{}',
  "storageUsedBytes"  BIGINT      NOT NULL DEFAULT 0,
  "storageQuotaBytes" BIGINT      NOT NULL DEFAULT 5368709120,
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Tenant_slug_idx" ON "Tenant"("slug");

-- User
CREATE TABLE "User" (
  "id"                         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"                       TEXT        NOT NULL,
  "email"                      TEXT        NOT NULL UNIQUE,
  "password"                   TEXT        NOT NULL,
  "phone"                      TEXT,
  "role"                       "Role"      NOT NULL DEFAULT 'CUSTOMER',
  "isActive"                   BOOLEAN     NOT NULL DEFAULT true,
  "tenantId"                   UUID        NOT NULL REFERENCES "Tenant"("id"),
  "twoFactorCode"              TEXT,
  "twoFactorExpiresAt"         TIMESTAMPTZ,
  "twoFactorAttempts"          INT         NOT NULL DEFAULT 0,
  "twoFactorLockedUntil"       TIMESTAMPTZ,
  "resetTokenHash"             TEXT,
  "resetTokenExpiresAt"        TIMESTAMPTZ,
  "emailVerified"              BOOLEAN     NOT NULL DEFAULT false,
  "emailVerificationToken"     TEXT        UNIQUE,
  "emailVerificationExpiresAt" TIMESTAMPTZ,
  "createdAt"                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"                  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");
CREATE INDEX "User_email_idx"    ON "User"("email");

-- Application
CREATE TABLE "Application" (
  "id"                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "appNumber"           TEXT        NOT NULL UNIQUE,
  "customerId"          UUID        NOT NULL REFERENCES "User"("id"),
  "destination"         TEXT        NOT NULL,
  "travelDate"          TIMESTAMPTZ NOT NULL,
  "travelers"           INT         NOT NULL,
  "isGroup"             BOOLEAN     NOT NULL DEFAULT false,
  "isUrgent"            BOOLEAN     NOT NULL DEFAULT false,
  "status"              "AppStatus" NOT NULL DEFAULT 'NEW_REQUEST',
  "extractedData"       JSONB,
  "travelAccommodation" JSONB,
  "tenantId"            UUID        NOT NULL,
  "assignedToId"        UUID,
  "createdAt"           TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Application_tenantId_idx"     ON "Application"("tenantId");
CREATE INDEX "Application_customerId_idx"   ON "Application"("customerId");
CREATE INDEX "Application_assignedToId_idx" ON "Application"("assignedToId");
CREATE INDEX "Application_status_idx"       ON "Application"("status");

-- Document
CREATE TABLE "Document" (
  "id"                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "applicationId"      UUID        NOT NULL REFERENCES "Application"("id"),
  "tenantId"           UUID        NOT NULL,   -- NOT NULL: required for RLS
  "type"               TEXT        NOT NULL,
  "filename"           TEXT        NOT NULL,
  "storagePath"        TEXT        NOT NULL,
  "mimeType"           TEXT        NOT NULL,
  "sizeBytes"          INT         NOT NULL,
  "ocrData"            JSONB,
  "validationWarnings" JSONB,
  "uploadedAt"         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Document_applicationId_idx" ON "Document"("applicationId");
CREATE INDEX "Document_tenantId_idx"      ON "Document"("tenantId");

-- ConsentLog
CREATE TABLE "ConsentLog" (
  "id"            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"        UUID        NOT NULL,
  "tenantId"      UUID        NOT NULL,
  "purpose"       TEXT        NOT NULL,
  "policyVersion" TEXT        NOT NULL,
  "consentText"   TEXT        NOT NULL,
  "ipAddress"     TEXT,
  "userAgent"     TEXT,
  "grantedAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "revokedAt"     TIMESTAMPTZ
);
CREATE INDEX "ConsentLog_userId_idx"   ON "ConsentLog"("userId");
CREATE INDEX "ConsentLog_tenantId_idx" ON "ConsentLog"("tenantId");

-- MissingDoc
CREATE TABLE "MissingDoc" (
  "id"            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "applicationId" UUID        NOT NULL REFERENCES "Application"("id"),
  "type"          TEXT        NOT NULL,
  "description"   TEXT,
  "status"        TEXT        NOT NULL DEFAULT 'PENDING',
  "tenantId"      UUID,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "MissingDoc_applicationId_idx" ON "MissingDoc"("applicationId");
CREATE INDEX "MissingDoc_tenantId_idx"      ON "MissingDoc"("tenantId");

-- Template
CREATE TABLE "Template" (
  "id"           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "country"      TEXT        NOT NULL,
  "countryCode"  TEXT        NOT NULL,
  "requiredDocs" JSONB       NOT NULL,
  "optionalDocs" JSONB       NOT NULL,
  "tenantId"     UUID        NOT NULL REFERENCES "Tenant"("id"),
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Template_tenantId_idx" ON "Template"("tenantId");

-- FormTemplate
CREATE TABLE "FormTemplate" (
  "id"            UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  "country"       TEXT                 NOT NULL,
  "countryCode"   TEXT                 NOT NULL,
  "formName"      TEXT                 NOT NULL,
  "pdfBase64"     TEXT                 NOT NULL,
  "fieldMappings" JSONB                NOT NULL,
  "status"        "FormTemplateStatus" NOT NULL DEFAULT 'DRAFT',
  "tenantId"      UUID                 REFERENCES "Tenant"("id"),
  "createdAt"     TIMESTAMPTZ          NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMPTZ          NOT NULL DEFAULT now()
);
CREATE INDEX "FormTemplate_tenantId_idx" ON "FormTemplate"("tenantId");

-- FillHistory
CREATE TABLE "FillHistory" (
  "id"             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "applicationId"  UUID        NOT NULL,
  "formTemplateId" UUID        NOT NULL REFERENCES "FormTemplate"("id"),
  "formName"       TEXT        NOT NULL,
  "countryCode"    TEXT        NOT NULL,
  "filledByName"   TEXT        NOT NULL,
  "completionPct"  INT         NOT NULL,
  "missingFields"  JSONB       NOT NULL,
  "tenantId"       UUID,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "FillHistory_applicationId_idx"  ON "FillHistory"("applicationId");
CREATE INDEX "FillHistory_formTemplateId_idx" ON "FillHistory"("formTemplateId");
CREATE INDEX "FillHistory_tenantId_idx"       ON "FillHistory"("tenantId");

-- Subscription
CREATE TABLE "Subscription" (
  "id"                   UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"             UUID               NOT NULL REFERENCES "Tenant"("id"),
  "plan"                 "SubscriptionPlan" NOT NULL DEFAULT 'STARTER',
  "status"               TEXT               NOT NULL DEFAULT 'ACTIVE',
  "billingCycle"         TEXT               NOT NULL DEFAULT 'MONTHLY',
  "trialEndsAt"          TIMESTAMPTZ,
  "currentPeriodStart"   TIMESTAMPTZ        NOT NULL DEFAULT now(),
  "currentPeriodEnd"     TIMESTAMPTZ        NOT NULL,
  "cancelAtPeriodEnd"    BOOLEAN            NOT NULL DEFAULT false,
  "stripeSubscriptionId" TEXT,
  "createdAt"            TIMESTAMPTZ        NOT NULL DEFAULT now(),
  "updatedAt"            TIMESTAMPTZ        NOT NULL DEFAULT now()
);
CREATE INDEX "Subscription_tenantId_idx" ON "Subscription"("tenantId");

-- Note
CREATE TABLE "Note" (
  "id"            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "applicationId" UUID        NOT NULL REFERENCES "Application"("id"),
  "authorId"      UUID        NOT NULL REFERENCES "User"("id"),
  "content"       TEXT        NOT NULL,
  "tenantId"      UUID,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Note_applicationId_idx" ON "Note"("applicationId");
CREATE INDEX "Note_tenantId_idx"      ON "Note"("tenantId");

-- Notification
CREATE TABLE "Notification" (
  "id"            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"        UUID        NOT NULL REFERENCES "User"("id"),
  "applicationId" UUID,
  "type"          TEXT        NOT NULL,
  "title"         TEXT        NOT NULL,
  "titleAr"       TEXT        NOT NULL,
  "body"          TEXT        NOT NULL,
  "bodyAr"        TEXT        NOT NULL,
  "isRead"        BOOLEAN     NOT NULL DEFAULT false,
  "tenantId"      UUID,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Notification_userId_idx"   ON "Notification"("userId");
CREATE INDEX "Notification_tenantId_idx" ON "Notification"("tenantId");

-- AuditLog
CREATE TABLE "AuditLog" (
  "id"            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "applicationId" UUID        NOT NULL REFERENCES "Application"("id"),
  "userId"        UUID        NOT NULL REFERENCES "User"("id"),
  "action"        TEXT        NOT NULL,
  "fromStatus"    TEXT,
  "toStatus"      TEXT,
  "metadata"      JSONB,
  "tenantId"      UUID,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "AuditLog_applicationId_idx" ON "AuditLog"("applicationId");
CREATE INDEX "AuditLog_tenantId_idx"      ON "AuditLog"("tenantId");

-- ============================================================
-- ROW LEVEL SECURITY
-- Must run AFTER tables are created.
-- app.current_tenant_id session variable is set by $withTenant
-- in prisma.service.ts before every query block.
-- ============================================================

ALTER TABLE "User"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Application"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Document"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Note"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MissingDoc"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Template"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FormTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FillHistory"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConsentLog"   ENABLE ROW LEVEL SECURITY;

-- Allow superuser / migration role to bypass RLS
ALTER TABLE "User"         FORCE ROW LEVEL SECURITY;
ALTER TABLE "Application"  FORCE ROW LEVEL SECURITY;
ALTER TABLE "Document"     FORCE ROW LEVEL SECURITY;
ALTER TABLE "Note"         FORCE ROW LEVEL SECURITY;
ALTER TABLE "Notification" FORCE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog"     FORCE ROW LEVEL SECURITY;
ALTER TABLE "MissingDoc"   FORCE ROW LEVEL SECURITY;
ALTER TABLE "Template"     FORCE ROW LEVEL SECURITY;
ALTER TABLE "FormTemplate" FORCE ROW LEVEL SECURITY;
ALTER TABLE "FillHistory"  FORCE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" FORCE ROW LEVEL SECURITY;
ALTER TABLE "ConsentLog"   FORCE ROW LEVEL SECURITY;

-- Create a helper function to read the tenant from the session context
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;
$$ LANGUAGE sql STABLE;

-- Tenant isolation policies per table
CREATE POLICY tenant_isolation ON "User"
  AS RESTRICTIVE FOR ALL
  USING ("tenantId" = current_tenant_id());

CREATE POLICY tenant_isolation ON "Application"
  AS RESTRICTIVE FOR ALL
  USING ("tenantId" = current_tenant_id());

CREATE POLICY tenant_isolation ON "Document"
  AS RESTRICTIVE FOR ALL
  USING ("tenantId" = current_tenant_id());

CREATE POLICY tenant_isolation ON "Note"
  AS RESTRICTIVE FOR ALL
  USING ("tenantId" = current_tenant_id());

CREATE POLICY tenant_isolation ON "Notification"
  AS RESTRICTIVE FOR ALL
  USING ("tenantId" = current_tenant_id());

CREATE POLICY tenant_isolation ON "AuditLog"
  AS RESTRICTIVE FOR ALL
  USING ("tenantId" = current_tenant_id());

CREATE POLICY tenant_isolation ON "MissingDoc"
  AS RESTRICTIVE FOR ALL
  USING ("tenantId" = current_tenant_id());

CREATE POLICY tenant_isolation ON "Template"
  AS RESTRICTIVE FOR ALL
  USING ("tenantId" = current_tenant_id());

CREATE POLICY tenant_isolation ON "FormTemplate"
  AS RESTRICTIVE FOR ALL
  USING ("tenantId" IS NULL OR "tenantId" = current_tenant_id());

CREATE POLICY tenant_isolation ON "FillHistory"
  AS RESTRICTIVE FOR ALL
  USING ("tenantId" IS NULL OR "tenantId" = current_tenant_id());

CREATE POLICY tenant_isolation ON "Subscription"
  AS RESTRICTIVE FOR ALL
  USING ("tenantId" = current_tenant_id());

CREATE POLICY tenant_isolation ON "ConsentLog"
  AS RESTRICTIVE FOR ALL
  USING ("tenantId" = current_tenant_id());
