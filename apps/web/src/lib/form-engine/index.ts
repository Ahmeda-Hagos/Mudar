/**
 * VisaFlow AI — Document Automation Engine (TypeScript)
 *
 * Migrated from: frontend/js/form-engine.js
 *
 * Handles all PDF AcroForm auto-fill logic using pdf-lib.
 * The engine resolves application data against a FieldMapping configuration
 * and produces a filled PDF for download.
 *
 * Architecture:
 *   FormEngine (this file) — pure business logic, no I/O side effects
 *   └── fillPdfAcroForm()  — only function that interacts with pdf-lib
 *
 * All functions are pure and testable except fillPdfAcroForm.
 */

import type {
  Application,
  FieldMapping,
  FormTemplate,
  FillHistoryRecord,
} from '@visaflow/types';
import { FieldTransform } from '@visaflow/types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type FieldSource = 'OCR' | 'APP' | 'MANUAL' | 'MISSING';
export type FieldFillStatus = 'mapped' | 'manual' | 'missing';

export interface ResolvedField {
  value: string;
  rawValue: string;
  source: FieldSource;
  confidence: number | null;
}

export interface FilledField extends ResolvedField {
  status: FieldFillStatus;
  mapping: FieldMapping;
  confirmed: boolean;
}

export type FilledFormState = Record<string, FilledField>;

export interface FormStats {
  total: number;
  mapped: number;
  missing: number;
  confirmed: number;
  completionPct: number;
  missingFields: string[];
}

export interface DataKeyDefinition {
  category: string;
  key: string;
  labelEn: string;
  labelAr: string;
}

