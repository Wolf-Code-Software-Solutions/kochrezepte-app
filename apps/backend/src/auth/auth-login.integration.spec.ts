import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../app.module';

describe('Auth login endpoint', () => {
  let app: INestApplication<App>;
  const originalJwtSecret = process.env.JWT_SECRET;
  const originalDatabasePath = process.env.DATABASE_PATH;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'integration-test-secret';
    process.env.DATABASE_PATH = ':memory:';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();

    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }

    if (originalDatabasePath === undefined) {
      delete process.env.DATABASE_PATH;
    } else {
      process.env.DATABASE_PATH = originalDatabasePath;
    }
  });

  it('returns 401 without leaking login details when the password is wrong', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'demo@koch.de', password: 'wrong-password' })
      .expect(401);

    const body = JSON.stringify(response.body);
    expect(response.body.message).toBe('Ungültige Zugangsdaten');
    expect(body).not.toContain('demo@koch.de');
    expect(body).not.toContain('passwordHash');
    expect(body).not.toContain('exist');
    expect(body).not.toContain('Demo User');
  });
});
