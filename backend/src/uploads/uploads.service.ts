import { Inject, Injectable } from '@nestjs/common';
import { STORAGE_DRIVER, StorageDriver } from './storage.driver';

@Injectable()
export class UploadsService {
  constructor(
    @Inject(STORAGE_DRIVER) private readonly storage: StorageDriver,
  ) {}

  async upload(file: Express.Multer.File) {
    return this.storage.save({
      buffer: file.buffer,
      mimetype: file.mimetype,
    });
  }
}
