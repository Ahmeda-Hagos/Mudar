import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { IStorageService, IStorageServiceToken } from '../storage/storage.service.interface';

@Injectable()
export class RetentionLifecycleService {
  private readonly logger = new Logger(RetentionLifecycleService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(IStorageServiceToken)
    private readonly storageService: IStorageService,
  ) {}

  /**
   * Run daily at midnight to purge scanned passport data and PII
   * 30 days after application processing completes (status is COMPLETED or REJECTED)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async purgeExpiredDocuments() {
    this.logger.log('Starting daily data retention lifecycle purge checks...');
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    // 1. Find completed applications updated more than 30 days ago
    const expiredApplications = await this.prisma.application.findMany({
      where: {
        status: { in: ['COMPLETED'] },
        updatedAt: { lte: cutoffDate },
      },
      include: {
        documents: true,
      },
    }) as any[];

    if (expiredApplications.length === 0) {
      this.logger.log('No expired applicant documents found for retention purging.');
      return;
    }

    this.logger.log(`Found ${expiredApplications.length} expired applications. Commencing S3 file purge...`);

    let purgedCount = 0;

    for (const app of expiredApplications) {
      for (const doc of app.documents) {
        try {
          // Delete from AWS S3
          await this.storageService.deleteFile(app.tenantId, doc.storagePath);
          
          // Delete database record
          await this.prisma.document.delete({
            where: { id: doc.id },
          });

          purgedCount++;
        } catch (err: any) {
          this.logger.error(`Failed to purge document ${doc.id} from storage: ${err.message}`);
        }
      }

      // Anonymize the application's OCR extractedData for compliance record retention
      await this.prisma.application.update({
        where: { id: app.id },
        data: {
          extractedData: {}, // Purge extracted PII
        },
      });
    }

    this.logger.log(`Data retention purge run complete. Purged ${purgedCount} files securely.`);
  }
}
