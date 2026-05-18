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

export type OpdSubmissionSlaStatus =
  | 'NOT_STARTED'
  | 'ON_TRACK'
  | 'DUE_SOON'
  | 'OVERDUE'
  | 'PAUSED_FOR_CORRECTION'
  | 'COMPLETED'
  | 'CANCELLED';

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

export type OpdSubmissionTimelineItem = {
  id: string;
  submissionId: string;
  fromStatus: string | null;
  toStatus: string;
  action: string;
  actorId?: string;
  actorRole?: string;
  note?: string;
  publicNote: string | null;
  isVisibleToOpd: boolean;
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
  slaStartedAt: string | null;
  slaPausedAt: string | null;
  slaResumedAt: string | null;
  slaStoppedAt: string | null;
  slaDueAt: string | null;
  slaTargetHours: number | null;
  slaElapsedHours: number;
  slaPausedHours: number;
  slaStatus: OpdSubmissionSlaStatus;
  lastStatusChangedAt: string | null;
  lastStatusChangedById?: string;
  createdById?: string;
  updatedById?: string;
  assignedToId?: string;
  createdAt: string;
  updatedAt: string;
  documents: OpdSubmissionDocument[];
  auditLogs: OpdSubmissionAuditLog[];
  timelines: OpdSubmissionTimelineItem[];
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
  slaStatus?: OpdSubmissionSlaStatus | '';
  moduleKey?: OpdSubmissionModuleKey | '';
  serviceType?: string;
  opdUnitId?: string;
  from?: string;
  to?: string;
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

export type OpdSubmissionSlaByModule = {
  moduleKey: string;
  total: number;
  overdue: number;
  dueSoon: number;
};

export type OpdSubmissionSlaQueueItem = {
  id: string;
  submissionNumber: string | null;
  opdName: string | null;
  moduleKey: string;
  serviceType: string;
  title: string;
  status: OpdSubmissionStatus | string;
  slaStatus: OpdSubmissionSlaStatus;
  slaDueAt: string | null;
  slaTargetHours: number | null;
  slaElapsedHours: number;
};

export type OpdSubmissionSlaSummary = {
  totalActive: number;
  onTrack: number;
  dueSoon: number;
  overdue: number;
  pausedForCorrection: number;
  completed: number;
  averageElapsedHours: number;
  byModule: OpdSubmissionSlaByModule[];
  topOverdue: OpdSubmissionSlaQueueItem[];
};

export type OpdSubmissionSlaQueue = {
  items: OpdSubmissionSlaQueueItem[];
  total: number;
};

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

export function opdSubmissionSlaStatusLabel(
  status: OpdSubmissionSlaStatus | string,
) {
  const labels: Record<OpdSubmissionSlaStatus, string> = {
    NOT_STARTED: 'Belum Mulai',
    ON_TRACK: 'Aman',
    DUE_SOON: 'Mendekati Tenggat',
    OVERDUE: 'Terlambat',
    PAUSED_FOR_CORRECTION: 'Dijeda untuk Perbaikan',
    COMPLETED: 'Selesai',
    CANCELLED: 'Dibatalkan',
  };

  return labels[status as OpdSubmissionSlaStatus] ?? status;
}

export function getSlaRiskTone(status: OpdSubmissionSlaStatus | string): StatusTone {
  switch (status as OpdSubmissionSlaStatus) {
    case 'ON_TRACK':
    case 'COMPLETED':
      return 'success';
    case 'DUE_SOON':
    case 'PAUSED_FOR_CORRECTION':
      return 'warning';
    case 'OVERDUE':
    case 'CANCELLED':
      return 'danger';
    case 'NOT_STARTED':
    default:
      return 'neutral';
  }
}

export function formatSlaRemaining(
  dueAt: string | null | undefined,
  status: OpdSubmissionSlaStatus | string,
) {
  if (!dueAt) {
    return '-';
  }

  if (status === 'PAUSED_FOR_CORRECTION') {
    return 'SLA dijeda';
  }

  if (status === 'COMPLETED' || status === 'CANCELLED') {
    return 'SLA berhenti';
  }

  const diffMs = new Date(dueAt).getTime() - Date.now();
  const absHours = Math.ceil(Math.abs(diffMs) / (60 * 60 * 1000));
  const days = Math.floor(absHours / 24);
  const hours = absHours % 24;
  const label = days > 0 ? `${days} hari ${hours} jam` : `${hours} jam`;

  return diffMs < 0 ? `Lewat ${label}` : `Sisa ${label}`;
}
