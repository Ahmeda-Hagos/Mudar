/**
 * @mudar/constants
 *
 * All application-wide constants.
 * No magic numbers or hardcoded strings anywhere in the codebase.
 * Import from this package in both frontend and backend.
 */

import { AppStatus, SubscriptionPlan, UserRole } from '@mudar/types';

// ─────────────────────────────────────────────────────────────────────────────
// Application Status — ordered workflow
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The complete, ordered visa processing workflow.
 * The order here defines the valid forward progression.
 */
export const APP_STATUS_WORKFLOW: AppStatus[] = [
  AppStatus.NEW_REQUEST,
  AppStatus.WAITING_DOCUMENTS,
  AppStatus.UNDER_REVIEW,
  AppStatus.READY_FOR_BOOKING,
  AppStatus.APPOINTMENT_BOOKED,
  AppStatus.RESERVATIONS_PREPARED,
  AppStatus.READY_FOR_PICKUP,
  AppStatus.COMPLETED,
];

export const APP_STATUS_LABELS_AR: Record<AppStatus, string> = {
  [AppStatus.NEW_REQUEST]: 'طلب جديد',
  [AppStatus.WAITING_DOCUMENTS]: 'انتظار المستندات',
  [AppStatus.UNDER_REVIEW]: 'تحت المراجعة',
  [AppStatus.READY_FOR_BOOKING]: 'جاهز للحجز',
  [AppStatus.APPOINTMENT_BOOKED]: 'تم حجز الموعد',
  [AppStatus.RESERVATIONS_PREPARED]: 'الحجوزات جاهزة',
  [AppStatus.READY_FOR_PICKUP]: 'جاهز للاستلام',
  [AppStatus.COMPLETED]: 'مكتمل',
};

export const APP_STATUS_LABELS_EN: Record<AppStatus, string> = {
  [AppStatus.NEW_REQUEST]: 'New Request',
  [AppStatus.WAITING_DOCUMENTS]: 'Waiting Documents',
  [AppStatus.UNDER_REVIEW]: 'Under Review',
  [AppStatus.READY_FOR_BOOKING]: 'Ready for Booking',
  [AppStatus.APPOINTMENT_BOOKED]: 'Appointment Booked',
  [AppStatus.RESERVATIONS_PREPARED]: 'Reservations Prepared',
  [AppStatus.READY_FOR_PICKUP]: 'Ready for Pickup',
  [AppStatus.COMPLETED]: 'Completed',
};

// ─────────────────────────────────────────────────────────────────────────────
// User Roles
// ─────────────────────────────────────────────────────────────────────────────

export const ROLE_LABELS_AR: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'إدارة المنصة',
  [UserRole.ADMIN]: 'مدير النظام',
  [UserRole.EMPLOYEE]: 'موظف',
  [UserRole.CUSTOMER]: 'عميل',
};

export const ROLE_LABELS_EN: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Platform Admin',
  [UserRole.ADMIN]: 'Agency Admin',
  [UserRole.EMPLOYEE]: 'Employee',
  [UserRole.CUSTOMER]: 'Customer',
};

/** Roles that can access the internal dashboard (not customer portal) */
export const INTERNAL_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.EMPLOYEE,
];

// ─────────────────────────────────────────────────────────────────────────────
// Subscription Plans
// ─────────────────────────────────────────────────────────────────────────────

export const PLAN_STORAGE_QUOTA_BYTES: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.STARTER]:      5  * 1024 * 1024 * 1024,  //   5 GB
  [SubscriptionPlan.PROFESSIONAL]: 25 * 1024 * 1024 * 1024,  //  25 GB
  [SubscriptionPlan.BUSINESS]:    100 * 1024 * 1024 * 1024,  // 100 GB
  [SubscriptionPlan.ENTERPRISE]:   -1,                        // Custom (unlimited sentinel)
};

export const PLAN_MAX_EMPLOYEES: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.STARTER]:       3,
  [SubscriptionPlan.PROFESSIONAL]: 15,
  [SubscriptionPlan.BUSINESS]:     50,
  [SubscriptionPlan.ENTERPRISE]:   -1,  // Unlimited
};

