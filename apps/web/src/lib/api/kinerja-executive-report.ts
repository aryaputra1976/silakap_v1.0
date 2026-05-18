import { apiClient } from './client';
import type {
  EvidenceBundleItem,
  ExecutiveExportLogPayload,
  ExecutiveReportQuery,
  KinerjaRhkMonthlyReport,
  KinerjaRhkPrintSummary,
  KinerjaRhkQuarterlyReport,
  KinerjaRhkRealizationSummary,
} from '@/lib/kinerja-executive-report/types';

function cleanQuery(q: ExecutiveReportQuery = {}): Record<string, string | number | undefined> {
  return {
    rhkCode: q.rhkCode || undefined,
    moduleKey: q.moduleKey || undefined,
    periodType: q.periodType || undefined,
    periodYear: q.periodYear ? Number(q.periodYear) : undefined,
    periodMonth: q.periodMonth ? Number(q.periodMonth) : undefined,
    periodQuarter: q.periodQuarter ? Number(q.periodQuarter) : undefined,
  };
}

export const kinerjaExecutiveReportApi = {
  fetchSummary(query: ExecutiveReportQuery = {}) {
    return apiClient.get<KinerjaRhkRealizationSummary>(
      '/kinerja/executive-report/summary',
      cleanQuery(query),
    );
  },

  fetchMonthly(query: ExecutiveReportQuery = {}) {
    return apiClient.get<KinerjaRhkMonthlyReport>(
      '/kinerja/executive-report/monthly',
      cleanQuery(query),
    );
  },

  fetchQuarterly(query: ExecutiveReportQuery = {}) {
    return apiClient.get<KinerjaRhkQuarterlyReport>(
      '/kinerja/executive-report/quarterly',
      cleanQuery(query),
    );
  },

  fetchEvidenceBundle(query: ExecutiveReportQuery = {}) {
    return apiClient.get<EvidenceBundleItem[]>(
      '/kinerja/executive-report/evidence-bundle',
      cleanQuery(query),
    );
  },

  fetchPrintSummary(query: ExecutiveReportQuery = {}) {
    return apiClient.get<KinerjaRhkPrintSummary>(
      '/kinerja/executive-report/print-summary',
      cleanQuery(query),
    );
  },

  writeExportLog(payload: ExecutiveExportLogPayload) {
    return apiClient.post<{ ok: boolean }>(
      '/kinerja/executive-report/export-log',
      payload,
    );
  },
};
