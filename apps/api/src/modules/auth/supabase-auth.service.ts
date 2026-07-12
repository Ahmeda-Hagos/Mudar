import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { IAuthService } from './auth.service.interface';
import { AuthUser, UserRole } from '@mudar/types';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';

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

    // Hash before storing — verify2FaCode uses bcrypt.compare() against the raw user-supplied code
    const twoFactorCodeHash = await bcrypt.hash(twoFactorCode, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { twoFactorCode: twoFactorCodeHash, twoFactorExpiresAt },
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

    if (user.twoFactorLockedUntil && new Date() < user.twoFactorLockedUntil) {
      throw new UnauthorizedException('Account locked due to too many failed 2FA attempts. Try again later.');
    }

    const isMatch = await bcrypt.compare(code, user.twoFactorCode);
    if (!isMatch) {
      const attempts = (user.twoFactorAttempts || 0) + 1;
      const lockedUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      await this.prisma.user.update({
        where: { id: user.id },
        data: { twoFactorAttempts: attempts, twoFactorLockedUntil: lockedUntil },
      });
      throw new UnauthorizedException('Incorrect verification code');
    }

    // Clear 2FA code from database and reset attempts
    await this.prisma.user.update({
      where: { id: user.id },
      data: { twoFactorCode: null, twoFactorExpiresAt: null, twoFactorAttempts: 0, twoFactorLockedUntil: null },
    });

    // Generate final session tokens
    const sessionPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const jwtSecret = this.configService.get<string>('app.jwtSecret');
    const jwtRefreshSecret = this.configService.get<string>('app.jwtRefreshSecret');
    if (!jwtSecret || !jwtRefreshSecret || jwtSecret === 'fallback-secret') {
      throw new Error('JWT secrets are not properly configured.');
    }

    const accessToken = await this.jwtService.signAsync(sessionPayload, {
      secret: jwtSecret,
      expiresIn: '15m',
    });

    const refreshToken = await this.jwtService.signAsync(sessionPayload, {
      secret: jwtRefreshSecret,
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
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return; // Prevent user enumeration

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetTokenHash, resetTokenExpiresAt },
    });

    const resetLink = `https://visaflow.ai/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
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

  async confirmPasswordReset(token: string, newPassword: string, email?: string): Promise<void> {
    if (!email) throw new BadRequestException('Email is required');
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.resetTokenHash || !user.resetTokenExpiresAt) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (new Date() > user.resetTokenExpiresAt) {
      throw new BadRequestException('Reset token has expired');
    }

    const providedTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    if (providedTokenHash !== user.resetTokenHash) {
      throw new BadRequestException('Invalid reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, resetTokenHash: null, resetTokenExpiresAt: null }
    });
  }

  async verifyEmailToken(token: string): Promise<boolean> {
    if (!token) throw new BadRequestException('Verification token is required');

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.prisma.user.findFirst({
      where: { emailVerificationToken: tokenHash },
    });

    if (!user) {
      throw new BadRequestException('Invalid or already-used verification token');
    }

    if (user.emailVerificationExpiresAt && new Date() > user.emailVerificationExpiresAt) {
      throw new BadRequestException('Verification token has expired — please request a new one');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
      },
    });

    return true;
  }

  /**
   * Generates and sends an email verification link for the given user.
   * Call this after user registration or when the user requests a resend.
   */
  async sendEmailVerification(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;
    if (user.emailVerified) return; // Already verified — no-op

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: tokenHash,
        emailVerificationExpiresAt: expiresAt,
      },
    });

    const verifyLink = `https://visaflow.ai/verify-email?token=${rawToken}`;
    const emailHtml = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #5b6ad0;">تأكيد البريد الإلكتروني | Verify Your Email</h2>
        <p>يرجى النقر على الرابط أدناه لتأكيد بريدك الإلكتروني (صالح لمدة 24 ساعة):</p>
        <p><a href="${verifyLink}" style="color: #5b6ad0; font-weight: bold;">Verify Email | تأكيد البريد</a></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <small style="color: #999;">VisaFlow AI — If you did not create an account, ignore this email.</small>
      </div>
    `;

    await this.notificationsService.sendEmail(user.email, 'تأكيد البريد الإلكتروني | Verify Email', emailHtml);
  }

  async setupMockMfa(userId: string): Promise<{ secret: string; qrCodeUrl: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const secretObj = speakeasy.generateSecret({ name: 'VisaFlow AI', issuer: 'VisaFlow' });
    const secret = secretObj.base32;
    const qrCodeUrl = secretObj.otpauth_url || '';
    
    // Note: The secret should be saved to the database upon user verification of the code
    return {
      secret,
      qrCodeUrl,
    };
  }
}

