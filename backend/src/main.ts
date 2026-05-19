import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

/** Orígenes locales que aceptamos por defecto en desarrollo (Nuxt en :3000/:3001). */
const DEV_CORS_DEFAULTS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
];

function validateEnv(config: ConfigService) {
  const logger = new Logger('Bootstrap');
  const isProd = config.get<string>('NODE_ENV') === 'production';

  const jwtSecret = config.get<string>('JWT_SECRET');
  if (!jwtSecret || jwtSecret.length < 32) {
    logger.error('JWT_SECRET debe estar definido y tener al menos 32 caracteres');
    process.exit(1);
  }

  const corsOrigin = config.get<string>('CORS_ORIGIN');
  if (isProd) {
    if (!corsOrigin || corsOrigin.trim() === '' || corsOrigin.includes('*')) {
      logger.error('En producción CORS_ORIGIN debe ser una lista explícita de orígenes (no "*")');
      process.exit(1);
    }
  }
}

function resolveCorsOrigins(config: ConfigService): string[] {
  const raw = config.get<string>('CORS_ORIGIN');
  const isProd = config.get<string>('NODE_ENV') === 'production';
  if (raw && raw.trim() !== '') {
    return raw.split(',').map((o) => o.trim()).filter(Boolean);
  }
  // En prod `validateEnv` ya aborta si no hay CORS_ORIGIN; aquí solo cubre dev.
  return isProd ? [] : DEV_CORS_DEFAULTS;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  validateEnv(config);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: resolveCorsOrigins(config),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    })
  );

  app.useGlobalFilters(new PrismaExceptionFilter());

  // Solo servimos archivos desde disco cuando el driver es local.
  // Con S3 los archivos se sirven desde el bucket, no desde el contenedor.
  const storageDriver = (config.get<string>('STORAGE_DRIVER') ?? 'local').toLowerCase();
  if (storageDriver === 'local') {
    app.useStaticAssets(join(process.cwd(), config.get<string>('UPLOADS_DIR') ?? 'uploads'), {
      prefix: '/uploads/',
    });
  }

  const port = parseInt(config.get<string>('PORT') ?? '8001', 10);
  await app.listen(port, '0.0.0.0');
  console.log(`Tu Cancha API escuchando en http://localhost:${port}/api`);
}
bootstrap();