export interface TransformDefinition {
  key: FieldTransform;
  labelEn: string;
  labelAr: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Data Key Registry — all mappable application fields
// Sourced from prototype form-engine.js DATA_KEYS array
// ─────────────────────────────────────────────────────────────────────────────

export const DATA_KEYS: DataKeyDefinition[] = [
  { category: 'Applicant', key: 'applicant.last_name',           labelEn: 'Surname',                      labelAr: 'اللقب' },
  { category: 'Applicant', key: 'applicant.birth_last_name',     labelEn: 'Surname at birth',             labelAr: 'اللقب عند الميلاد' },
  { category: 'Applicant', key: 'applicant.first_name',          labelEn: 'First name(s)',                labelAr: 'الاسم الأول' },
  { category: 'Applicant', key: 'applicant.date_of_birth',       labelEn: 'Date of birth',               labelAr: 'تاريخ الميلاد' },
  { category: 'Applicant', key: 'applicant.place_of_birth',      labelEn: 'Place of birth',              labelAr: 'مكان الميلاد' },
  { category: 'Applicant', key: 'applicant.country_of_birth',    labelEn: 'Country of birth',            labelAr: 'دولة الميلاد' },
  { category: 'Applicant', key: 'applicant.nationality',         labelEn: 'Current nationality',         labelAr: 'الجنسية الحالية' },
  { category: 'Applicant', key: 'applicant.birth_nationality',   labelEn: 'Nationality at birth',        labelAr: 'الجنسية عند الميلاد' },
  { category: 'Applicant', key: 'applicant.other_nationalities', labelEn: 'Other nationalities',         labelAr: 'جنسيات أخرى' },
  { category: 'Applicant', key: 'applicant.gender',              labelEn: 'Sex',                         labelAr: 'الجنس' },
  { category: 'Applicant', key: 'applicant.marital_status',      labelEn: 'Marital status',              labelAr: 'الحالة الاجتماعية' },
  { category: 'Applicant', key: 'applicant.guardian',            labelEn: 'Legal guardian',              labelAr: 'الوصي القانوني' },
  { category: 'Applicant', key: 'applicant.national_id',         labelEn: 'National identity number',    labelAr: 'رقم الهوية الوطنية' },
  { category: 'Applicant', key: 'applicant.address',             labelEn: 'Applicant address',           labelAr: 'عنوان المتقدم' },
  { category: 'Applicant', key: 'applicant.email',               labelEn: 'Applicant email',             labelAr: 'البريد الإلكتروني' },
  { category: 'Applicant', key: 'applicant.phone',               labelEn: 'Applicant phone',             labelAr: 'رقم الهاتف' },
  { category: 'Applicant', key: 'applicant.occupation',          labelEn: 'Current occupation',          labelAr: 'المهنة الحالية' },

  { category: 'Passport', key: 'applicant.passport.type',            labelEn: 'Type of travel document',   labelAr: 'نوع وثيقة السفر' },
  { category: 'Passport', key: 'applicant.passport.number',          labelEn: 'Passport number',           labelAr: 'رقم الجواز' },
  { category: 'Passport', key: 'applicant.passport.issue_date',      labelEn: 'Issue date',               labelAr: 'تاريخ الإصدار' },
  { category: 'Passport', key: 'applicant.passport.expiry_date',     labelEn: 'Expiry date',              labelAr: 'تاريخ الانتهاء' },
  { category: 'Passport', key: 'applicant.passport.issuing_country', labelEn: 'Issuing country',          labelAr: 'دولة الإصدار' },

  { category: 'EU Family Member', key: 'applicant.eu_family_member.last_name',      labelEn: 'EU family member surname',    labelAr: 'لقب قريب الاتحاد الأوروبي' },
  { category: 'EU Family Member', key: 'applicant.eu_family_member.first_name',     labelEn: 'EU family member first name', labelAr: 'اسم قريب الاتحاد الأوروبي' },
  { category: 'EU Family Member', key: 'applicant.eu_family_member.date_of_birth',  labelEn: 'EU family member DOB',        labelAr: 'تاريخ ميلاد القريب' },
  { category: 'EU Family Member', key: 'applicant.eu_family_member.nationality',    labelEn: 'EU family member nationality',labelAr: 'جنسية القريب' },
  { category: 'EU Family Member', key: 'applicant.eu_family_member.document_number',labelEn: 'EU family member ID',         labelAr: 'رقم وثيقة القريب' },
  { category: 'EU Family Member', key: 'applicant.eu_family_member.relationship',   labelEn: 'Family relationship',         labelAr: 'صلة القرابة' },

  { category: 'Residence Permit', key: 'applicant.iqama.number',      labelEn: 'Residence permit number',      labelAr: 'رقم الإقامة' },
  { category: 'Residence Permit', key: 'applicant.iqama.expiry_date', labelEn: 'Residence permit expiry date', labelAr: 'تاريخ انتهاء الإقامة' },

  { category: 'Employer', key: 'applicant.employer.name',    labelEn: 'Employer/School name', labelAr: 'اسم جهة العمل' },
  { category: 'Employer', key: 'applicant.employer.address', labelEn: 'Employer address',     labelAr: 'عنوان جهة العمل' },
  { category: 'Employer', key: 'applicant.employer.phone',   labelEn: 'Employer phone',       labelAr: 'هاتف جهة العمل' },

  { category: 'Visa Details', key: 'visa.purpose',                    labelEn: 'Main purpose of journey',       labelAr: 'الغرض الرئيسي من الرحلة' },
  { category: 'Visa Details', key: 'visa.additional_information',     labelEn: 'Additional info on purpose',    labelAr: 'معلومات إضافية' },
  { category: 'Visa Details', key: 'visa.destination_country',        labelEn: 'Main destination country',      labelAr: 'دولة الوجهة الرئيسية' },
  { category: 'Visa Details', key: 'visa.first_entry_country',        labelEn: 'First entry country',           labelAr: 'دولة الدخول الأولى' },
  { category: 'Visa Details', key: 'visa.entries',                    labelEn: 'Number of entries requested',   labelAr: 'عدد الدخول المطلوب' },
  { category: 'Visa Details', key: 'visa.arrival_date',               labelEn: 'Intended arrival date',         labelAr: 'تاريخ الوصول المتوقع' },
  { category: 'Visa Details', key: 'visa.departure_date',             labelEn: 'Intended departure date',       labelAr: 'تاريخ المغادرة المتوقع' },
  { category: 'Visa Details', key: 'visa.previous_fingerprints',      labelEn: 'Previous fingerprints',         labelAr: 'تم أخذ البصمات سابقاً' },
  { category: 'Visa Details', key: 'visa.previous_visa_number',       labelEn: 'Previous visa sticker number',  labelAr: 'رقم تأشيرة سابقة' },
  { category: 'Visa Details', key: 'visa.final_destination_permit',   labelEn: 'Entry permit final destination',labelAr: 'تصريح دخول الوجهة' },
  { category: 'Visa Details', key: 'visa.final_destination_issued_by',labelEn: 'Entry permit issuing authority',labelAr: 'جهة إصدار التصريح' },
  { category: 'Visa Details', key: 'visa.final_destination_valid_from',labelEn: 'Entry permit valid from',      labelAr: 'صالح من' },
  { category: 'Visa Details', key: 'visa.final_destination_valid_until',labelEn: 'Entry permit valid until',    labelAr: 'صالح إلى' },

  { category: 'Accommodation', key: 'accommodation.contact_name', labelEn: 'Hotel / inviting person name',    labelAr: 'اسم الفندق أو الشخص الداعي' },
  { category: 'Accommodation', key: 'accommodation.address',      labelEn: 'Hotel / inviting person address', labelAr: 'عنوان الفندق' },
  { category: 'Accommodation', key: 'accommodation.email',        labelEn: 'Hotel email',                     labelAr: 'البريد الإلكتروني للفندق' },
  { category: 'Accommodation', key: 'accommodation.phone',        labelEn: 'Hotel phone',                     labelAr: 'رقم هاتف الفندق' },

  { category: 'Sponsor', key: 'sponsor.company_name',  labelEn: 'Inviting company name',    labelAr: 'اسم الشركة الداعية' },
  { category: 'Sponsor', key: 'sponsor.contact_name',  labelEn: 'Company contact person',  labelAr: 'مسؤول التواصل' },
  { category: 'Sponsor', key: 'sponsor.address',       labelEn: 'Company address',          labelAr: 'عنوان الشركة' },
  { category: 'Sponsor', key: 'sponsor.email',         labelEn: 'Company email',            labelAr: 'البريد الإلكتروني للشركة' },
  { category: 'Sponsor', key: 'sponsor.phone',         labelEn: 'Company phone',            labelAr: 'هاتف الشركة' },

  { category: 'Finance', key: 'finance.payer',            labelEn: 'Travel expenses paid by', labelAr: 'متكفل بمصاريف الرحلة' },
  { category: 'Finance', key: 'finance.means_of_support', labelEn: 'Means of subsistence',   labelAr: 'وسائل الدعم المالي' },

  { category: 'Application', key: 'application.prepared_by_name',    labelEn: 'Person completing application', labelAr: 'اسم معبئ الطلب' },
  { category: 'Application', key: 'application.prepared_by_address', labelEn: 'Preparer address',              labelAr: 'عنوان المعبئ' },
  { category: 'Application', key: 'application.prepared_by_email',   labelEn: 'Preparer email',               labelAr: 'البريد الإلكتروني للمعبئ' },
  { category: 'Application', key: 'application.prepared_by_phone',   labelEn: 'Preparer phone',               labelAr: 'هاتف المعبئ' },
  { category: 'Application', key: 'application.place_and_date',      labelEn: 'Place and date',               labelAr: 'مكان وتاريخ الطلب' },

  { category: 'Travel & Accommodation', key: 'travelAccommodation.hotelName',      labelEn: 'Hotel Name',         labelAr: 'اسم الفندق' },
  { category: 'Travel & Accommodation', key: 'travelAccommodation.hotelAddress',   labelEn: 'Hotel Address',      labelAr: 'عنوان الفندق' },
  { category: 'Travel & Accommodation', key: 'travelAccommodation.hotelCity',      labelEn: 'Hotel City',         labelAr: 'مدينة الفندق' },
  { category: 'Travel & Accommodation', key: 'travelAccommodation.hotelPhone',     labelEn: 'Hotel Phone',        labelAr: 'هاتف الفندق' },
  { category: 'Travel & Accommodation', key: 'travelAccommodation.checkInDate',    labelEn: 'Check-in Date',      labelAr: 'تاريخ الدخول' },
  { category: 'Travel & Accommodation', key: 'travelAccommodation.checkOutDate',   labelEn: 'Check-out Date',     labelAr: 'تاريخ الخروج' },
  { category: 'Travel & Accommodation', key: 'travelAccommodation.purposeOfTravel',labelEn: 'Purpose of Travel',  labelAr: 'الغرض من السفر' },

  { category: 'Manual', key: 'MANUAL', labelEn: 'Manual Entry (Fixed Text)', labelAr: 'نص ثابت يدوياً' },
];

export const TRANSFORMS: TransformDefinition[] = [
  { key: FieldTransform.NONE,        labelEn: 'No Transform',                 labelAr: 'بدون تحويل' },
  { key: FieldTransform.LAST_WORD,   labelEn: 'Last Word (Surname)',          labelAr: 'الكلمة الأخيرة (اللقب)' },
  { key: FieldTransform.FIRST_WORDS, labelEn: 'All But Last Word (First Names)',labelAr: 'كل ما عدا الأخيرة' },
  { key: FieldTransform.DATE_DMY,    labelEn: 'Date → DD/MM/YYYY',           labelAr: 'تاريخ → يوم/شهر/سنة' },
  { key: FieldTransform.DATE_MDY,    labelEn: 'Date → MM/DD/YYYY',           labelAr: 'تاريخ → شهر/يوم/سنة' },
  { key: FieldTransform.DATE_YMD,    labelEn: 'Date → YYYY-MM-DD',           labelAr: 'تاريخ → سنة-شهر-يوم' },
  { key: FieldTransform.UPPERCASE,   labelEn: 'UPPERCASE',                   labelAr: 'أحرف كبيرة' },
  { key: FieldTransform.TITLE_CASE,  labelEn: 'Title Case',                  labelAr: 'أول كل كلمة كبير' },
  { key: FieldTransform.GENDER_MF,   labelEn: 'Gender → M / F',              labelAr: 'الجنس → M / F' },
  { key: FieldTransform.GENDER_FULL, labelEn: 'Gender → Male / Female',      labelAr: 'الجنس → Male / Female' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Pure utility functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reads a deeply-nested property from an object using dot-notation.
 * Returns null if any key in the path is missing.
 *
 * @example getNestedValue(app, 'extractedData.passportNo') → 'A2849104'
 */
export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  if (!path || !obj) return null;
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc !== null && typeof acc === 'object' && key in (acc as object)) {
      return (acc as Record<string, unknown>)[key];
    }
    return null;
  }, obj);
}

