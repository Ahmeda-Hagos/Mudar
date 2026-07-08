import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { IAuthServiceToken } from './auth.service.interface';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    login: jest.fn().mockResolvedValue({
      accessToken: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
      user: { id: 'usr-1', email: 'test@agency.com' },
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: IAuthServiceToken,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return token payloads on successful login requests', async () => {
    const res = await controller.login({ email: 'test@agency.com', password: 'password123' });
    expect(res.accessToken).toEqual('mock-jwt-token');
    expect(mockAuthService.login).toHaveBeenCalledWith('test@agency.com', 'password123');
  });
});
