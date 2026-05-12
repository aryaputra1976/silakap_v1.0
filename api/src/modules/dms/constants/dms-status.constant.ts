import { DmsDocumentStatus } from '@prisma/client';

export const DMS_DOCUMENT_STATUSES = [
  DmsDocumentStatus.DRAFT,
  DmsDocumentStatus.UPLOADED,
  DmsDocumentStatus.SUBMITTED,
  DmsDocumentStatus.VERIFIED,
  DmsDocumentStatus.REJECTED,
  DmsDocumentStatus.ARCHIVED,
] as const;

export const DMS_EDITABLE_STATUSES = [
  DmsDocumentStatus.DRAFT,
  DmsDocumentStatus.UPLOADED,
  DmsDocumentStatus.REJECTED,
] as const;

export const DMS_FINAL_STATUSES = [
  DmsDocumentStatus.VERIFIED,
  DmsDocumentStatus.ARCHIVED,
] as const;

export const DMS_DELETABLE_STATUSES = [
  DmsDocumentStatus.DRAFT,
  DmsDocumentStatus.UPLOADED,
  DmsDocumentStatus.SUBMITTED,
  DmsDocumentStatus.REJECTED,
] as const;

export function isDmsDocumentStatus(value: unknown): value is DmsDocumentStatus {
  return (
    typeof value === 'string' &&
    DMS_DOCUMENT_STATUSES.includes(value as DmsDocumentStatus)
  );
}

export function isDmsEditableStatus(status: DmsDocumentStatus): boolean {
  return (DMS_EDITABLE_STATUSES as readonly DmsDocumentStatus[]).includes(status);
}

export function isDmsFinalStatus(status: DmsDocumentStatus): boolean {
  return (DMS_FINAL_STATUSES as readonly DmsDocumentStatus[]).includes(status);
}

export function isDmsDeletableStatus(status: DmsDocumentStatus): boolean {
  return (DMS_DELETABLE_STATUSES as readonly DmsDocumentStatus[]).includes(status);
}
