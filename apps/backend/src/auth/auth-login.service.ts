import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { HashService } from './hash.service';
import { LoginResponseDto } from './dto/login-response.dto';

@Injectable()
export class AuthLoginService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly hashService: HashService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string): Promise<LoginResponseDto> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Ungültige Zugangsdaten');
    }

    const passwordMatches = await this.hashService.compare(
      password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Ungültige Zugangsdaten');
    }

    return {
      access_token: await this.jwtService.signAsync({
        sub: user.id,
        email: user.email,
      }),
    };
  }
}
