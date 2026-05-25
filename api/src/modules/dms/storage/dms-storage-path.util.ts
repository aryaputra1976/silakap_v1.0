import { BadRequestException } from '@nestjs/common';
import { extname, isAbsolute, relative, resolve } from 'path';

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.docx', '.xlsx'];

export interface DmsPathParams {
  documentId: string;
  unitKerjaId: string | null;
  periodYear: number | null;
  category: string;
  storedFileName: string;
}

/**
 * Builds a relative storage path structured by unit / year / category.
 * Example: uploads/dms/{unitKerjaId}/2025/skp/{documentId}-{filename}.pdf
 */
export function buildDmsStoragePath(params: DmsPathParams): string {
  const unitSegment = params.unitKerjaId ?? '_shared';
  const yearSegment = params.periodYear != null ? String(params.periodYear) : '_unknown';
  const categorySegment = params.category.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  return [
    'uploads',
    'dms',
    unitSegment,
    yearSegment,
    categorySegment,
    `${params.documentId}-${params.storedFileName}`,
  ].join('/');
}

export function getDmsUploadRoot(): string {
  return resolve(process.cwd(), 'uploads');
}

/**
 * Resolves a relative DMS storage path to an absolute path,
 * validating against path traversal and disallowed extensions.
 */
export function resolveSafeDmsPath(relativePath: string): string {
  if (isAbsolute(relativePath)) {
    throw new BadRequestException('Path dokumen tidak valid');
  }

  const uploadRoot = getDmsUploadRoot();
  const absolutePath = resolve(process.cwd(), relativePath);
  const rel = relative(uploadRoot, absolutePath);

  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new BadRequestException('Path dokumen tidak valid');
  }

  const ext = extname(absolutePath).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new BadRequestException('Ekstensi dokumen tidak valid');
  }

  return absolutePath;
}
