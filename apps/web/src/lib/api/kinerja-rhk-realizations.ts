import { apiClient } from './client';
import type { PaginatedResult } from './types';
import type {
  ArchiveRhkRealizationPayload,
  CreateRhkRealizationFromCandidatePayload,
  KinerjaRhkMonthlyReport,
  KinerjaRhkPrintSummary,
  KinerjaRhkQuarterlyReport,
  KinerjaRhkRealization,
  KinerjaRhkRealizationQuery,
  KinerjaRhkRealizationSummary,
} from '@/lib/kinerja-rhk-realizations/types';

function cleanQuery(
  query: KinerjaRhkRealizationQuery = {},
): Record<string, string | number | undefined> {
  return {
    rhkCode: query.rhkCode || undefined,
    moduleKey: query.moduleKey || undefined,
    periodYear: query.periodYear || undefined,
    periodMonth: query.periodMonth || undefined,
    periodQuarter: query.periodQuarter || undefined,
    periodType: query.periodType || undefined,
    status: query.status || undefined,
    page: query.page,
    limit: query.limit,
  };
}

export const rhkRealizationsApi = {
  fetchList(query: KinerjaRhkRealizationQuery = {}) {
    return apiClient.get<PaginatedResult<KinerjaRhkRealization>>(
      '/kinerja/rhk-realizations',
      cleanQuery(query),
    );
  },

  fetchSummary(query: KinerjaRhkRealizationQuery = {}) {
    return apiClient.get<KinerjaRhkRealizationSummary>(
      '/kinerja/rhk-realizations/summary',
      cleanQuery(query),
    );
  },

  fetchById(id: string) {
    return apiClient.get<KinerjaRhkRealization>(`/kinerja/rhk-realizations/${id}`);
  },

  createFromCandidate(candidateId: string, payload: CreateRhkRealizationFromCandidatePayload) {
    return apiClient.post<KinerjaRhkRealization>(
      `/kinerja/rhk-realizations/from-candidate/${candidateId}`,
      payload,
    );
  },

  archive(id: string, payload: ArchiveRhkRealizationPayload = {}) {
    return apiClient.post<KinerjaRhkRealization>(
      `/kinerja/rhk-realizations/${id}/archive`,
      payload,
    );
  },

  fetchMonthlyReport(query: KinerjaRhkRealizationQuery = {}) {
    return apiClient.get<KinerjaRhkMonthlyReport>(
      '/kinerja/rhk-realizations/report/monthly',
      cleanQuery(query),
    );
  },

  fetchQuarterlyReport(query: KinerjaRhkRealizationQuery = {}) {
    return apiClient.get<KinerjaRhkQuarterlyReport>(
      '/kinerja/rhk-realizations/report/quarterly',
      cleanQuery(query),
    );
  },

  fetchPrintSummary(query: KinerjaRhkRealizationQuery = {}) {
    return apiClient.get<KinerjaRhkPrintSummary>(
      '/kinerja/rhk-realizations/report/print-summary',
      cleanQuery(query),
    );
  },
};
