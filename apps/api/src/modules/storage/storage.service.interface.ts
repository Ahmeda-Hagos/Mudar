import { StorageCategory } from '@visaflow/constants';

/**
 * Storage Service interface.
 * Decouples direct integrations with Supabase Storage, S3 or local disks.
 */
export interface IStorageService {
  /**
   * Uploads a file buffer and returns the unique storage reference path.
   */
  uploadFile(
    tenantId: string,
    category: StorageCategory,
    filename: string,
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<{ storagePath: string; publicUrl: string }>;

  /**
   * Downloads a file buffer using its storage reference path.
   */
  downloadFile(tenantId: string, storagePath: string): Promise<Buffer>;

  /**
   * Deletes a file reference from the storage bucket.
   */
  deleteFile(tenantId: string, storagePath: string): Promise<void>;

  /**
   * Generates a transient pre-signed download URL for secure document retrieval.
   * expiresInSeconds parameter enforces access expiration (e.g. 60 seconds).
   */
  getPresignedUrl(tenantId: string, storagePath: string, expiresInSeconds?: number): Promise<string>;

  /**
   * Evaluates if the tenant has enough quota space for an upcoming upload.
   */
  verifyQuota(tenantId: string, incomingSizeBytes: number): Promise<boolean>;
}

export const IStorageServiceToken = Symbol('IStorageService');
