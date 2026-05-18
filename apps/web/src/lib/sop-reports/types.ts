// ─── Period type ──────────────────────────────────────────────────────────────

export type SopReportPeriodType = 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';
export type SopReportFormat = 'JSON' | 'HTML' | 'PRINT';
export type SopReportType = 'EXECUTIVE' | 'EVIDENCE_PACKAGE' | 'SUMMARY_PRINT';

// ─── Query params ─────────────────────────────────────────────────────────────

export interface SopReportQuery {
  moduleKey?: string;
  sopCode?: string;
  from?: string;
  to?: string;
  periodType?: SopReportPeriodType;
  format?: SopReportFormat;
}

export interface SopExportLogPayload {
  reportType: SopReportType;
  moduleKey?: string;
  sopCode?: string;
  format?: SopReportFormat;
}

// ─── Evidence document ────────────────────────────────────────────────────────

export interface SopEvidenceDocument {
  id: string;
  title: string;
  category: string;
  subCategory: string | null;
  accessLevel: string;
  uploadedAt: string;
  linkedChecklistItemId: string;
}

// ─── Evidence package ─────────────────────────────────────────────────────────

export interface SopEvidencePackageBySop {
  sopCode: string;
  title: string;
  moduleKey: string;
  relatedRhkCodes: string[];
  evidenceCompletenessPercent: number;
  evidenceDocuments: SopEvidenceDocument[];
  missingEvidenceItems: string[];
}

export interface SopEvidencePackage {
  periodLabel: string;
  totalSop: number;
  totalEvidence: number;
  bySop: SopEvidencePackageBySop[];
}

// ─── Compliance row ───────────────────────────────────────────────────────────

export interface SopReportComplianceRow {
  sopCode: string;
  moduleKey: string;
  score: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  checklistScore: number;
  approvalScore: number;
  evidenceScore: number;
  governanceScore: number;
  timelinessScore: number;
  totalInstances: number;
  approvedInstances: number;
  totalItems: number;
  evidenceItems: number;
  isOverdue: boolean;
}

// ─── Executive report ─────────────────────────────────────────────────────────

export interface SopExecutiveReport {
  periodLabel: string;
  generatedAt: string;
  generatedByRole: string;
  overallScore: number;
  totalSops: number;
  riskDistribution: { LOW: number; MEDIUM: number; HIGH: number; CRITICAL: number };
  complianceSummary: {
    averageScore: number;
    lowRisk: number;
    mediumRisk: number;
    highRisk: number;
    criticalRisk: number;
    fullyApproved: number;
    overdueCount: number;
  };
  topRisks: Array<{ sopCode: string; moduleKey: string; score: number; riskLevel: string; reasons: string[] }>;
  byModule: Array<{ moduleKey: string; averageScore: number; total: number; criticalCount: number }>;
  bySop: SopReportComplianceRow[];
  governanceSummary: {
    total: number;
    active: number;
    draft: number;
    needsReview: number;
    revision: number;
    archived: number;
  };
  reviewSummary: {
    dueSoon: number;
    overdue: number;
    needsReview: number;
    openReminders: number;
  };
  recommendedActions: string[];
  conclusion: string;
}

// ─── Print section/signature ──────────────────────────────────────────────────

export interface SopReportSection {
  title: string;
  description: string;
  type: string;
  rows: unknown[];
}

export interface SopReportSignature {
  roleLabel: string;
  namePlaceholder: string;
  nipPlaceholder: string;
}

export interface SopPrintSummary {
  header: {
    organization: string;
    reportTitle: string;
    period: string;
  };
  generatedAt: string;
  sections: SopReportSection[];
  signatures: SopReportSignature[];
}

// ─── Helper ───────────────────────────────────────────────────────────────────

export function formatPeriodLabel(periodType: SopReportPeriodType, from?: string, to?: string): string {
  const now = new Date();
  if (periodType === 'MONTHLY') {
    return now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  }
  if (periodType === 'QUARTERLY') {
    const q = Math.ceil((now.getMonth() + 1) / 3);
    return `Triwulan ${q} ${now.getFullYear()}`;
  }
  if (periodType === 'CUSTOM' && from && to) {
    const f = new Date(from).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const t = new Date(to).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    return `${f} – ${t}`;
  }
  return `Tahun ${now.getFullYear()}`;
}
