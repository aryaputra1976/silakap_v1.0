// ─── Risk level ───────────────────────────────────────────────────────────────

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export function riskLevelLabel(level: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    LOW: 'Rendah',
    MEDIUM: 'Sedang',
    HIGH: 'Tinggi',
    CRITICAL: 'Kritis',
  };
  return map[level];
}

export function riskLevelTone(level: RiskLevel): 'success' | 'warning' | 'danger' | 'neutral' {
  const map: Record<RiskLevel, 'success' | 'warning' | 'danger' | 'neutral'> = {
    LOW: 'success',
    MEDIUM: 'warning',
    HIGH: 'danger',
    CRITICAL: 'danger',
  };
  return map[level];
}

// ─── Compliance by SOP ────────────────────────────────────────────────────────

export interface ComplianceBySopRow {
  sopCode: string;
  moduleKey: string;
  score: number;
  riskLevel: RiskLevel;
  checklistScore: number;
  approvalScore: number;
  evidenceScore: number;
  governanceScore: number;
  timelinessScore: number;
  totalInstances: number;
  approvedInstances: number;
  rejectedInstances: number;
  totalItems: number;
  evidenceItems: number;
  governanceStatus: string | null;
  isOverdue: boolean;
}

// ─── Compliance summary ───────────────────────────────────────────────────────

export interface ComplianceSummary {
  averageScore: number;
  totalSops: number;
  lowRisk: number;
  mediumRisk: number;
  highRisk: number;
  criticalRisk: number;
  fullyApproved: number;
  overdueCount: number;
  byModule: Array<{ moduleKey: string; averageScore: number; total: number }>;
}

// ─── Risk insight ─────────────────────────────────────────────────────────────

export interface RiskInsightRow {
  sopCode: string;
  moduleKey: string;
  riskLevel: RiskLevel;
  score: number;
  reasons: string[];
}

// ─── Evidence completeness ────────────────────────────────────────────────────

export interface EvidenceCompletenessRow {
  sopCode: string;
  moduleKey: string;
  totalItems: number;
  evidenceItems: number;
  evidencePercent: number;
}

// ─── Executive summary ────────────────────────────────────────────────────────

export interface ExecutiveSummary {
  overallScore: number;
  totalSops: number;
  riskDistribution: { LOW: number; MEDIUM: number; HIGH: number; CRITICAL: number };
  topRisks: RiskInsightRow[];
  byModule: Array<{ moduleKey: string; averageScore: number; total: number; criticalCount: number }>;
  overdueReviewCount: number;
  evidenceGapCount: number;
}

// ─── Query params ─────────────────────────────────────────────────────────────

export interface AnalyticsQuery {
  moduleKey?: string;
  sopCode?: string;
}
