import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';

describe('ApplicationsController', () => {
  let controller: ApplicationsController;

  const mockApplicationsService = {
    findAll: jest.fn().mockResolvedValue([
      { id: 'app-1', destination: 'France', status: 'NEW_REQUEST' },
    ]),
    findOne: jest.fn().mockResolvedValue({
      id: 'app-1',
      destination: 'France',
      status: 'NEW_REQUEST',
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationsController],
      providers: [
        {
          provide: ApplicationsService,
          useValue: mockApplicationsService,
        },
      ],
    }).compile();

    controller = module.get<ApplicationsController>(ApplicationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should list all applications matching tenant identifier keys', async () => {
    const res = await controller.list('tenant-74921');
    expect(res).toBeInstanceOf(Array);
    expect(res[0].id).toEqual('app-1');
    expect(mockApplicationsService.findAll).toHaveBeenCalledWith('tenant-74921');
  });
});
