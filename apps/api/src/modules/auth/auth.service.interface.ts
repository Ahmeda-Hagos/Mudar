import { AuthUser, UserRole } from '@visaflow/types';

/**
 * Authentication service contract.
 * All business workflows MUST depend on this interface,
 * not on any specific provider implementation (Supabase / Cognito).
 */
export interface IAuthService {
  /**
   * Authenticate a user credentials session and return JWT session tokens.
   */
  login(email: string, password: string): Promise<{
    twoFactorRequired: boolean;
    tempToken?: string;
    accessToken?: string;
    refreshToken?: string;
    user?: AuthUser;
  }>;

  /**
   * Complete 2FA code verification.
   */
  verify2FaCode(tempToken: string, code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
  }>;

  /**
   * Decrypt and validate user profile from token payload claims.
   */
  validateUser(payload: { sub: string }): Promise<AuthUser | null>;

  /**
   * Trigger a password reset email flow.
   */
  requestPasswordReset(email: string): Promise<void>;

  /**
   * Complete password reset verification.
   */
  confirmPasswordReset(token: string, newPassword: string): Promise<void>;
}

export const IAuthServiceToken = Symbol('IAuthService');
