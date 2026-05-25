import { BadRequestException } from '@nestjs/common';

export const DMS_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const DMS_ALLOWED_MIME_EXTENSIONS = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
} as const;

export type DmsAllowedMimeType = keyof typeof DMS_ALLOWED_MIME_EXTENSIONS;

/**
 * Validates file size and MIME type for DMS uploads.
 * Returns the file extension on success, throws BadRequestException on failure.
 */
export function validateDmsFile(file: {
  size: number;
  mimetype: string;
}): string {
  if (file.size > DMS_MAX_FILE_SIZE) {
    throw new BadRequestException('Ukuran file maksimal 10 MB');
  }

  const ext = DMS_ALLOWED_MIME_EXTENSIONS[file.mimetype as DmsAllowedMimeType];
  if (!ext) {
    throw new BadRequestException(
      'Tipe file tidak didukung. Gunakan PDF, JPG, PNG, DOCX, atau XLSX',
    );
  }

  return ext;
}
