import { Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationsRepository } from './applications.repository';
import { Application, AppStatus } from '@prisma/client';

@Injectable()
export class ApplicationsService {
  constructor(private readonly repository: ApplicationsRepository) {}

  async findOne(tenantId: string, id: string): Promise<Application> {
    const app = await this.repository.getDetails(tenantId, id);
    if (!app) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }
    return app;
  }

  async findAll(tenantId: string): Promise<Application[]> {
    return this.repository.findAll(tenantId);
  }

  async updateStatus(
    tenantId: string,
    id: string,
    userId: string,
    userName: string,
    nextStatus: AppStatus,
  ): Promise<Application> {
    const app = await this.findOne(tenantId, id);
    const oldStatus = app.status;

    const updated = await this.repository.update(tenantId, id, {
      status: nextStatus,
    });

    await this.repository.logAuditEvent(
      id,
      userId,
      `تم تغيير حالة المعاملة من ${oldStatus} إلى ${nextStatus} بواسطة ${userName}`,
      oldStatus,
      nextStatus,
    );

    return updated;
  }

  async addNote(
    tenantId: string,
    id: string,
    userId: string,
    userName: string,
    content: string,
  ) {
    await this.findOne(tenantId, id);
    const note = await this.repository.addNote(id, userId, content);

    await this.repository.logAuditEvent(
      id,
      userId,
      `تمت إضافة ملاحظة داخلية جديدة بواسطة ${userName}`,
      null,
      null,
    );

    return note;
  }

  async saveTravelAccommodation(
    tenantId: string,
    id: string,
    userId: string,
    userName: string,
    travelAccommodation: any,
  ) {
    await this.findOne(tenantId, id);
    const updated = await this.repository.update(tenantId, id, {
      travelAccommodation,
    });

    await this.repository.logAuditEvent(
      id,
      userId,
      `تحديث تفاصيل حجز الفندق ووسائل السفر بواسطة ${userName}`,
      null,
      null,
    );

    return updated;
  }
}
