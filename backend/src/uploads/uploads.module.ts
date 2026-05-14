import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LocalStorageDriver } from './local-storage.driver';
import { S3StorageDriver } from './s3-storage.driver';
import { STORAGE_DRIVER } from './storage.driver';

/**
 * Decide la implementación de `StorageDriver` según `STORAGE_DRIVER` env.
 * Driver-pattern en vez de inyectar `S3Client` directo: la app depende del
 * contrato `StorageDriver`, no de un proveedor concreto, así dev usa disco y
 * prod usa S3 sin tocar `bookings.service`.
 */
@Global()
@Module({
  providers: [
    {
      provide: STORAGE_DRIVER,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const driver = (config.get<string>('STORAGE_DRIVER') ?? 'local').toLowerCase();
        const logger = new Logger('UploadsModule');
        switch (driver) {
          case 's3':
            logger.log('Almacenamiento: S3');
            return new S3StorageDriver(config);
          case 'local':
            logger.log('Almacenamiento: disco local');
            return new LocalStorageDriver(config);
          default:
            throw new Error(`STORAGE_DRIVER inválido: "${driver}" (usa "local" o "s3")`);
        }
      },
    },
  ],
  exports: [STORAGE_DRIVER],
})
export class UploadsModule {}
