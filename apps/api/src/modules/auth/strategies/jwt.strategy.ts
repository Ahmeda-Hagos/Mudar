import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { IAuthService, IAuthServiceToken } from '../auth.service.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @Inject(IAuthServiceToken)
    private readonly authService: IAuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('app.jwtSecret') || 'fallback-secret',
    });
  }

  async validate(payload: { sub: string; email: string; role: string; tenantId: string }) {
    const user = await this.authService.validateUser(payload);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Session expired or user suspended');
    }
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };
  }
}
