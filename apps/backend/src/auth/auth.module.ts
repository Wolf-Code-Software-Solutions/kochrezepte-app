import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../user/user.entity';
import { AuthLoginController } from './auth-login.controller';
import { AuthLoginService } from './auth-login.service';
import { HashService } from './hash.service';
import { getJwtSecret } from './jwt-secret';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([UserEntity]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: getJwtSecret(config),
        signOptions: { algorithm: 'HS256', expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [AuthLoginController],
  providers: [HashService, JwtStrategy, AuthLoginService],
  exports: [HashService, JwtModule, JwtStrategy, AuthLoginService],
})
export class AuthModule {}
