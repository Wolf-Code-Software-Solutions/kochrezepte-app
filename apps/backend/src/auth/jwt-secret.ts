import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';

let ephemeralJwtSecret: string | undefined;
let warnedAboutEphemeralSecret = false;

export function getJwtSecret(config: ConfigService): string {
  const configuredSecret = config.get<string>('JWT_SECRET');
  if (configuredSecret) {
    return configuredSecret;
  }

  if (config.get<string>('NODE_ENV') === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }

  if (!ephemeralJwtSecret) {
    ephemeralJwtSecret = randomBytes(32).toString('base64url');
  }

  if (!warnedAboutEphemeralSecret) {
    warnedAboutEphemeralSecret = true;
    console.warn(
      'JWT_SECRET is not set. Using an ephemeral local JWT secret for this process.',
    );
  }

  return ephemeralJwtSecret;
}
