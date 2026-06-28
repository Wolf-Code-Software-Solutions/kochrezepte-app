import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from './user.entity';

@Injectable()
export class SeedingService implements OnModuleInit {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedDemoUser();
  }

  async seedDemoUser(): Promise<void> {
    const demoEmail = 'demo@koch.de';
    const demoPassword = 'password123';

    const existing = await this.userRepository.findOne({ where: { email: demoEmail } });
    if (existing) {
      return; // Demo-User existiert bereits
    }

    const hashedPassword = await bcrypt.hash(demoPassword, 10);

    const user = this.userRepository.create({
      email: demoEmail,
      passwordHash: hashedPassword,
      name: 'Demo User',
    });

    await this.userRepository.save(user);
  }
}
