import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { SupabaseAuthService } from './supabase-auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { IAuthServiceToken } from './auth.service.interface';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    NotificationsModule,
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: IAuthServiceToken,
      useClass: SupabaseAuthService,
    },
    JwtStrategy,
  ],
  exports: [IAuthServiceToken, PassportModule],
})
export class AuthModule {}
