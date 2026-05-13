import type { DmsDocumentStatus } from '@/lib/api/dms';

type StatusArg = DmsDocumentStatus | string | null | undefined;
type FileArg = { fileName?: string | null };

export function canSubmitDocument(status: StatusArg): boolean {
  return status === 'UPLOADED' || status === 'REJECTED';
}

export function canVerifyDocument(status: StatusArg): boolean {
  return status === 'SUBMITTED';
}

export function canRejectDocument(status: StatusArg): boolean {
  return status === 'SUBMITTED';
}

export function canArchiveDocument(status: StatusArg): boolean {
  return status === 'VERIFIED';
}

export function canDeleteDocument(status: StatusArg): boolean {
  return status !== 'VERIFIED' && status !== 'ARCHIVED';
}

export function canDownloadDocument(document: FileArg): boolean {
  return !!document.fileName;
}
