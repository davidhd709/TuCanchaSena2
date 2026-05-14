import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { extForMime, SavedFile, StorageDriver, UploadInput } from './storage.driver';

@Injectable()
export class LocalStorageDriver implements StorageDriver {
  private readonly logger = new Logger(LocalStorageDriver.name);
  private readonly dir: string;
  private readonly publicBase: string;

  constructor(config: ConfigService) {
    this.dir = join(process.cwd(), config.get<string>('UPLOADS_DIR') ?? 'uploads');
    this.publicBase = config.get<string>('PUBLIC_BASE_URL') ?? '';
  }

  async save(file: UploadInput): Promise<SavedFile> {
    const key = `${randomUUID()}.${extForMime(file.mimetype)}`;
    await mkdir(this.dir, { recursive: true });
    await writeFile(join(this.dir, key), file.buffer);
    this.logger.debug(`Archivo guardado en disco: ${key}`);
    return { key, url: `${this.publicBase}/uploads/${key}` };
  }
}
