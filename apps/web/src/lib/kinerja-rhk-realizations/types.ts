export type KinerjaRhkRealizationStatus = 'DRAFT' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
export type KinerjaRhkPeriodType = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export type KinerjaRhkRealizationAudit = {
  id: string;
  realizationId: string;
  action: string;
  beforeJson: unknown;
  afterJson: unknown;
  actorId: string | null;
  actorRole: string | null;
  note: string | null;
  createdAt: string;
};

export type KinerjaRhkRealization = {
  id: string;
  candidateId: string | null;
  rhkCode: string;
  rhkTitle: string | null;
  moduleKey: string;
  periodYear: number;
  periodMonth: number | null;
  periodQuarter: number | null;
  periodType: KinerjaRhkPeriodType;
  quantityValue: number | null;
  qualityScore: number | null;
  timeScore: number | null;
  evidenceScore: number | null;
  complianceScore: number | null;
  finalScore: number | null;
  status: KinerjaRhkRealizationStatus;
  sourceType: string | null;
  sourceId: string | null;
  submissionNumber: string | null;
  sopCode: string | null;
  title: string;
  description: string | null;
  evidenceSnapshotJson: unknown;
  approvedById: string | null;
  approvedAt: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  auditLogs: KinerjaRhkRealizationAudit[];
};

export type KinerjaRhkRealizationQuery = {
  rhkCode?: string;
  moduleKey?: string;
  periodYear?: number | string;
  periodMonth?: number | string;
  periodQuarter?: number | string;
  periodType?: KinerjaRhkPeriodType | '';
  status?: KinerjaRhkRealizationStatus | '';
  page?: number;
  limit?: number;
};

export type KinerjaRhkRealizationSummaryGroup = {
  rhkCode?: string;
  moduleKey?: string;
  periodYear?: number;
  periodMonth?: number | null;
  periodQuarter?: number | null;
  periodType?: string;
  total: number;
  totalQuantity?: number;
  averageFinalScore: number;
};

export type KinerjaRhkRealizationSummary = {
  totalRealizations: number;
  totalQuantity: number;
  averageQuality: number;
  averageTimeScore: number;
  averageEvidenceScore: number;
  averageFinalScore: number;
  byRhk: KinerjaRhkRealizationSummaryGroup[];
  byModule: KinerjaRhkRealizationSummaryGroup[];
  byPeriod: KinerjaRhkRealizationSummaryGroup[];
  topIssues: Array<{ title: string; note: string }>;
};

export type KinerjaRhkReportAchievement = {
  id: string;
  rhkCode: string;
  title: string;
  moduleKey: string;
  quantityValue: number;
  finalScore: number;
  evidenceScore: number;
  sopCode: string | null;
  sourceId: string | null;
};

export type KinerjaRhkMonthlyReport = {
  periodLabel: string;
  totalRhk: number;
  totalRealizations: number;
  totalQuantity: number;
  averageFinalScore: number;
  achievements: KinerjaRhkReportAchievement[];
  issues: Array<{ realizationId: string; title: string; note: string }>;
  evidenceSummary: {
    totalSnapshot: number;
    averageEvidenceScore: number;
  };
  recommendedFollowUp: string[];
  narrativeSummary: string;
  generatedAt: string;
};

export type KinerjaRhkQuarterlyReport = {
  quarterLabel: string;
  monthlyBreakdown: Array<{
    periodMonth: number;
    label: string;
    totalRealizations: number;
    averageFinalScore: number;
  }>;
  strategicSummary: string;
  trendNotes: string;
  highRiskNotes: string;
  leadershipRecommendation: string;
  generatedAt: string;
};

export type KinerjaRhkPrintSummary = {
  title: string;
  periodLabel: string;
  totalRhk: number;
  totalRealizations: number;
  averageFinalScore: number;
  narrativeSummary: string;
  achievements: KinerjaRhkReportAchievement[];
  issues: Array<{ realizationId: string; title: string; note: string }>;
  recommendedFollowUp: string[];
  generatedAt: string;
};

export type CreateRhkRealizationFromCandidatePayload = {
  periodType?: KinerjaRhkPeriodType;
  periodYear?: number;
  periodMonth?: number;
  periodQuarter?: number;
  note?: string;
};

export type ArchiveRhkRealizationPayload = {
  note?: string;
};

export function rhkRealizationStatusLabel(status: KinerjaRhkRealizationStatus | string): string {
  const labels: Record<KinerjaRhkRealizationStatus, string> = {
    DRAFT: 'Draft',
    APPROVED: 'Disetujui',
    REJECTED: 'Ditolak',
    ARCHIVED: 'Diarsipkan',
  };
  return labels[status as KinerjaRhkRealizationStatus] ?? status;
}

export function rhkPeriodTypeLabel(periodType: KinerjaRhkPeriodType | string): string {
  const labels: Record<KinerjaRhkPeriodType, string> = {
    MONTHLY: 'Bulanan',
    QUARTERLY: 'Triwulan',
    YEARLY: 'Tahunan',
  };
  return labels[periodType as KinerjaRhkPeriodType] ?? periodType;
}

export function rhkRealizationStatusTone(
  status: KinerjaRhkRealizationStatus | string,
): 'success' | 'warning' | 'danger' | 'neutral' | 'info' {
  switch (status as KinerjaRhkRealizationStatus) {
    case 'APPROVED':
      return 'success';
    case 'REJECTED':
      return 'danger';
    case 'DRAFT':
      return 'warning';
    case 'ARCHIVED':
      return 'neutral';
    default:
      return 'neutral';
  }
}

export function formatRealizationScore(score: number | null | undefined): string {
  return score == null ? '-' : `${score}%`;
}

export function formatRhkPeriod(item: {
  periodType: KinerjaRhkPeriodType | string;
  periodYear: number;
  periodMonth: number | null;
  periodQuarter: number | null;
}): string {
  if (item.periodType === 'MONTHLY' && item.periodMonth) {
    return `${monthLabel(item.periodMonth)} ${item.periodYear}`;
  }
  if (item.periodType === 'QUARTERLY' && item.periodQuarter) {
    return `Triwulan ${item.periodQuarter} ${item.periodYear}`;
  }
  return String(item.periodYear);
}

function monthLabel(month: number): string {
  return new Date(2026, month - 1, 1).toLocaleString('id-ID', { month: 'short' });
}
