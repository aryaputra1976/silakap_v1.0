import { apiClient } from './client';
import type { PaginatedResult } from './types';
import type {
  KinerjaRhkCandidate,
  KinerjaRhkCandidateQuery,
  KinerjaRhkCandidateSummary,
  RhkCandidateActionPayload,
  RhkCandidateRejectPayload,
} from '@/lib/kinerja-rhk-candidates/types';

function cleanQuery(
  query: KinerjaRhkCandidateQuery = {},
): Record<string, string | number | undefined> {
  return {
    q: query.q,
    status: query.status || undefined,
    rhkCode: query.rhkCode || undefined,
    sopCode: query.sopCode || undefined,
    moduleKey: query.moduleKey || undefined,
    from: query.from,
    to: query.to,
    page: query.page,
    limit: query.limit,
  };
}

export const rhkCandidatesApi = {
  fetchList(query: KinerjaRhkCandidateQuery = {}) {
    return apiClient.get<PaginatedResult<KinerjaRhkCandidate>>(
      '/internal/rhk-candidates',
      cleanQuery(query),
    );
  },

  fetchSummary() {
    return apiClient.get<KinerjaRhkCandidateSummary>('/internal/rhk-candidates/summary');
  },

  fetchById(id: string) {
    return apiClient.get<KinerjaRhkCandidate>(`/internal/rhk-candidates/${id}`);
  },

  fetchBySubmissionId(submissionId: string) {
    return apiClient.get<KinerjaRhkCandidate | null>(
      `/internal/rhk-candidates/by-submission/${submissionId}`,
    );
  },

  approve(id: string, payload: RhkCandidateActionPayload = {}) {
    return apiClient.post<KinerjaRhkCandidate>(`/internal/rhk-candidates/${id}/approve`, payload);
  },

  reject(id: string, payload: RhkCandidateRejectPayload) {
    return apiClient.post<KinerjaRhkCandidate>(`/internal/rhk-candidates/${id}/reject`, payload);
  },

  archive(id: string, payload: RhkCandidateActionPayload = {}) {
    return apiClient.post<KinerjaRhkCandidate>(`/internal/rhk-candidates/${id}/archive`, payload);
  },
};
