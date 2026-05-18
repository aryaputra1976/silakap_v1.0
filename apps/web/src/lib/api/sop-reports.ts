import { apiClient } from './client';
import type {
  SopReportQuery,
  SopExportLogPayload,
  SopExecutiveReport,
  SopEvidencePackage,
  SopPrintSummary,
} from '@/lib/sop-reports/types';

function buildQs(q: SopReportQuery): string {
  const params = new URLSearchParams();
  if (q.moduleKey) params.set('moduleKey', q.moduleKey);
  if (q.sopCode) params.set('sopCode', q.sopCode);
  if (q.from) params.set('from', q.from);
  if (q.to) params.set('to', q.to);
  if (q.periodType) params.set('periodType', q.periodType);
  if (q.format) params.set('format', q.format);
  const s = params.toString();
  return s ? `?${s}` : '';
}

function unwrap<T>(res: { data: T }): T {
  return res.data;
}

export const sopReportsApi = {
  fetchSopExecutiveReport(params: SopReportQuery = {}): Promise<SopExecutiveReport> {
    return apiClient
      .get<{ data: SopExecutiveReport }>(`/api/v1/sop-reports/executive${buildQs(params)}`)
      .then(unwrap);
  },

  fetchSopEvidencePackage(params: SopReportQuery = {}): Promise<SopEvidencePackage> {
    return apiClient
      .get<{ data: SopEvidencePackage }>(`/api/v1/sop-reports/evidence-package${buildQs(params)}`)
      .then(unwrap);
  },

  fetchSopPrintSummary(params: SopReportQuery = {}): Promise<SopPrintSummary> {
    return apiClient
      .get<{ data: SopPrintSummary }>(`/api/v1/sop-reports/summary-print${buildQs(params)}`)
      .then(unwrap);
  },

  writeSopExportLog(payload: SopExportLogPayload): Promise<{ ok: boolean }> {
    return apiClient
      .post<{ data: { ok: boolean } }>('/api/v1/sop-reports/export-log', payload)
      .then(unwrap);
  },
};
