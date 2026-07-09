import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Request, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IAuthService, IAuthServiceToken } from './auth.service.interface';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    @Inject(IAuthServiceToken)
    private readonly authService: IAuthService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and return JWT tokens or request 2FA challenge' })
  @ApiResponse({ status: 200, description: 'Login successful or 2FA required' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Public()
  @Post('verify-2fa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify 2FA code to complete authentications' })
  async verify2Fa(@Body() body: { tempToken: string; code: string }) {
    return this.authService.verify2FaCode(body.tempToken, body.code);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current session profile' })
  @ApiResponse({ status: 200, description: 'Profile returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req: any) {
    return req.user;
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset token link' })
  async forgotPassword(@Body() body: { email: string }) {
    await (this.authService as any).requestPasswordReset(body.email);
    return { sent: true };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm password reset using token credentials' })
  async resetPassword(@Body() body: { token: string; password: any; email: string }) {
    await (this.authService as any).confirmPasswordReset(body.token, body.password, body.email);
    return { success: true };
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify applicant email registration token' })
  async verifyEmail(@Body() body: { token: string }) {
    const verified = await (this.authService as any).verifyEmailToken(body.token);
    return { verified };
  }

  @Post('mfa/setup')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request configuration credentials for MFA QR setup' })
  async setupMfa(@Request() req: any) {
    return (this.authService as any).setupMockMfa(req.user.id);
  }
}
