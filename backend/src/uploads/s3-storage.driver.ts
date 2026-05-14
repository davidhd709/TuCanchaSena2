import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { extForMime, SavedFile, StorageDriver, UploadInput } from './storage.driver';

@Injectable()
export class S3StorageDriver implements StorageDriver {
  private readonly logger = new Logger(S3StorageDriver.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBase: string;
  private readonly prefix: string;

  constructor(config: ConfigService) {
    const region = config.get<string>('S3_REGION');
    const bucket = config.get<string>('S3_BUCKET');
    if (!region || !bucket) {
      throw new InternalServerErrorException(
        'STORAGE_DRIVER=s3 requiere S3_REGION y S3_BUCKET configurados'
      );
    }
    this.bucket = bucket;
    this.prefix = config.get<string>('S3_PREFIX') ?? 'payment-proofs';
    // Si S3_PUBLIC_BASE no se define, se arma la URL estándar del bucket.
    this.publicBase =
      config.get<string>('S3_PUBLIC_BASE') ?? `https://${bucket}.s3.${region}.amazonaws.com`;
    this.client = new S3Client({ region });
  }

  async save(file: UploadInput): Promise<SavedFile> {
    const key = `${this.prefix}/${randomUUID()}.${extForMime(file.mimetype)}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );
    this.logger.debug(`Archivo subido a S3: ${key}`);
    return { key, url: `${this.publicBase}/${key}` };
  }
}
