export type RhkCandidateStatus = 'CANDIDATE' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';

export type KinerjaRhkCandidateAudit = {
  id: string;
  candidateId: string;
  action: string;
  actorId: string | null;
  actorRole: string | null;
  note: string | null;
  beforeJson: unknown;
  afterJson: unknown;
  createdAt: string;
};

export type KinerjaRhkCandidate = {
  id: string;
  opdSubmissionId: string;
  rhkCode: string | null;
  sopCode: string | null;
  moduleKey: string;
  serviceType: string;
  title: string;
  opdName: string | null;
  subjectName: string | null;
  subjectNip: string | null;
  status: RhkCandidateStatus;

  qualityScore: number | null;
  timeScore: number | null;
  evidenceScore: number | null;
  overallScore: number | null;

  slaStatus: string | null;
  slaElapsedHours: number | null;
  completedAt: string | null;

  approvedById: string | null;
  approvedByRole: string | null;
  approvedAt: string | null;
  approvalNote: string | null;

  rejectedById: string | null;
  rejectedByRole: string | null;
  rejectedAt: string | null;
  rejectionNote: string | null;

  createdById: string | null;
  createdAt: string;
  updatedAt: string;

  auditLogs: KinerjaRhkCandidateAudit[];
};

export type KinerjaRhkCandidateSummary = {
  total: number;
  candidate: number;
  approved: number;
  rejected: number;
  archived: number;
};

export type KinerjaRhkCandidateQuery = {
  q?: string;
  status?: RhkCandidateStatus | '';
  rhkCode?: string;
  sopCode?: string;
  moduleKey?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

export type RhkCandidateActionPayload = {
  note?: string;
};

export type RhkCandidateRejectPayload = {
  note: string;
};

export function rhkCandidateStatusLabel(status: RhkCandidateStatus | string): string {
  const labels: Record<RhkCandidateStatus, string> = {
    CANDIDATE: 'Menunggu Validasi',
    APPROVED: 'Disetujui',
    REJECTED: 'Ditolak',
    ARCHIVED: 'Diarsipkan',
  };

  return labels[status as RhkCandidateStatus] ?? status;
}

export function rhkCandidateStatusTone(
  status: RhkCandidateStatus | string,
): 'success' | 'warning' | 'danger' | 'neutral' | 'info' {
  switch (status as RhkCandidateStatus) {
    case 'APPROVED':
      return 'success';
    case 'CANDIDATE':
      return 'warning';
    case 'REJECTED':
      return 'danger';
    case 'ARCHIVED':
      return 'neutral';
    default:
      return 'neutral';
  }
}

export function formatScore(score: number | null | undefined): string {
  if (score == null) return '-';
  return `${score}%`;
}
