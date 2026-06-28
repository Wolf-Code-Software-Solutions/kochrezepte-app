import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UserEntity } from '../user/user.entity';
import { HashService } from './hash.service';
import { AuthResetService } from './auth-reset.service';

describe('AuthResetService', () => {
  let service: AuthResetService;
  let userRepositoryMock: jest.Mocked<Partial<UserEntity>> & Record<string, jest.Mock<any, any>>;
  let hashServiceMock: { hash: jest.Mock };

  const testUser = {
    id: 'test-user-id',
    email: 'test@koch.de',
    passwordHash: '$2b$10$dG2k2h7Lq0k8FqT3z6Y5rOvVxRjMmNnKpPcQwErTyUiOpAsDf',
    name: 'Test User',
  };

  beforeEach(async () => {
    userRepositoryMock = {
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };

    hashServiceMock = {
      hash: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthResetService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: userRepositoryMock,
        },
        {
          provide: HashService,
          useValue: hashServiceMock,
        },
      ],
    }).compile();

    service = moduleRef.get(AuthResetService);
  });

  describe('requestPasswordReset', () => {
    it('generiert einen Token und speichert den SHA256-Hash in der DB', async () => {
      userRepositoryMock.findOne.mockResolvedValue(testUser);

      const result = await service.requestPasswordReset('test@koch.de');

      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
      // Token ist ein UUID (36 Zeichen)
      expect(result.token.length).toBe(36);

      // Der in der DB gespeicherte Hash ist SHA256 des Tokens
      const expectedHash = crypto.createHash('sha256').update(result.token).digest('hex');
      expect(userRepositoryMock.update).toHaveBeenCalledWith(testUser.id, {
        resetToken: expectedHash,
        resetTokenExpiry: expect.any(Date),
      });
    });

    it('setzt resetTokenExpiry auf 10 Minuten ab jetzt', async () => {
      userRepositoryMock.findOne.mockResolvedValue(testUser);

      const before = Date.now();
      await service.requestPasswordReset('test@koch.de');
      const after = Date.now();

      const updateCall = userRepositoryMock.update.mock.calls[0];
      const expiry: Date = updateCall[1].resetTokenExpiry;

      expect(expiry.getTime()).toBeGreaterThanOrEqual(before + 9 * 60 * 1000); // ~10 Min
      expect(expiry.getTime()).toBeLessThanOrEqual(after + 11 * 60 * 1000);
    });

    it('wirft NotFoundException fuer nicht-existierende Email', async () => {
      userRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        service.requestPasswordReset('unknown@koch.de'),
      ).rejects.toThrow(NotFoundException);

      // Keine DB-Update-Aktion, da User nicht gefunden wurde
      expect(userRepositoryMock.update).not.toHaveBeenCalled();
    });

    it('wirft NotFoundException mit generischer Nachricht (keine Email-Aufdeckung)', async () => {
      userRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        service.requestPasswordReset('unknown@koch.de'),
      ).rejects.toMatchObject({
        message: 'Ungültige Zugangsdaten',
      });
    });
  });

  describe('resetPassword', () => {
    it('setzt das Passwort zurueck mit gueltigem Token', async () => {
      const plainToken = crypto.randomUUID();
      const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');
      const expiry = new Date(Date.now() + 10 * 60 * 1000);

      userRepositoryMock.findOne.mockResolvedValue({
        ...testUser,
        resetToken: tokenHash,
        resetTokenExpiry: expiry,
      });
      hashServiceMock.hash.mockResolvedValue('new-hashed-password');

      await service.resetPassword(plainToken, 'NeuesPasswort123!');

      // HashService wurde fuer das neue Passwort aufgerufen
      expect(hashServiceMock.hash).toHaveBeenCalledWith('NeuesPasswort123!');

      // DB wurde updated: neues Passwort + Token geloescht
      expect(userRepositoryMock.update).toHaveBeenCalledWith(testUser.id, {
        passwordHash: 'new-hashed-password',
        resetToken: null,
        resetTokenExpiry: null,
      });
    });

    it('wirft BadRequestException bei nicht-existentem Token', async () => {
      userRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        service.resetPassword('invalid-token', 'NeuesPasswort123!'),
      ).rejects.toThrow(BadRequestException);

      // HashService sollte NICHT aufgerufen werden (Token ist ungültig)
      expect(hashServiceMock.hash).not.toHaveBeenCalled();
    });

    it('wirft BadRequestException wenn resetTokenExpiry null ist', async () => {
      const plainToken = crypto.randomUUID();
      const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');

      userRepositoryMock.findOne.mockResolvedValue({
        ...testUser,
        resetToken: tokenHash,
        resetTokenExpiry: null,
      });

      await expect(
        service.resetPassword(plainToken, 'NeuesPasswort123!'),
      ).rejects.toThrow(BadRequestException);

      expect(hashServiceMock.hash).not.toHaveBeenCalled();
    });

    it('wirft BadRequestException bei abgelaufenem Token', async () => {
      const plainToken = crypto.randomUUID();
      const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');

      userRepositoryMock.findOne.mockResolvedValue({
        ...testUser,
        resetToken: tokenHash,
        resetTokenExpiry: new Date(Date.now() - 1000), // bereits abgelaufen
      });

      await expect(
        service.resetPassword(plainToken, 'NeuesPasswort123!'),
      ).rejects.toThrow(BadRequestException);

      expect(hashServiceMock.hash).not.toHaveBeenCalled();
    });

    it('wirft BadRequestException bei Token genau an Expiry-Grenze', async () => {
      const plainToken = crypto.randomUUID();
      const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');

      userRepositoryMock.findOne.mockResolvedValue({
        ...testUser,
        resetToken: tokenHash,
        resetTokenExpiry: new Date(Date.now() - 1), // bereits abgelaufen (auch wenn nur um 1ms)
      });

      await expect(
        service.resetPassword(plainToken, 'NeuesPasswort123!'),
      ).rejects.toThrow(BadRequestException);
    });

    it('akzeptiert Token der noch gerade gueltig ist', async () => {
      const plainToken = crypto.randomUUID();
      const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');

      userRepositoryMock.findOne.mockResolvedValue({
        ...testUser,
        resetToken: tokenHash,
        resetTokenExpiry: new Date(Date.now() + 1), // noch 1ms gültig
      });
      hashServiceMock.hash.mockResolvedValue('new-hashed-password');

      await expect(
        service.resetPassword(plainToken, 'NeuesPasswort123!'),
      ).resolves.toBeUndefined();

      expect(hashServiceMock.hash).toHaveBeenCalled();
    });
  });
});
