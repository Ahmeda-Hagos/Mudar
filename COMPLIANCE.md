# Saudi SDAIA & PDPL Compliance Specifications

This document outlines the data governance, security architectures, and regional residency measures implemented in VisaFlow AI to satisfy the **Saudi Personal Data Protection Law (PDPL)** and **SDAIA (Saudi Data and AI Authority)** regulations.

## 1. Regional Data Residency
All data collection, processing, and storage structures are restricted exclusively to the Kingdom of Saudi Arabia boundaries:
- **Primary Compute & Storage**: Hosted in the **AWS Middle East (Riyadh) Region (`me-central-1`)**.
- **Control Tower Policy**: AWS Service Control Policies (SCPs) are configured to deny resource creation outside of the Riyadh region.

## 2. Cryptographic Protection (SSE-KMS)
All Personal Data (PII) is encrypted at rest using AWS KMS Customer Managed Keys (CMK) generated and held within Riyadh:
- **RDS Databases**: Storage volumes are encrypted using AWS KMS keys.
- **S3 Document Vaults**: Enforces **SSE-KMS** on every uploaded object.

## 3. Secure Passport Scan Handling & Transient Access
To prevent data leaks:
- **S3 Bucket Restrictions**: Public access is blocked.
- **Database Storage**: The database does *not* store raw images or files; it holds only the private S3 URI paths.
- **Pre-signed Access**: Users or staff retrieve documents via pre-signed URLs generated with a strict **60-second expiration window**.

## 4. Multi-Tenant Row-Level Security (RLS)
To guarantee isolation between agency subscribers:
- **PostgreSQL Level**: All tenant-specific tables have `ROW LEVEL SECURITY` enabled.
- **Prisma Integration**: RLS policies enforce that no query can bypass the `tenantId` session filter.
- **Query Guard**:
  ```sql
  ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
  CREATE POLICY tenant_isolation_policy ON "User" 
  USING ("tenantId" = current_setting('app.current_tenant_id', true));
  ```

## 5. Privacy-by-Design Features
- **Granular Consent**: Before submitting a passport OCR scan or visa application, the applicant must explicitly accept the digital consent statement, logged with timestamp and user ID.
- **Data Retention & Lifecycle**: Passport scans and applicant files are auto-purged or anonymized 30 days after the visa processing completes.
- **CloudTrail Audits**: Enabled across the entire infrastructure to log all API requests and key interactions.
