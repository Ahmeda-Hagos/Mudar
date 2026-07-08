import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../database/base.repository';
import { PrismaService } from '../../database/prisma.service';
import { Application } from '@prisma/client';

@Injectable()
export class ApplicationsRepository extends BaseRepository<Application, any, any> {
  constructor(prisma: PrismaService) {
    super(prisma, 'application');
  }

  async getDetails(tenantId: string, id: string): Promise<Application | null> {
    return this.prisma.$withTenant(tenantId, (tx) => 
      tx.application.findFirst({
        where: { id, tenantId },
        include: {
          customer: {
            select: { id: true, name: true, email: true, phone: true },
          },
          documents: true,
          notes: {
            include: {
              author: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
          auditLogs: {
            include: {
              user: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      })
    ) as any;
  }

  async addNote(applicationId: string, authorId: string, content: string) {
    return this.prisma.note.create({
      data: {
        applicationId,
        authorId,
        content,
      },
    });
  }

  async logAuditEvent(
    applicationId: string,
    userId: string,
    action: string,
    fromStatus: string | null,
    toStatus: string | null,
  ) {
    return this.prisma.auditLog.create({
      data: {
        applicationId,
        userId,
        action,
        fromStatus,
        toStatus,
      },
    });
  }
}
