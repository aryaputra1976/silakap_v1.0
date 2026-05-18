import { apiClient } from './client';
import type { PaginatedResult } from './types';
import type {
  AddOpdSubmissionDocumentPayload,
  CreateOpdSubmissionPayload,
  OpdActionNotePayload,
  OpdSubmission,
  OpdSubmissionQuery,
  OpdSubmissionSummary,
  RequestOpdCorrectionPayload,
  UpdateOpdSubmissionPayload,
} from '@/lib/opd-submissions/types';

function cleanQuery(
  query: OpdSubmissionQuery = {},
): Record<string, string | number | undefined> {
  return {
    q: query.q,
    status: query.status || undefined,
    moduleKey: query.moduleKey || undefined,
    serviceType: query.serviceType,
    opdUnitId: query.opdUnitId,
    page: query.page,
    limit: query.limit,
  };
}

export const opdSubmissionsApi = {
  fetchMyOpdSubmissions(query: OpdSubmissionQuery = {}) {
    return apiClient.get<PaginatedResult<OpdSubmission>>(
      '/opd/submissions',
      cleanQuery(query),
    );
  },

  fetchMyOpdSubmission(id: string) {
    return apiClient.get<OpdSubmission>(`/opd/submissions/${id}`);
  },

  fetchMyOpdSubmissionSummary(query: OpdSubmissionQuery = {}) {
    return apiClient.get<OpdSubmissionSummary>(
      '/opd/submissions/summary',
      cleanQuery(query),
    );
  },

  createOpdSubmission(payload: CreateOpdSubmissionPayload) {
    return apiClient.post<OpdSubmission>('/opd/submissions', payload);
  },

  updateOpdSubmission(id: string, payload: UpdateOpdSubmissionPayload) {
    return apiClient.patch<OpdSubmission>(`/opd/submissions/${id}`, payload);
  },

  submitOpdSubmission(id: string, payload: OpdActionNotePayload = {}) {
    return apiClient.post<OpdSubmission>(`/opd/submissions/${id}/submit`, payload);
  },

  cancelOpdSubmission(id: string, payload: OpdActionNotePayload = {}) {
    return apiClient.post<OpdSubmission>(`/opd/submissions/${id}/cancel`, payload);
  },

  addOpdSubmissionDocument(
    id: string,
    payload: AddOpdSubmissionDocumentPayload,
  ) {
    return apiClient.post<OpdSubmission>(
      `/opd/submissions/${id}/documents`,
      payload,
    );
  },

  submitOpdCorrection(id: string, payload: OpdActionNotePayload = {}) {
    return apiClient.post<OpdSubmission>(
      `/opd/submissions/${id}/correction-submit`,
      payload,
    );
  },

  fetchInternalOpdSubmissions(query: OpdSubmissionQuery = {}) {
    return apiClient.get<PaginatedResult<OpdSubmission>>(
      '/internal/opd-submissions',
      cleanQuery(query),
    );
  },

  fetchInternalOpdSubmission(id: string) {
    return apiClient.get<OpdSubmission>(`/internal/opd-submissions/${id}`);
  },

  fetchInternalOpdSubmissionSummary(query: OpdSubmissionQuery = {}) {
    return apiClient.get<OpdSubmissionSummary>(
      '/internal/opd-submissions/summary',
      cleanQuery(query),
    );
  },

  receiveOpdSubmission(id: string, payload: OpdActionNotePayload = {}) {
    return apiClient.post<OpdSubmission>(
      `/internal/opd-submissions/${id}/receive`,
      payload,
    );
  },

  startOpdVerification(id: string, payload: OpdActionNotePayload = {}) {
    return apiClient.post<OpdSubmission>(
      `/internal/opd-submissions/${id}/start-verification`,
      payload,
    );
  },

  requestOpdCorrection(id: string, payload: RequestOpdCorrectionPayload) {
    return apiClient.post<OpdSubmission>(
      `/internal/opd-submissions/${id}/request-correction`,
      payload,
    );
  },

  verifyOpdSubmission(id: string, payload: OpdActionNotePayload = {}) {
    return apiClient.post<OpdSubmission>(
      `/internal/opd-submissions/${id}/verify`,
      payload,
    );
  },

  rejectOpdSubmission(id: string, payload: OpdActionNotePayload = {}) {
    return apiClient.post<OpdSubmission>(
      `/internal/opd-submissions/${id}/reject`,
      payload,
    );
  },

  completeOpdSubmission(id: string, payload: OpdActionNotePayload = {}) {
    return apiClient.post<OpdSubmission>(
      `/internal/opd-submissions/${id}/complete`,
      payload,
    );
  },
};
