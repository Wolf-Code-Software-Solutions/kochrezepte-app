import { Test, TestingModule } from '@nestjs/testing';
import { HashService } from './hash.service';

describe('HashService', () => {
  let service: HashService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HashService],
    }).compile();

    service = module.get<HashService>(HashService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hash', () => {
    it('should return a hashed string that differs from the original password', async () => {
      const password = 'password123';
      const hashResult = await service.hash(password);
      expect(hashResult).not.toBe(password);
      expect(typeof hashResult).toBe('string');
      expect(hashResult.length).toBeGreaterThan(0);
    });

    it('should produce different hashes for the same password (salt)', async () => {
      const password = 'password123';
      const hash1 = await service.hash(password);
      const hash2 = await service.hash(password);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('compare', () => {
    it('should return true for correct password', async () => {
      const password = 'password123';
      const hashResult = await service.hash(password);
      const result = await service.compare(password, hashResult);
      expect(result).toBe(true);
    });

    it('should return false for wrong password', async () => {
      const password = 'password123';
      const hashResult = await service.hash(password);
      const result = await service.compare('wrongpassword', hashResult);
      expect(result).toBe(false);
    });

    it('should return false when comparing empty string against a valid hash', async () => {
      const password = 'password123';
      const hashResult = await service.hash(password);
      const result = await service.compare('', hashResult);
      expect(result).toBe(false);
    });
  });
});
