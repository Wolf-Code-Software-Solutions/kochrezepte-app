import { Test } from '@nestjs/testing';
import { AuthLoginController } from './auth-login.controller';
import { AuthLoginService } from './auth-login.service';

describe('AuthLoginController', () => {
  let controller: AuthLoginController;
  let authLoginService: { login: jest.Mock };

  beforeEach(async () => {
    authLoginService = {
      login: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [AuthLoginController],
      providers: [
        {
          provide: AuthLoginService,
          useValue: authLoginService,
        },
      ],
    }).compile();

    controller = module.get(AuthLoginController);
  });

  it('delegates login requests and returns the access token response', async () => {
    authLoginService.login.mockResolvedValue({ access_token: 'signed-token' });

    await expect(
      controller.login({ email: 'demo@koch.de', password: 'password123' }),
    ).resolves.toEqual({ access_token: 'signed-token' });

    expect(authLoginService.login).toHaveBeenCalledWith(
      'demo@koch.de',
      'password123',
    );
  });
});
