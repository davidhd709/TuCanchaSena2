import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: (config.get<string>('CORS_ORIGIN') ?? 'http://localhost:3000').split(','),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    })
  );

  app.useStaticAssets(join(process.cwd(), config.get<string>('UPLOADS_DIR') ?? 'uploads'), {
    prefix: '/uploads/',
  });

  const port = parseInt(config.get<string>('PORT') ?? '8001', 10);
  await app.listen(port, '0.0.0.0');
  console.log(`Tu Cancha API escuchando en http://localhost:${port}/api`);
}
bootstrap();