/**
 * Applies a named transform to a raw string value.
 * All transforms are pure functions — no side effects.
 */
export function applyTransform(value: string, transform: FieldTransform): string {
  if (!value && value !== '0') return '';
  const v = String(value).trim();

  switch (transform) {
    case FieldTransform.LAST_WORD: {
      const parts = v.split(/\s+/);
      return parts[parts.length - 1] ?? v;
    }
    case FieldTransform.FIRST_WORDS: {
      const parts = v.split(/\s+/);
      return parts.length > 1 ? parts.slice(0, -1).join(' ') : v;
    }
    case FieldTransform.DATE_DMY: {
      const d = new Date(v);
      if (isNaN(d.getTime())) return v;
      const dd   = String(d.getUTCDate()).padStart(2, '0');
      const mm   = String(d.getUTCMonth() + 1).padStart(2, '0');
      const yyyy = d.getUTCFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }
    case FieldTransform.DATE_MDY: {
      const d = new Date(v);
      if (isNaN(d.getTime())) return v;
      const dd   = String(d.getUTCDate()).padStart(2, '0');
      const mm   = String(d.getUTCMonth() + 1).padStart(2, '0');
      const yyyy = d.getUTCFullYear();
      return `${mm}/${dd}/${yyyy}`;
    }
    case FieldTransform.DATE_YMD:
      return v;
    case FieldTransform.UPPERCASE:
      return v.toUpperCase();
    case FieldTransform.TITLE_CASE:
      return v.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    case FieldTransform.GENDER_MF:
      if (/^m/i.test(v)) return 'M';
      if (/^f/i.test(v)) return 'F';
      return v;
    case FieldTransform.GENDER_FULL:
      if (/^m/i.test(v)) return 'Male';
      if (/^f/i.test(v)) return 'Female';
      return v;
    default:
      return v;
  }
}

