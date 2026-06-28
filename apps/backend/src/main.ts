import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';

async function bootstrap() {
  await ConfigModule.forRoot({ isGlobal: true });
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Security: Helmet - HTTP security headers
  app.use(helmet());

  // Security: CORS configuration
  const configService = app.get(ConfigService);
  const allowedOrigins = (configService.get<string>('CORS_ORIGINS') || 'http://localhost:5173').split(',');
  app.enableCors({ origin: allowedOrigins, credentials: true });

  // Trust proxy for security headers behind reverse proxies
  app.set('trust proxy', 1);

  const port = configService.get<number>('PORT') || 4000;
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}`);
}
bootstrap();
