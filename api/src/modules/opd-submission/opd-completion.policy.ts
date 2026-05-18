import type { OpdSubmissionRecord } from './opd-submission.repository';

export type CompletionReadiness = {
  canComplete: boolean;
  requiresOverride: boolean;
  reasons: string[];
  evidenceStatus: {
    total: number;
    verified: number;
    rejected: number;
    pending: number;
  };
  slaStatus: string;
  isOnTime: boolean;
};

export type CompletionScores = {
  qualityScore: number;
  timeScore: number;
  evidenceScore: number;
  overallScore: number;
};

export function assessCompletionReadiness(
  submission: OpdSubmissionRecord,
): CompletionReadiness {
  const reasons: string[] = [];

  const total = submission.documents.length;
  const verified = submission.documents.filter((d) => d.status === 'VERIFIED').length;
  const rejected = submission.documents.filter((d) => d.status === 'REJECTED').length;
  const pending = total - verified - rejected;

  const slaStatus = submission.slaStatus ?? 'NOT_STARTED';
  const isOnTime = slaStatus !== 'OVERDUE';

  if (rejected > 0) {
    reasons.push(`${rejected} dokumen ditolak — perlu perbaikan sebelum diselesaikan.`);
  }

  if (total > 0 && verified === 0) {
    reasons.push('Belum ada dokumen yang terverifikasi.');
  }

  const requiresOverride = reasons.length > 0;
  const canComplete = reasons.length === 0;

  return {
    canComplete,
    requiresOverride,
    reasons,
    evidenceStatus: { total, verified, rejected, pending },
    slaStatus,
    isOnTime,
  };
}

export function calculateCompletionScores(
  submission: OpdSubmissionRecord,
  checklistCompletePercent = 0,
): CompletionScores {
  const total = submission.documents.length;
  const verified = submission.documents.filter((d) => d.status === 'VERIFIED').length;

  const evidenceScore = total > 0 ? Math.round((verified / total) * 100) : 0;
  const slaStatus = submission.slaStatus ?? 'NOT_STARTED';
  const timeScore = slaStatus === 'OVERDUE' ? 70 : 100;
  const qualityScore = Math.min(100, Math.max(0, Math.round(checklistCompletePercent)));
  const overallScore = Math.round(qualityScore * 0.4 + timeScore * 0.3 + evidenceScore * 0.3);

  return { qualityScore, timeScore, evidenceScore, overallScore };
}