/**
 * Resolves a single FieldMapping against application data.
 * Returns the resolved value, raw value, source, and confidence.
 */
export function resolveFieldValue(
  fieldMapping: FieldMapping,
  application: Application,
): ResolvedField {
  const { dataKey, transform, manualValue } = fieldMapping;

  if (!dataKey || dataKey === 'MANUAL') {
    return { value: manualValue || '', rawValue: manualValue || '', source: 'MANUAL', confidence: null };
  }

  const rawValue = getNestedValue(application as unknown as Record<string, unknown>, dataKey);

  if (rawValue === null || rawValue === undefined || rawValue === '') {
    return { value: '', rawValue: '', source: 'MISSING', confidence: null };
  }

  const transformed = applyTransform(String(rawValue), transform ?? FieldTransform.NONE);
  const isOcr = dataKey.startsWith('extractedData.');

  let confidence: number | null = null;
  if (isOcr) {
    const fieldKey = dataKey.replace('extractedData.', '');
    const confVal = getNestedValue(
      application as unknown as Record<string, unknown>,
      `extractedData.confidence.${fieldKey}`,
    );
    if (typeof confVal === 'number') confidence = confVal;
  }

  return {
    value: transformed,
    rawValue: String(rawValue),
    source: isOcr ? 'OCR' : 'APP',
    confidence,
  };
}

/**
 * Fills all fields in a FormTemplate against an Application.
 * Returns a FilledFormState map keyed by PDF field name.
 */
