import type { OpdSubmissionRecord } from './opd-submission.repository';
import {
  assessRequiredDocuments,
  type RequiredDocumentAssessment,
} from './opd-service-catalog.policy';

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
  requiredDocuments: RequiredDocumentAssessment;
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

  const requiredDocuments = assessRequiredDocuments(
    submission.serviceType,
    submission.documents.map((document) => ({
      documentType: document.documentType,
      status: document.status,
    })),
  );

  const slaStatus = submission.slaStatus ?? 'NOT_STARTED';
  const isOnTime = slaStatus !== 'OVERDUE';

  if (rejected > 0) {
    reasons.push(`${rejected} dokumen ditolak — perlu perbaikan sebelum diselesaikan.`);
  }

  if (total > 0 && verified === 0) {
    reasons.push('Belum ada dokumen yang terverifikasi.');
  }

  if (total === 0 && requiredDocuments.required.length > 0) {
    reasons.push('Belum ada dokumen syarat yang diunggah.');
  }

  reasons.push(...requiredDocuments.reasons);

  const uniqueReasons = [...new Set(reasons)];
  const requiresOverride = uniqueReasons.length > 0;
  const canComplete = uniqueReasons.length === 0;

  return {
    canComplete,
    requiresOverride,
    reasons: uniqueReasons,
    evidenceStatus: { total, verified, rejected, pending },
    requiredDocuments,
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

  const requiredDocuments = assessRequiredDocuments(
    submission.serviceType,
    submission.documents.map((document) => ({
      documentType: document.documentType,
      status: document.status,
    })),
  );

  const requiredTotal = requiredDocuments.required.length;
  const requiredVerified = requiredDocuments.verified.length;

  const evidenceScore =
    requiredTotal > 0
      ? Math.round((requiredVerified / requiredTotal) * 100)
      : total > 0
        ? Math.round((verified / total) * 100)
        : 0;

  const slaStatus = submission.slaStatus ?? 'NOT_STARTED';
  const timeScore = slaStatus === 'OVERDUE' ? 70 : 100;
  const qualityScore = Math.min(100, Math.max(0, Math.round(checklistCompletePercent)));
  const overallScore = Math.round(
    qualityScore * 0.4 + timeScore * 0.3 + evidenceScore * 0.3,
  );

  return { qualityScore, timeScore, evidenceScore, overallScore };
}