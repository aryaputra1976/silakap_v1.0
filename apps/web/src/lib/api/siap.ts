import { apiClient } from './client';
import type { PaginatedResult, SiapCaseDetail, SiapCaseListItem, SiapTask } from './types';

export type CreateCasePayload = {
  serviceType: string;
  title: string;
  description?: string;
  asnId?: string;
  priority?: string;
};

export type CaseListQuery = {
  q?: string;
  serviceType?: string;
  status?: string;
  currentState?: string;
  page?: number;
  limit?: number;
};

export type AssignTaskPayload = {
  assignedTo: string;
  note?: string;
};

export type ReturnTaskPayload = {
  reason: string;
  targetRole?: string;
};

export const siapApi = {
  fetchCases(query: CaseListQuery = {}) {
    return apiClient.get<PaginatedResult<SiapCaseListItem>>('/siap/cases', {
      q: query.q || undefined,
      serviceType: query.serviceType || undefined,
      status: query.status || undefined,
      currentState: query.currentState || undefined,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });
  },

  fetchCaseById(id: string) {
    return apiClient.get<SiapCaseDetail>(`/siap/cases/${id}`);
  },

  createCase(payload: CreateCasePayload) {
    return apiClient.post<SiapCaseListItem>('/siap/cases', payload);
  },

  submitCase(id: string) {
    return apiClient.post<SiapCaseDetail>(`/siap/cases/${id}/submit`, {});
  },

  startTask(id: string) {
    return apiClient.post<SiapTask>(`/siap/tasks/${id}/start`, {});
  },

  completeTask(id: string, note?: string) {
    return apiClient.post<SiapTask>(`/siap/tasks/${id}/complete`, { note });
  },

  assignTask(id: string, payload: AssignTaskPayload) {
    return apiClient.post<SiapTask>(`/siap/tasks/${id}/assign`, payload);
  },

  returnTask(id: string, payload: ReturnTaskPayload) {
    return apiClient.post<SiapTask>(`/siap/tasks/${id}/return`, payload);
  },
};
