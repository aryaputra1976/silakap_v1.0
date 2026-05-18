import { apiClient } from './client';
import type {
  ComplianceSummary,
  ComplianceBySopRow,
  RiskInsightRow,
  EvidenceCompletenessRow,
  ExecutiveSummary,
  AnalyticsQuery,
} from '@/lib/sop-analytics/types';

function buildQs(q: AnalyticsQuery): string {
  const params = new URLSearchParams();
  if (q.moduleKey) params.set('moduleKey', q.moduleKey);
  if (q.sopCode) params.set('sopCode', q.sopCode);
  const s = params.toString();
  return s ? `?${s}` : '';
}

function unwrap<T>(res: { data: T }): T {
  return res.data;
}

export const sopAnalyticsApi = {
  fetchComplianceSummary(q: AnalyticsQuery = {}): Promise<ComplianceSummary> {
    return apiClient
      .get<{ data: ComplianceSummary }>(`/api/v1/sop-analytics/compliance-summary${buildQs(q)}`)
      .then(unwrap);
  },

  fetchComplianceBySop(q: AnalyticsQuery = {}): Promise<ComplianceBySopRow[]> {
    return apiClient
      .get<{ data: ComplianceBySopRow[] }>(`/api/v1/sop-analytics/compliance-by-sop${buildQs(q)}`)
      .then(unwrap);
  },

  fetchRiskInsights(q: AnalyticsQuery = {}): Promise<RiskInsightRow[]> {
    return apiClient
      .get<{ data: RiskInsightRow[] }>(`/api/v1/sop-analytics/risk-insights${buildQs(q)}`)
      .then(unwrap);
  },

  fetchEvidenceCompleteness(q: AnalyticsQuery = {}): Promise<EvidenceCompletenessRow[]> {
    return apiClient
      .get<{ data: EvidenceCompletenessRow[] }>(`/api/v1/sop-analytics/evidence-completeness${buildQs(q)}`)
      .then(unwrap);
  },

  fetchExecutiveSummary(q: AnalyticsQuery = {}): Promise<ExecutiveSummary> {
    return apiClient
      .get<{ data: ExecutiveSummary }>(`/api/v1/sop-analytics/executive-summary${buildQs(q)}`)
      .then(unwrap);
  },
};
