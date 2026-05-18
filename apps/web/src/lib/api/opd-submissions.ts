import { apiClient } from './client';
import type { PaginatedResult } from './types';
import type {
  AddOpdSubmissionDocumentPayload,
  CreateOpdSubmissionPayload,
  OpdActionNotePayload,
  OpdSubmission,
  OpdSubmissionQuery,
  OpdSubmissionSlaQueue,
  OpdSubmissionSlaSummary,
  OpdSubmissionSummary,
  OpdSubmissionTimelineItem,
  RequestOpdCorrectionPayload,
  UpdateOpdSubmissionPayload,
} from '@/lib/opd-submissions/types';

function cleanQuery(
  query: OpdSubmissionQuery = {},
): Record<string, string | number | undefined> {
  return {
    q: query.q,
    status: query.status || undefined,
    slaStatus: query.slaStatus || undefined,
    moduleKey: query.moduleKey || undefined,
    serviceType: query.serviceType,
    opdUnitId: query.opdUnitId,
    from: query.from,
    to: query.to,
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

  fetchMyOpdSubmissionTimeline(id: string) {
    return apiClient.get<OpdSubmissionTimelineItem[]>(
      `/opd/submissions/${id}/timeline`,
    );
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

  uploadOpdSubmissionDocumentFile(id: string, payload: FormData) {
    return apiClient.upload<OpdSubmission>(
      `/opd/submissions/${id}/documents/upload`,
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

  fetchInternalOpdSubmissionTimeline(id: string) {
    return apiClient.get<OpdSubmissionTimelineItem[]>(
      `/internal/opd-submissions/${id}/timeline`,
    );
  },

  fetchInternalOpdSubmissionSummary(query: OpdSubmissionQuery = {}) {
    return apiClient.get<OpdSubmissionSummary>(
      '/internal/opd-submissions/summary',
      cleanQuery(query),
    );
  },

  fetchInternalSlaSummary(query: OpdSubmissionQuery = {}) {
    return apiClient.get<OpdSubmissionSlaSummary>(
      '/internal/opd-submissions/sla/summary',
      cleanQuery(query),
    );
  },

  fetchInternalSlaOverdue(query: OpdSubmissionQuery = {}) {
    return apiClient.get<OpdSubmissionSlaQueue>(
      '/internal/opd-submissions/sla/overdue',
      cleanQuery(query),
    );
  },

  fetchInternalSlaDueSoon(query: OpdSubmissionQuery = {}) {
    return apiClient.get<OpdSubmissionSlaQueue>(
      '/internal/opd-submissions/sla/due-soon',
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

  uploadInternalSubmissionDocumentFile(id: string, payload: FormData) {
    return apiClient.upload<OpdSubmission>(
      `/internal/opd-submissions/${id}/documents/upload`,
      payload,
    );
  },

  verifySubmissionDocument(
    id: string,
    documentId: string,
    payload: OpdActionNotePayload = {},
  ) {
    return apiClient.post<OpdSubmission>(
      `/internal/opd-submissions/${id}/documents/${documentId}/verify`,
      payload,
    );
  },

  requestSubmissionDocumentCorrection(
    id: string,
    documentId: string,
    payload: RequestOpdCorrectionPayload,
  ) {
    return apiClient.post<OpdSubmission>(
      `/internal/opd-submissions/${id}/documents/${documentId}/request-correction`,
      payload,
    );
  },

  rejectSubmissionDocument(
    id: string,
    documentId: string,
    payload: RequestOpdCorrectionPayload,
  ) {
    return apiClient.post<OpdSubmission>(
      `/internal/opd-submissions/${id}/documents/${documentId}/reject`,
      payload,
    );
  },
};
