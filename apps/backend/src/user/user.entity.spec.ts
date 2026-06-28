import { validate } from 'class-validator';
import { UserEntity } from './user.entity';

describe('UserEntity', () => {
  it('sollte eine gültige User-Entität ohne Fehler erstellen', async () => {
    const user = new UserEntity();
    user.email = 'test@example.com';
    user.passwordHash = '$2b$10$somehashedvalue';
    user.name = 'Test User';

    const errors = await validate(user);
    expect(errors.length).toBe(0);
  });

  it('sollte bei ungültigem E-Mail-Format einen Validierungsfehler werfen', async () => {
    const user = new UserEntity();
    user.email = 'nicht-email';
    user.passwordHash = '$2b$10$somehashedvalue';
    user.name = 'Test User';

    const errors = await validate(user);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
  });

  it('sollte bei leerem passwordHash einen Validierungsfehler werfen', async () => {
    const user = new UserEntity();
    user.email = 'test@example.com';
    user.passwordHash = '';
    user.name = 'Test User';

    const errors = await validate(user);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('passwordHash');
  });

  it('sollte bei leerem Namen einen Validierungsfehler werfen', async () => {
    const user = new UserEntity();
    user.email = 'test@example.com';
    user.passwordHash = '$2b$10$somehashedvalue';
    user.name = '';

    const errors = await validate(user);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('name');
  });

  it('sollte createdAt und updatedAt vom TypeORM-Decorator korrekt setzen', () => {
    const user = new UserEntity();
    user.email = 'test@example.com';
    user.passwordHash = '$2b$10$somehashedvalue';
    user.name = 'Test User';

    expect(user.createdAt).toBeUndefined();
    expect(user.updatedAt).toBeUndefined();
  });
});
