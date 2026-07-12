/**
 * @mudar/types
 *
 * Single source of truth for all shared TypeScript types across the platform.
 * Imported by both apps/web (frontend) and apps/api (backend).
 *
 * Naming conventions:
 *  - Entities: PascalCase (e.g. Application, User)
 *  - Interfaces: IPascalCase (e.g. IApplicationRepository)
 *  - Request/Response DTOs: CreateXDto, UpdateXDto, XResponseDto
 *  - Enums: PascalCase name, UPPER_SNAKE_CASE values
 */

// ─────────────────────────────────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────────────────────────────────

export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE',
  CUSTOMER: 'CUSTOMER',
} as const;
export type UserRole = typeof UserRole[keyof typeof UserRole];

export const AppStatus = {
  NEW_REQUEST: 'NEW_REQUEST',
  WAITING_DOCUMENTS: 'WAITING_DOCUMENTS',
  UNDER_REVIEW: 'UNDER_REVIEW',
  READY_FOR_BOOKING: 'READY_FOR_BOOKING',
  APPOINTMENT_BOOKED: 'APPOINTMENT_BOOKED',
  RESERVATIONS_PREPARED: 'RESERVATIONS_PREPARED',
  READY_FOR_PICKUP: 'READY_FOR_PICKUP',
  COMPLETED: 'COMPLETED',
} as const;
export type AppStatus = typeof AppStatus[keyof typeof AppStatus];

export const SubscriptionPlan = {
  STARTER: 'STARTER',
  PROFESSIONAL: 'PROFESSIONAL',
  BUSINESS: 'BUSINESS',
  ENTERPRISE: 'ENTERPRISE',
} as const;
export type SubscriptionPlan = typeof SubscriptionPlan[keyof typeof SubscriptionPlan];
export const DocumentStatus = {
  PENDING: 'PENDING',
  UPLOADED: 'UPLOADED',
  REJECTED: 'REJECTED',
} as const;
export type DocumentStatus = typeof DocumentStatus[keyof typeof DocumentStatus];

export const NotificationType = {
  DOC_REQUESTED: 'DOC_REQUESTED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  APPLICATION_ASSIGNED: 'APPLICATION_ASSIGNED',
  APPLICATION_COMPLETED: 'APPLICATION_COMPLETED',
  SYSTEM: 'SYSTEM',
} as const;
export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

export const FormTemplateStatus = {
  DRAFT: 'DRAFT',
  APPROVED: 'APPROVED',
  ARCHIVED: 'ARCHIVED',
} as const;
export type FormTemplateStatus = typeof FormTemplateStatus[keyof typeof FormTemplateStatus];

export const FieldTransform = {
  NONE: 'NONE',
  LAST_WORD: 'LAST_WORD',
  FIRST_WORDS: 'FIRST_WORDS',
  DATE_DMY: 'DATE_DMY',
  DATE_MDY: 'DATE_MDY',
  DATE_YMD: 'DATE_YMD',
  UPPERCASE: 'UPPERCASE',
  TITLE_CASE: 'TITLE_CASE',
  GENDER_MF: 'GENDER_MF',
  GENDER_FULL: 'GENDER_FULL',
  MANUAL: 'MANUAL',
} as const;
export type FieldTransform = typeof FieldTransform[keyof typeof FieldTransform];

// ─────────────────────────────────────────────────────────────────────────────
// Tenant (Agency)
// ─────────────────────────────────────────────────────────────────────────────

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  plan: SubscriptionPlan;
  isActive: boolean;
  storageUsedBytes: number;
  storageQuotaBytes: number;
  settings: TenantSettings;
  createdAt: string;
  updatedAt: string;
}

