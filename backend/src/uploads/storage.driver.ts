export const STORAGE_DRIVER = Symbol('STORAGE_DRIVER');

export const ALLOWED_UPLOAD_MIME = ['image/png', 'image/jpeg', 'application/pdf'] as const;
export type AllowedUploadMime = (typeof ALLOWED_UPLOAD_MIME)[number];

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export interface UploadInput {
  buffer: Buffer;
  mimetype: string;
}

export interface SavedFile {
  /** Clave/nombre con el que quedó guardado el archivo. */
  key: string;
  /** URL pública para servir el archivo. */
  url: string;
}

/**
 * Abstracción de almacenamiento. La app no sabe si el archivo va a disco o a S3:
 * inyecta este contrato y `UploadsModule` decide la implementación por `STORAGE_DRIVER` env.
 */
export interface StorageDriver {
  save(file: UploadInput): Promise<SavedFile>;
}

const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'application/pdf': 'pdf',
};

export function extForMime(mimetype: string): string {
  return EXT_BY_MIME[mimetype] ?? 'bin';
}
