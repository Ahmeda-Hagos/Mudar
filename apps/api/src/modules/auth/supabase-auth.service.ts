import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { IAuthService } from './auth.service.interface';
import { AuthUser, UserRole } from '@visaflow/types';
import * as bcrypt from 'bcrypt';

import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SupabaseAuthService implements IAuthService {
  private readonly logger = new Logger(SupabaseAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async login(email: string, password: string) {
    this.logger.log(`Attempting login wrapper check for: ${email}`);

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials or account suspended');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate 6-digit 2FA code expiring in 5 minutes
    const twoFactorCode = Math.floor(100000 + Math.random() * 900000).toString();
    const twoFactorExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { twoFactorCode, twoFactorExpiresAt },
    });

    // Send 2FA email
    const emailHtml = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #5b6ad0;">رمز التحقق الثنائي | 2FA Verification Code</h2>
        <p>يرجى استخدام الرمز التالي لإتمام عملية تسجيل الدخول:</p>
        <div style="background: #f1f3f9; padding: 12px; font-size: 1.5rem; font-weight: bold; text-align: center; border-radius: 4px; margin: 15px 0; letter-spacing: 2px;">
          ${twoFactorCode}
        </div>
        <p>الرمز صالح لمدة 5 دقائق فقط.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <small style="color: #999;">VisaFlow AI Security Service</small>
      </div>
    `;
    await this.notificationsService.sendEmail(user.email, 'رمز التحقق الثنائي | 2FA Verification Code', emailHtml);

    // Create temporary verification token encoding user ID
    const tempPayload = { sub: user.id, is2faTemp: true };
    const tempToken = await this.jwtService.signAsync(tempPayload, {
      secret: this.configService.get<string>('app.jwtSecret') || 'fallback-secret',
      expiresIn: '5m',
    });

    return {
      twoFactorRequired: true,
      tempToken,
    };
  }

  async verify2FaCode(tempToken: string, code: string) {
    this.logger.log(`Verifying 2FA code payload`);
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(tempToken, {
        secret: this.configService.get<string>('app.jwtSecret') || 'fallback-secret',
      });
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired temporary session');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User no longer exists or is suspended');
    }

    if (!user.twoFactorCode || !user.twoFactorExpiresAt) {
      throw new UnauthorizedException('No active 2FA transaction found');
    }

    if (new Date() > user.twoFactorExpiresAt) {
      throw new UnauthorizedException('Verification code has expired');
    }

    if (user.twoFactorCode !== code) {
      throw new UnauthorizedException('Incorrect verification code');
    }

    // Clear 2FA code from database
    await this.prisma.user.update({
      where: { id: user.id },
      data: { twoFactorCode: null, twoFactorExpiresAt: null },
    });

    // Generate final session tokens
    const sessionPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const accessToken = await this.jwtService.signAsync(sessionPayload, {
      secret: this.configService.get<string>('app.jwtSecret') || 'fallback-secret',
      expiresIn: '15m',
    });

    const refreshToken = await this.jwtService.signAsync(sessionPayload, {
      secret: this.configService.get<string>('app.jwtRefreshSecret') || 'fallback-refresh',
      expiresIn: '7d',
    });

    const authUser: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role as UserRole,
      isActive: user.isActive,
      tenantId: user.tenantId,
      avatarUrl: null,
      accessToken,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    return {
      accessToken,
      refreshToken,
      user: authUser,
    };
  }

  async validateUser(payload: { sub: string }): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || !user.isActive) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role as UserRole,
      isActive: user.isActive,
      tenantId: user.tenantId,
      avatarUrl: null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async requestPasswordReset(email: string): Promise<void> {
    this.logger.log(`Mock request password reset token for: ${email}`);
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('User does not exist');

    const resetToken = 'RST-' + Math.floor(100000 + Math.random() * 900000);
    const resetLink = `https://visaflow.ai/reset-password?token=${resetToken}`;
    const emailHtml = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #5b6ad0;">إعادة تعيين كلمة المرور | Password Reset Request</h2>
        <p>لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك. يرجى استخدام الرمز أدناه أو الضغط على الرابط:</p>
        <div style="background: #f1f3f9; padding: 12px; font-size: 1.2rem; font-weight: bold; text-align: center; border-radius: 4px; margin: 15px 0;">
          ${resetToken}
        </div>
        <p><a href="${resetLink}" style="color: #5b6ad0; font-weight: bold;">اضغط هنا لإعادة التعيين | Click here to reset</a></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <small style="color: #999;">VisaFlow AI Authentication Service</small>
      </div>
    `;
    await this.notificationsService.sendEmail(email, 'إعادة تعيين كلمة المرور | Password Reset Request', emailHtml);
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    this.logger.log(`Mock confirm password reset token authentication: ${token}`);
    const mockEmail = 'admin@agency.com';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { email: mockEmail },
      data: { password: hashedPassword }
    });
  }

  async verifyEmailToken(token: string): Promise<boolean> {
    this.logger.log(`Verifying email token: ${token}`);
    return true;
  }

  async setupMockMfa(userId: string): Promise<{ secret: string; qrCodeUrl: string }> {
    this.logger.log(`Setting up mock MFA for user: ${userId}`);
    return {
      secret: 'MOCK_MFA_SECRET_749219',
      qrCodeUrl: 'https://mock-qr.visaflow.ai/mfa-qr.png',
    };
  }
}