export interface TenantSettings {
  officeName: string;
  officeAddress: string;
  logoUrl?: string;
  primaryColor?: string;
  allowedCountries?: string[];
  maxEmployees?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// User
// ─────────────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  tenantId: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser extends User {
  /** JWT access token — only present after login */
  accessToken?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Application (Visa Request)
// ─────────────────────────────────────────────────────────────────────────────

export interface Application {
  id: string;
  appNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  destination: string;
  travelDate: string;
  travelers: number;
  isGroup: boolean;
  isUrgent: boolean;
  status: AppStatus;
  tenantId: string;
  assignedToId: string | null;
  assignedToName: string | null;
  extractedData: ExtractedPassportData | null;
  travelAccommodation: TravelAccommodation | null;
  validationWarnings: ValidationWarning[];
  documents: ApplicationDocument[];
  missingDocs: MissingDocument[];
  notes: ApplicationNote[];
  auditLogs: AuditLogEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface ExtractedPassportData {
  fullName: string;
  passportNo: string;
  nationality: string;
  gender: string;
  dob: string;
  issueDate: string;
  expiryDate: string;
  confidence: Record<string, number>;
  // Extended fields from form-engine DATA_KEYS (applicant.* keys)
  lastName?: string;
  firstName?: string;
  placeOfBirth?: string;
  countryOfBirth?: string;
  maritalStatus?: string;
  nationalId?: string;
  address?: string;
  email?: string;
  occupation?: string;
  passportType?: string;
  passportIssuingCountry?: string;
  iqamaNumber?: string;
  iqamaExpiry?: string;
}

export interface TravelAccommodation {
  hotelName: string;
  hotelAddress: string;
  hotelCity: string;
  hotelPhone: string;
  checkInDate: string;
  checkOutDate: string;
  purposeOfTravel: string;
}

export interface ValidationWarning {
  type: 'blur' | 'expiry' | 'missing' | 'mismatch';
  level: 'info' | 'warning' | 'error';
  message?: string;
  field?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Documents
// ─────────────────────────────────────────────────────────────────────────────

export interface ApplicationDocument {
  id: string;
  applicationId: string;
  type: string;
  filename: string;
  storagePath: string;
  publicUrl: string | null;
  mimeType: string;
  sizeBytes: number;
  status: DocumentStatus;
  ocrData: ExtractedPassportData | null;
  validationWarnings: ValidationWarning[];
  uploadedAt: string;
}

export interface MissingDocument {
  id: string;
  applicationId: string;
  type: string;
  description: string | null;
  status: DocumentStatus;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Embassy Template (Document Requirement Checklist)
// ─────────────────────────────────────────────────────────────────────────────

export interface EmbassyTemplate {
  id: string;
  country: string;
  countryCode: string;
  requiredDocs: string[];
  optionalDocs: string[];
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF Form Template (Document Automation Engine)
// ─────────────────────────────────────────────────────────────────────────────

export interface FormTemplate {
  id: string;
  country: string;
  countryCode: string;
  formName: string;
  pdfStoragePath: string;
  fieldMappings: FieldMapping[];
  status: FormTemplateStatus;
  tenantId: string | null; // null = global (super admin managed)
  createdAt: string;
  updatedAt: string;
}

export interface FieldMapping {
  pdfFieldName: string;
  pdfFieldType: string;
  dataKey: string;           // dot-notation path into Application object, or 'MANUAL'
  transform: FieldTransform;
  labelAr: string;
  labelEn: string;
  mapConfidence: 'high' | 'medium' | 'low' | 'none';
  required: boolean;
  manualValue: string;
}

export interface FillHistoryRecord {
  id: string;
  applicationId: string;
  formTemplateId: string;
  formName: string;
  countryCode: string;
  filledByName: string;
  completionPct: number;
  missingFields: string[];
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Notes & Audit
// ─────────────────────────────────────────────────────────────────────────────

export interface ApplicationNote {
  id: string;
  applicationId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  applicationId: string;
  userId: string;
  userName: string;
  action: string;
  fromStatus: AppStatus | null;
  toStatus: AppStatus | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  applicationId: string | null;
  type: NotificationType;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  isRead: boolean;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Billing / Subscription
// ─────────────────────────────────────────────────────────────────────────────

export interface Subscription {
  id: string;
  tenantId: string;
  plan: SubscriptionPlan;
  status: 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED';
  billingCycle: 'MONTHLY' | 'ANNUAL';
  trialEndsAt: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// API Contracts — Paginated Response
// ─────────────────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface ApiError {
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>;
  timestamp: string;
  path: string;
}

