import * as bcrypt from 'bcrypt';
import { Injectable } from '@nestjs/common';

const BCRYPT_SALT_ROUNDS = 10;

@Injectable()
export class HashService {
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
