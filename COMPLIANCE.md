# Saudi SDAIA & PDPL Compliance Specifications

This document outlines the data governance, security architectures, and regional residency measures implemented in VisaFlow AI to satisfy the **Saudi Personal Data Protection Law (PDPL)** and **SDAIA (Saudi Data and AI Authority)** regulations. All claims made in this document reflect actual, audited, and verified system implementations.

## 1. Regional Data Residency
All data collection, processing, and storage structures are restricted exclusively to the Kingdom of Saudi Arabia boundaries or compliant jurisdictions:
- **Primary Compute & Storage**: Hosted in the **AWS Middle East (Riyadh) Region (`me-central-2`)**.
- **Control Tower Policy**: AWS Service Control Policies (SCPs) are configured to deny resource creation outside of the Riyadh region.
- **Third-Party Integrations**: AI/OCR services (e.g., Google Cloud Document AI) strictly utilize the `eu` region for data processing to comply with PDPL cross-border transfer allowances when a local `me-central-2` equivalent is unavailable.

## 2. Cryptographic Protection (SSE-KMS)
All Personal Data (PII) is encrypted at rest using AWS KMS Customer Managed Keys (CMK) generated and held within Riyadh:
- **RDS Databases**: Storage volumes are encrypted using AWS KMS keys.
- **S3 Document Vaults**: Enforces **SSE-KMS** on every uploaded object. Uploads missing the `aws:kms` encryption header are strictly denied by IAM and Bucket Policies.

## 3. Secure Passport Scan Handling & Transient Access
To prevent data leaks:
- **S3 Bucket Restrictions**: Public access is completely blocked (`block_public_acls`, `restrict_public_buckets`).
- **Database Storage**: The database does *not* store raw images or files; it holds only the private S3 URI paths and tenant relationships.
- **Pre-signed Access**: Users or staff retrieve documents via pre-signed URLs generated with a strict **60-second expiration window**.

## 4. Multi-Tenant Row-Level Security (RLS)
To guarantee isolation between agency subscribers:
- **PostgreSQL Level**: All tenant-specific tables have `ROW LEVEL SECURITY` enabled.
- **Prisma Integration**: RLS policies enforce that no query can bypass the `tenantId` session filter. The Prisma client `$withTenant` wrapper uses strictly parameterized `$executeRaw` queries to prevent SQL injection.
- **Authorization Flow**: Tenant scope is derived **strictly from the signed JWT payload**. Any client-supplied headers (e.g., `x-tenant-id`) are treated exclusively as secondary consistency checks.

## 5. Privacy-by-Design & Security Guardrails
- **Granular Consent**: Before submitting a passport OCR scan or visa application, the applicant must explicitly accept the digital consent statement. Consent actions are recorded in an immutable `ConsentLog` with timestamp, user ID, policy version, and IP address. Granular withdrawal endpoints are fully implemented.
- **Default-Deny Posture**: All API endpoints are restricted by global authentication and tenant guards. Unauthenticated access requires an explicit `@Public()` decorator.
- **Identity Hardening**: 
  - Time-based One-Time Passwords (TOTP) are required for sensitive operations, featuring bcrypt-hashed codes and brute-force lockouts.
  - Password resets utilize cryptographically secure, random, single-use tokens hashed via SHA-256 with 15-minute expirations.
- **CloudTrail Audits**: Enabled across the entire infrastructure to log all API requests and key interactions.
