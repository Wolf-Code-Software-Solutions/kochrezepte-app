import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { SeedingService } from './seeding.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [SeedingService],
  exports: [TypeOrmModule],
})
export class UserModule {}
