import type { StatusBadge } from '@/components/workspace/ui';
import type { AppRole } from '@/lib/rbac/roles';

export type OpdSubmissionStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'RECEIVED'
  | 'IN_VERIFICATION'
  | 'NEEDS_CORRECTION'
  | 'CORRECTION_SUBMITTED'
  | 'VERIFIED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'CANCELLED';

export type OpdSubmissionModuleKey =
  | 'LAYANAN_KEPEGAWAIAN'
  | 'SIPENSIUN'
  | 'SIDATA'
  | 'DMS';

export type OpdSubmissionDocument = {
  id: string;
  submissionId: string;
  dmsDocumentId: string | null;
  documentType: string;
  title: string;
  status: string;
  note: string | null;
  uploadedById?: string;
  uploadedByRole?: string;
  originalFileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  storageKey?: string;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type OpdSubmissionAuditLog = {
  id: string;
  submissionId: string;
  action: string;
  beforeJson?: unknown;
  afterJson?: unknown;
  actorId?: string;
  actorRole?: string;
  note: string | null;
  createdAt: string;
};

export type OpdSubmission = {
  id: string;
  submissionNumber: string | null;
  opdUserId?: string;
  opdUnitId: string | null;
  opdName: string | null;
  serviceType: string;
  moduleKey: OpdSubmissionModuleKey;
  subjectName: string | null;
  subjectNip: string | null;
  title: string;
  description: string | null;
  status: OpdSubmissionStatus;
  correctionNote: string | null;
  submittedAt: string | null;
  receivedAt: string | null;
  verifiedAt: string | null;
  completedAt: string | null;
  rejectedAt: string | null;
  createdById?: string;
  updatedById?: string;
  assignedToId?: string;
  createdAt: string;
  updatedAt: string;
  documents: OpdSubmissionDocument[];
  auditLogs: OpdSubmissionAuditLog[];
};

export type OpdSubmissionSummary = {
  totalPermohonan: number;
  menungguVerifikasi: number;
  perluPerbaikan: number;
  selesai: number;
  dokumenDiunggah: number;
  usulanAktif: number;
};

export type OpdSubmissionQuery = {
  q?: string;
  status?: OpdSubmissionStatus | '';
  moduleKey?: OpdSubmissionModuleKey | '';
  serviceType?: string;
  opdUnitId?: string;
  page?: number;
  limit?: number;
};

export type CreateOpdSubmissionPayload = {
  moduleKey: OpdSubmissionModuleKey;
  serviceType: string;
  title: string;
  description?: string;
  subjectName?: string;
  subjectNip?: string;
};

export type UpdateOpdSubmissionPayload = Partial<
  Omit<CreateOpdSubmissionPayload, 'moduleKey'>
>;

export type OpdActionNotePayload = {
  note?: string;
};

export type RequestOpdCorrectionPayload = {
  note: string;
};

export type AddOpdSubmissionDocumentPayload = {
  documentType: string;
  title: string;
  dmsDocumentId?: string;
  note?: string;
  category?: string;
  subCategory?: string;
};

type StatusTone = Parameters<typeof StatusBadge>[0]['tone'];

export type OpdSubmissionDocumentStatus =
  | 'TERUNGGAH'
  | 'UPLOADED'
  | 'NEEDS_CORRECTION'
  | 'VERIFIED'
  | 'REJECTED';

export function opdSubmissionStatusLabel(status: OpdSubmissionStatus | string) {
  const labels: Record<OpdSubmissionStatus, string> = {
    DRAFT: 'Draft',
    SUBMITTED: 'Menunggu Verifikasi',
    RECEIVED: 'Diterima PPIK',
    IN_VERIFICATION: 'Dalam Verifikasi',
    NEEDS_CORRECTION: 'Perlu Perbaikan',
    CORRECTION_SUBMITTED: 'Perbaikan Dikirim',
    VERIFIED: 'Terverifikasi',
    REJECTED: 'Ditolak',
    COMPLETED: 'Selesai',
    CANCELLED: 'Dibatalkan',
  };

  return labels[status as OpdSubmissionStatus] ?? status;
}

export function opdSubmissionStatusTone(
  status: OpdSubmissionStatus | string,
): StatusTone {
  switch (status as OpdSubmissionStatus) {
    case 'COMPLETED':
    case 'VERIFIED':
      return 'success';
    case 'SUBMITTED':
    case 'RECEIVED':
    case 'IN_VERIFICATION':
    case 'CORRECTION_SUBMITTED':
      return 'warning';
    case 'NEEDS_CORRECTION':
    case 'REJECTED':
    case 'CANCELLED':
      return 'danger';
    case 'DRAFT':
    default:
      return 'neutral';
  }
}

export function canOpdEditSubmission(status: OpdSubmissionStatus | string) {
  return status === 'DRAFT' || status === 'NEEDS_CORRECTION';
}

export function canOpdSubmitCorrection(status: OpdSubmissionStatus | string) {
  return status === 'NEEDS_CORRECTION';
}

export function canOpdUploadDocument(status: OpdSubmissionStatus | string) {
  return status === 'DRAFT' || status === 'SUBMITTED' || status === 'NEEDS_CORRECTION';
}

export function opdSubmissionDocumentStatusLabel(status: string) {
  const labels: Record<OpdSubmissionDocumentStatus, string> = {
    TERUNGGAH: 'Metadata Tersimpan',
    UPLOADED: 'Terunggah',
    NEEDS_CORRECTION: 'Perlu Perbaikan',
    VERIFIED: 'Terverifikasi',
    REJECTED: 'Ditolak',
  };

  return labels[status as OpdSubmissionDocumentStatus] ?? status;
}

export function opdSubmissionDocumentStatusTone(status: string): StatusTone {
  switch (status as OpdSubmissionDocumentStatus) {
    case 'VERIFIED':
      return 'success';
    case 'UPLOADED':
    case 'TERUNGGAH':
      return 'info';
    case 'NEEDS_CORRECTION':
      return 'warning';
    case 'REJECTED':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function canInternalVerifyDocument(role: AppRole, status: string) {
  const allowedRoles: AppRole[] = [
    'SUPER_ADMIN',
    'ADMIN_BKPSDM',
    'KABID',
    'ANALIS_MUDA',
    'ANALIS_MADYA',
  ];

  return allowedRoles.includes(role) && status !== 'VERIFIED' && status !== 'REJECTED';
}
