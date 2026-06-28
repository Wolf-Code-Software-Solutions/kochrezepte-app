import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { UserEntity } from '../user/user.entity';
import { HashService } from './hash.service';

const TOKEN_TTL_MS = 10 * 60 * 1000; // 10 Minuten

@Injectable()
export class AuthResetService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly hashService: HashService,
  ) {}

  /**
   * Generiert einen Reset-Token und speichert den SHA256-Hash in der Datenbank.
   * Der Plain-Token wird zurueckgegeben (wuerde per E-Mail verschickt).
   */
  async requestPasswordReset(email: string): Promise<{ token: string }> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      // Constant-time Response: auch bei nicht-existenter Email keinen Unterschied anzeigen
      throw new NotFoundException('Ungültige Zugangsdaten');
    }

    const plainToken = crypto.randomUUID();
    const tokenHash = this.sha256(plainToken);
    const expiry = new Date(Date.now() + TOKEN_TTL_MS);

    await this.userRepository.update(user.id, {
      resetToken: tokenHash,
      resetTokenExpiry: expiry,
    });

    return { token: plainToken };
  }

  /**
   * Setzt das Passwort zurueck, wenn der Token gueltig ist.
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = this.sha256(token);

    // Finde User mit diesem Token-Hash (Expiry wird manuell geprueft)
    const user = await this.userRepository.findOne({
      where: {
        resetToken: tokenHash,
      },
    });

    if (!user || !user.resetTokenExpiry) {
      throw new BadRequestException('Ungültiger oder abgelaufener Reset-Token');
    }

    // Pruefe ob Token noch gueltig ist
    if (user.resetTokenExpiry.getTime() < Date.now()) {
      throw new BadRequestException('Ungültiger oder abgelaufener Reset-Token');
    }

    const passwordHash = await this.hashService.hash(newPassword);

    await this.userRepository.update(user.id, {
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
    });
  }

  /**
   * SHA256-Hash fuer Token (nicht bcrypt — bcrypt erzeugt durch Salt immer verschiedene Hashes).
   */
  private sha256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}
