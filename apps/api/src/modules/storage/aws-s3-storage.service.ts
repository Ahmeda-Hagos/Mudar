import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { IStorageService } from './storage.service.interface';
import { StorageCategory, buildStoragePath } from '@visaflow/constants';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AwsS3StorageService implements IStorageService {
  private readonly logger = new Logger(AwsS3StorageService.name);
  private s3: S3Client | null = null;
  private bucketName: string;
  private region: string;
  private kmsKeyId: string | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.region = this.configService.get<string>('app.awsRegion') || 'me-central-2';
    const accessKeyId = this.configService.get<string>('app.awsAccessKeyId');
    const secretAccessKey = this.configService.get<string>('app.awsSecretAccessKey');
    this.bucketName = this.configService.get<string>('app.awsS3Bucket') || 'visaflow-sensitive-vault';
    this.kmsKeyId = this.configService.get<string>('app.awsKmsKeyId') || null;

    if (accessKeyId && secretAccessKey) {
      if (!this.kmsKeyId) {
        throw new Error(
          'AWS_KMS_KEY_ID is required. All S3 uploads must use SSE-KMS encryption. ' +
          'Configure a Customer Managed Key ARN in the environment before starting the service.'
        );
      }
      this.s3 = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.logger.log(`AWS S3 Client initialized in region ${this.region} with KMS key ${this.kmsKeyId}.`);
    } else {
      this.logger.warn('AWS S3 credentials missing. Running storage in mock/sandbox mode.');
    }
  }

  async uploadFile(
    tenantId: string,
    category: StorageCategory,
    filename: string,
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<{ storagePath: string; publicUrl: string }> {
    const storagePath = buildStoragePath(tenantId, category, filename);
    const sizeBytes = fileBuffer.length;

    // Verify quota limits before uploading
    const hasQuota = await this.verifyQuota(tenantId, sizeBytes);
    if (!hasQuota) {
      throw new BadRequestException('Storage quota limit exceeded for this tenant plan');
    }

    if (this.s3) {
      try {
        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: storagePath,
          Body: fileBuffer,
          ContentType: mimeType,
          ServerSideEncryption: 'aws:kms',  // Always required — constructor throws if kmsKeyId is absent
          SSEKMSKeyId: this.kmsKeyId!,
        });
        await this.s3.send(command);
      } catch (err: any) {
        this.logger.error(`AWS S3 upload error: ${err.message}`);
        throw new BadRequestException(`Failed to upload file to storage: ${err.message}`);
      }
    } else {
      this.logger.warn(`Mock S3 upload completed for: ${storagePath}`);
    }

    // Update tenant usage metrics
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        storageUsedBytes: {
          increment: BigInt(sizeBytes),
        },
      },
    });

    const publicUrl = this.s3
      ? `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${storagePath}`
      : `https://mock.s3.${this.region}.amazonaws.com/${this.bucketName}/${storagePath}`;

    return {
      storagePath,
      publicUrl,
    };
  }

  async downloadFile(tenantId: string, storagePath: string): Promise<Buffer> {
    if (!storagePath.startsWith(`${tenantId}/`)) {
      throw new BadRequestException('Unauthorized storage resource access attempt');
    }

    if (this.s3) {
      try {
        const command = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: storagePath,
        });
        const response = await this.s3.send(command);
        
        if (!response.Body) {
          throw new Error('Empty response body returned from AWS S3');
        }

        // Convert ReadableStream to buffer helper
        const chunks: any[] = [];
        for await (const chunk of response.Body as any) {
          chunks.push(chunk);
        }
        return Buffer.concat(chunks);
      } catch (err: any) {
        throw new BadRequestException(`Failed to download file from S3: ${err.message}`);
      }
    }

    return Buffer.from('mock-file-content');
  }

  async deleteFile(tenantId: string, storagePath: string): Promise<void> {
    if (!storagePath.startsWith(`${tenantId}/`)) {
      throw new BadRequestException('Unauthorized storage resource delete attempt');
    }

    if (this.s3) {
      try {
        const command = new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: storagePath,
        });
        await this.s3.send(command);
      } catch (err: any) {
        throw new BadRequestException(`Failed to delete file from S3: ${err.message}`);
      }
    }

    // Decrement usage by actual file size. Using 1MB mock for decrement metadata.
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        storageUsedBytes: {
          decrement: BigInt(1024 * 1024),
        },
      },
    });
  }

  async verifyQuota(tenantId: string, incomingSizeBytes: number): Promise<boolean> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) return false;

    const currentUsed = tenant.storageUsedBytes;
    const quota = tenant.storageQuotaBytes;

    return (currentUsed + BigInt(incomingSizeBytes)) <= quota;
  }

  async getPresignedUrl(tenantId: string, storagePath: string, expiresInSeconds = 60): Promise<string> {
    if (!storagePath.startsWith(`${tenantId}/`)) {
      throw new BadRequestException('Unauthorized storage resource access attempt');
    }

    if (this.s3) {
      try {
        const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
        const command = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: storagePath,
        });
        return await getSignedUrl(this.s3, command, { expiresIn: expiresInSeconds });
      } catch (err: any) {
        throw new BadRequestException(`Failed to generate pre-signed URL: ${err.message}`);
      }
    }

    return `https://mock.presigned.s3.${this.region}.amazonaws.com/${this.bucketName}/${storagePath}?expires=${expiresInSeconds}`;
  }
}
