import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT') || 587;
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`SMTP Mail Transporter configured targeting: ${host}:${port}`);
    } else {
      this.logger.warn('SMTP Credentials missing. Running email notifications in sandbox mock mode.');
    }
  }

  /**
   * Helper method to dispatch emails.
   */
  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    this.logger.log(`Dispatching email to: ${to} | Subject: ${subject}`);
    if (!this.transporter) {
      this.logger.log('Mock SMTP dispatch: Mail logged to terminal sandbox.');
      return true;
    }

    try {
      const from = this.configService.get<string>('SMTP_FROM') || 'noreply@mudar.ai';
      await this.transporter.sendMail({ from, to, subject, html });
      return true;
    } catch (err: any) {
      this.logger.error(`Failed to send email to ${to}: ${err.message}`);
      return false;
    }
  }

  /**
   * Distributes in-app alerts on status changes.
   */
  async createNotification(tenantId: string, userId: string, title: string, content: string) {
    this.logger.log(`Creating notification for user: ${userId} - ${title}`);
    
    // Save in-app notification entry
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type: 'STATUS_CHANGE',
        title,
        titleAr: title,
        body: content,
        bodyAr: content,
        isRead: false,
      },
    });

    return notification;
  }

  /**
   * Dispatches welcome email for newly onboarded subscription tenants.
   */
  async sendWelcomeEmail(email: string, tenantName: string) {
    const emailHtml = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #5b6ad0;">مرحباً بك في منصة فلو فيزا | Welcome to Mudar</h2>
        <p>عزيزي المشترك، يسعدنا انضمام وكالتكم <strong>${tenantName}</strong> إلى منصتنا.</p>
        <p>تم إعداد لوحة التحكم الخاصة بكم بنجاح، ويمكنكم الآن البدء في إدارة الطلبات وتعبئة النماذج تلقائياً.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <small style="color: #999;">Mudar AI Support Team</small>
      </div>
    `;
    await this.sendEmail(email, 'مرحباً بك في فلو فيزا | Welcome to Mudar', emailHtml);
  }

  /**
   * Dispatches subscription package renewal reminder.
   */
  async sendRenewalReminder(email: string, planName: string, daysRemaining: number) {
    const emailHtml = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #f59e0b;">تذكير بتجديد الاشتراك | Subscription Renewal Reminder</h2>
        <p>نود تذكيركم بأن اشتراككم الحالي في الباقة <strong>${planName}</strong> سينتهي خلال <strong>${daysRemaining}</strong> أيام.</p>
        <p>لتجنب انقطاع الخدمة، يرجى مراجعة وتحديث تفاصيل الدفع في لوحة الإعدادات الخاصة بكم.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <small style="color: #999;">Mudar AI Billing Team</small>
      </div>
    `;
    await this.sendEmail(email, 'تذكير بتجديد الاشتراك | Subscription Renewal Reminder', emailHtml);
  }
}


