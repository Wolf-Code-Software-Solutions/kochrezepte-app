import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from '../user/user.entity';
import { HashService } from './hash.service';
import { AuthLoginService } from './auth-login.service';

describe('AuthLoginService', () => {
  let service: AuthLoginService;
  let userRepository: { findOne: jest.Mock };
  let hashService: { compare: jest.Mock };
  let jwtService: { signAsync: jest.Mock };

  const demoUser = {
    id: 'demo-user-id',
    email: 'demo@koch.de',
    passwordHash: 'hashed-password',
  };

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
    };
    hashService = {
      compare: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthLoginService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: userRepository,
        },
        {
          provide: HashService,
          useValue: hashService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    service = module.get(AuthLoginService);
  });

  it('logs in the demo user and returns an access token', async () => {
    userRepository.findOne.mockResolvedValue(demoUser);
    hashService.compare.mockResolvedValue(true);
    jwtService.signAsync.mockResolvedValue('signed-token');

    const result = await service.login('demo@koch.de', 'password123');

    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: { email: 'demo@koch.de' },
    });
    expect(hashService.compare).toHaveBeenCalledWith(
      'password123',
      'hashed-password',
    );
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 'demo-user-id',
      email: 'demo@koch.de',
    });
    expect(result).toEqual({ access_token: 'signed-token' });
  });

  it('rejects an unknown user with a generic unauthorized error', async () => {
    userRepository.findOne.mockResolvedValue(null);
    hashService.compare.mockResolvedValue(false);

    await expect(
      service.login('missing@koch.de', 'password123'),
    ).rejects.toMatchObject({
      status: 401,
      message: 'Ungültige Zugangsdaten',
    });

    // Timing-Attack-Schutz: compare wird auch bei nicht-existentem User aufgerufen
    expect(hashService.compare).toHaveBeenCalled();
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('always calls bcrypt.compare to prevent timing attacks (even for missing users)', async () => {
    userRepository.findOne.mockResolvedValue(null);
    hashService.compare.mockResolvedValue(false);

    await expect(
      service.login('missing@koch.de', 'password123'),
    ).rejects.toThrow();

    // bcrypt.compare wird mit dem Dummy-Hash aufgerufen wenn kein User existiert
    expect(hashService.compare).toHaveBeenCalledWith(
      'password123',
      '$2b$10$dG2k2h7Lq0k8FqT3z6Y5rOvVxRjMmNnKpPcQwErTyUiOpAsDf',
    );
  });

  it('rejects a wrong password with a generic unauthorized error', async () => {
    userRepository.findOne.mockResolvedValue(demoUser);
    hashService.compare.mockResolvedValue(false);

    await expect(
      service.login('demo@koch.de', 'wrong-password'),
    ).rejects.toMatchObject({
      status: 401,
      message: 'Ungültige Zugangsdaten',
    });

    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('generates an HS256 token that expires after one hour', async () => {
    const realJwtService = new JwtService({
      secret: 'unit-test-secret',
      signOptions: { algorithm: 'HS256', expiresIn: '1h' },
    });
    service = new AuthLoginService(
      { findOne: jest.fn().mockResolvedValue(demoUser) } as any,
      { compare: jest.fn().mockResolvedValue(true) } as any,
      realJwtService,
    );

    const result = await service.login('demo@koch.de', 'password123');
    const decoded = realJwtService.decode(result.access_token, {
      complete: true,
    }) as any;

    expect(decoded.header.alg).toBe('HS256');
    expect(decoded.payload.sub).toBe('demo-user-id');
    expect(decoded.payload.email).toBe('demo@koch.de');
    expect(decoded.payload.exp - decoded.payload.iat).toBe(60 * 60);
  });
});
