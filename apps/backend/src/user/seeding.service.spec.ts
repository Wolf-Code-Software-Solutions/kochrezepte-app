import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { SeedingService } from './seeding.service';
import { UserEntity } from './user.entity';

describe('SeedingService', () => {
  let service: SeedingService;
  let mockUserRepository: any;

  beforeEach(async () => {
    mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        SeedingService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get(SeedingService);
  });

  it('sollte keinen Demo-User anlegen, wenn er bereits existiert', async () => {
    mockUserRepository.findOne.mockResolvedValue({ id: '123' });

    await service.seedDemoUser();

    expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: 'demo@koch.de' } });
    expect(mockUserRepository.create).not.toHaveBeenCalled();
    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });

  it('sollte Demo-User mit gehashtem Passwort anlegen, wenn er nicht existiert', async () => {
    mockUserRepository.findOne.mockResolvedValue(null);
    mockUserRepository.create.mockReturnValue({ email: 'demo@koch.de' });
    mockUserRepository.save.mockResolvedValue({ id: 'new-id' });

    await service.seedDemoUser();

    expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: 'demo@koch.de' } });
    expect(mockUserRepository.create).toHaveBeenCalled();
    expect(mockUserRepository.save).toHaveBeenCalled();

    const createdUser = mockUserRepository.create.mock.calls[0][0];
    expect(createdUser.email).toBe('demo@koch.de');
    expect(createdUser.name).toBe('Demo User');
    expect(createdUser.passwordHash).not.toBe('password123');

    const compareResult = await bcrypt.compare('password123', createdUser.passwordHash);
    expect(compareResult).toBe(true);
  });

  it('sollte beim Modul-Start den Seeding-Prozess ausführen', async () => {
    mockUserRepository.findOne.mockResolvedValue(null);
    mockUserRepository.create.mockReturnValue({ email: 'demo@koch.de' });
    mockUserRepository.save.mockResolvedValue({ id: 'new-id' });

    await service.onModuleInit();

    expect(mockUserRepository.save).toHaveBeenCalled();
  });
});