export function autoFillAll(
  application: Application,
  formTemplate: FormTemplate,
): FilledFormState {
  const filledState: FilledFormState = {};
  const mappings = formTemplate.fieldMappings ?? [];

  for (const mapping of mappings) {
    const resolved = resolveFieldValue(mapping, application);

    let status: FieldFillStatus;
    if (!mapping.dataKey || resolved.source === 'MISSING') {
      status = 'missing';
    } else if (resolved.source === 'MANUAL') {
      status = 'manual';
    } else {
      status = 'mapped';
    }

    filledState[mapping.pdfFieldName] = {
      ...resolved,
      status,
      mapping,
      confirmed: false,
    };
  }

  return filledState;
}

/**
 * Computes summary statistics from a FilledFormState.
 */
export function computeStats(filledState: FilledFormState): FormStats {
  const entries = Object.values(filledState);
  const total     = entries.length;
  const mapped    = entries.filter((e) => e.status === 'mapped' || e.status === 'manual').length;
  const missing   = entries.filter((e) => e.status === 'missing').length;
  const confirmed = entries.filter((e) => e.confirmed).length;
  const completionPct = total > 0 ? Math.round((mapped / total) * 100) : 0;
  const missingFields = entries
    .filter((e) => e.status === 'missing')
    .map((e) => e.mapping?.labelAr || e.mapping?.pdfFieldName || '');

  return { total, mapped, missing, confirmed, completionPct, missingFields };
}

/**
 * Initialises empty (unmapped) field mappings for a newly uploaded PDF.
 * Used by Super Admin when setting up a new embassy form template.
 * All dataKey values are empty — Admin maps them manually.
 */
export function initializeEmptyMappings(
  detectedFields: Array<{ name: string; type: string }>,
): FieldMapping[] {
  return detectedFields.map((field) => ({
    pdfFieldName:  field.name,
    pdfFieldType:  field.type,
    dataKey:       '',
    transform:     FieldTransform.NONE,
    labelAr:       field.name,
    labelEn:       field.name,
    mapConfidence: 'none',
    required:      false,
    manualValue:   '',
  }));
}

/**
 * Converts a Uint8Array to a base64 data URL for PDF download.
 */
export function uint8ToBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]!);
  }
  return 'data:application/pdf;base64,' + btoa(bin);
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF I/O functions (browser-only — depend on pdf-lib loaded globally)
// These are the only functions with side effects.
// ─────────────────────────────────────────────────────────────────────────────

declare const PDFLib: {
  PDFDocument: {
    load(bytes: Uint8Array, options?: { ignoreEncryption?: boolean }): Promise<{
      getForm(): {
        getFields(): Array<{ getName(): string; constructor: { name: string } }>;
        getTextField(name: string): { setText(val: string): void };
        getDropdown(name: string): { select(val: string): void };
        getRadioGroup(name: string): { select(val: string): void };
      };
      save(): Promise<Uint8Array>;
    }>;
  };
};

function base64ToPdfBytes(pdfBase64: string): Uint8Array {
  const base64Data = pdfBase64.includes(',') ? pdfBase64.split(',')[1]! : pdfBase64;
  return Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
}

/**
 * Detects AcroForm fields from a PDF base64 string.
 * Returns field names and types for use in the mapping UI.
 */
export async function detectPdfFields(
  pdfBase64: string,
): Promise<Array<{ name: string; type: string }>> {
  const pdfBytes = base64ToPdfBytes(pdfBase64);
  const pdfDoc   = await PDFLib.PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const form     = pdfDoc.getForm();

  return form.getFields().map((f) => ({
    name: f.getName(),
    type: f.constructor.name.replace('PDF', '').replace('Field', '').trim(),
  }));
}

/**
 * Fills a PDF AcroForm with the resolved field values and returns the modified PDF bytes.
 */
export async function fillPdfAcroForm(
  pdfBase64: string,
  filledState: FilledFormState,
): Promise<Uint8Array> {
  const pdfBytes = base64ToPdfBytes(pdfBase64);
  const pdfDoc   = await PDFLib.PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const form     = pdfDoc.getForm();

  for (const [fieldName, fieldData] of Object.entries(filledState)) {
    if (!fieldData.value && fieldData.value !== '0') continue;
    const val = String(fieldData.value);

    try {
      form.getTextField(fieldName).setText(val);
    } catch {
      try {
        form.getDropdown(fieldName).select(val);
      } catch {
        try {
          form.getRadioGroup(fieldName).select(val);
        } catch (e) {
          console.warn(`[FormEngine] Cannot fill "${fieldName}":`, (e as Error).message);
        }
      }
    }
  }

  return pdfDoc.save();
}
