import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): any => ({
        type: 'better-sqlite3',
        database: configService.get<string>('DATABASE_PATH', ':memory:'),
        synchronize: true,
        logging: false,
      }),
    }),
  ],
})
export class DatabaseModule {}
