import { apiClient } from './client';
import type {
  CreateIkmPeriodPayload,
  IkmSummary,
  IkmSurvey,
  IkmSurveyPeriod,
  IkmSurveyQuery,
  IkmTrendEntry,
  SubmitIkmSurveyPayload,
} from '@/lib/ikm/types';

export const ikmApi = {
  // Periods
  fetchPeriods() {
    return apiClient.get<IkmSurveyPeriod[]>('/ikm/periods');
  },

  createPeriod(payload: CreateIkmPeriodPayload) {
    return apiClient.post<IkmSurveyPeriod>('/ikm/periods', payload);
  },

  closePeriod(id: string) {
    return apiClient.patch<IkmSurveyPeriod>(`/ikm/periods/${id}/close`, {});
  },

  reopenPeriod(id: string) {
    return apiClient.patch<IkmSurveyPeriod>(`/ikm/periods/${id}/reopen`, {});
  },

  // Surveys
  submitSurvey(payload: SubmitIkmSurveyPayload) {
    return apiClient.post<IkmSurvey>('/ikm/surveys', payload);
  },

  fetchSurveys(query: IkmSurveyQuery = {}) {
    return apiClient.get<IkmSurvey[]>('/ikm/surveys', {
      periodId: query.periodId || undefined,
      opdName: query.opdName || undefined,
      serviceType: query.serviceType || undefined,
    });
  },

  getSummary(periodId: string) {
    return apiClient.get<IkmSummary>(`/ikm/periods/${periodId}/summary`);
  },

  getTrend() {
    return apiClient.get<IkmTrendEntry[]>('/ikm/summary/trend');
  },
};
