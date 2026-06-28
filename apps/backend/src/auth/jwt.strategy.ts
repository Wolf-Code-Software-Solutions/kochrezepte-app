import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';

interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    let jwtSecret = config.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      const nodeEnv = config.get<string>('NODE_ENV') || process.env.NODE_ENV;
      if (nodeEnv === 'production') {
        throw new Error(
          'JWT_SECRET environment variable is missing in production!',
        );
      }
      console.warn(
        'WARNING: JWT_SECRET is not configured. Generating an ephemeral secret for development/testing.',
      );
      jwtSecret = randomBytes(32).toString('hex');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  validate(payload: JwtPayload) {
    return { userId: payload.sub, email: payload.email };
  }
}