export const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  [SubscriptionPlan.STARTER]:      'Starter',
  [SubscriptionPlan.PROFESSIONAL]: 'Professional',
  [SubscriptionPlan.BUSINESS]:     'Business',
  [SubscriptionPlan.ENTERPRISE]:   'Enterprise',
};

// ─────────────────────────────────────────────────────────────────────────────
// File Upload
// ─────────────────────────────────────────────────────────────────────────────

/** Maximum single file upload size: 20 MB */
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

export const ALLOWED_PDF_MIME_TYPES = ['application/pdf'] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Storage Paths
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the canonical storage path for a tenant file.
 * All storage operations MUST use this function to build paths.
 *
 * Format: {tenantId}/{category}/{filename}
 */
export const buildStoragePath = (
  tenantId: string,
  category: StorageCategory,
  filename: string,
): string => `${tenantId}/${category}/${filename}`;

export type StorageCategory =
  | 'passports'
  | 'documents'
  | 'visas'
  | 'photos'
  | 'pdfs'
  | 'generated-pdfs'
  | 'attachments'
  | 'archived';

// ─────────────────────────────────────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ─────────────────────────────────────────────────────────────────────────────
// Application Number Generation
// ─────────────────────────────────────────────────────────────────────────────

export const APP_NUMBER_PREFIX = 'VF';
export const GROUP_APP_NUMBER_PREFIX = 'VF-GRP';

/**
 * Generates an application number.
 * Production: use the backend — this is the format reference only.
 * Format: VF-{YEAR}-{5-digit random}
 */
export const buildAppNumber = (isGroup: boolean, year: number): string => {
  const prefix = isGroup ? GROUP_APP_NUMBER_PREFIX : `${APP_NUMBER_PREFIX}-${year}`;
  const suffix = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${suffix}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Audit Log Actions (standardised strings — no free-text in production)
// ─────────────────────────────────────────────────────────────────────────────

export const AUDIT_ACTIONS = {
  APPLICATION_CREATED: 'APPLICATION_CREATED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  DOCUMENT_UPLOADED: 'DOCUMENT_UPLOADED',
  DOCUMENT_REQUESTED: 'DOCUMENT_REQUESTED',
  NOTE_ADDED: 'NOTE_ADDED',
  APPLICATION_ASSIGNED: 'APPLICATION_ASSIGNED',
  FORM_FILLED: 'FORM_FILLED',
  FORM_DOWNLOADED: 'FORM_DOWNLOADED',
  TRAVEL_INFO_UPDATED: 'TRAVEL_INFO_UPDATED',
} as const;

export type AuditAction = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS];

// ─────────────────────────────────────────────────────────────────────────────
// API Routes (shared between frontend and backend)
// ─────────────────────────────────────────────────────────────────────────────

export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  APPLICATIONS: {
    LIST: '/applications',
    CREATE: '/applications',
    DETAIL: (id: string) => `/applications/${id}`,
    UPDATE_STATUS: (id: string) => `/applications/${id}/status`,
    ASSIGN: (id: string) => `/applications/${id}/assign`,
    NOTES: (id: string) => `/applications/${id}/notes`,
    AUDIT: (id: string) => `/applications/${id}/audit`,
    DOCUMENTS: (id: string) => `/applications/${id}/documents`,
    MISSING_DOCS: (id: string) => `/applications/${id}/missing-docs`,
  },
  TEMPLATES: {
    LIST: '/templates',
    DETAIL: (id: string) => `/templates/${id}`,
  },
  FORM_TEMPLATES: {
    LIST: '/form-templates',
    CREATE: '/form-templates',
    DETAIL: (id: string) => `/form-templates/${id}`,
    APPROVE: (id: string) => `/form-templates/${id}/approve`,
  },
  USERS: {
    LIST: '/users',
    CREATE: '/users',
    DETAIL: (id: string) => `/users/${id}`,
  },
  TENANTS: {
    LIST: '/tenants',
    DETAIL: (id: string) => `/tenants/${id}`,
    SETTINGS: (id: string) => `/tenants/${id}/settings`,
    STORAGE: (id: string) => `/tenants/${id}/storage`,
  },
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: '/notifications/mark-read',
  },
} as const;

