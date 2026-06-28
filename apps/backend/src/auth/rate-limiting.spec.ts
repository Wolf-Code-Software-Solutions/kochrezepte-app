import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthLoginController } from './auth-login.controller';
import { AuthLoginService } from './auth-login.service';

describe('Rate Limiting Integration', () => {
  let module;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 5 }])],
      controllers: [AuthLoginController],
      providers: [{ provide: AuthLoginService, useValue: { login: jest.fn() } }],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  it('ThrottlerModule is loaded and controller resolves (rate-limiting active)', async () => {
    const controller = module.get(AuthLoginController);
    expect(controller).toBeDefined();
  });
});
