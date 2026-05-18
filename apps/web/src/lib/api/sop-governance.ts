import { apiClient } from './client';
import type {
  SopGovernanceRecord,
  SopGovernanceSummary,
  SopGovernanceChangeLog,
} from '@/lib/sop-governance/types';

// ─── Query / payload types ────────────────────────────────────────────────────

export interface GovernanceListQuery {
  moduleKey?: string;
  status?: string;
  sopCode?: string;
}

export interface CreateGovernanceRecordPayload {
  sopCode: string;
  title: string;
  moduleKey: string;
  version: string;
  status?: string;
  effectiveDate?: string;
  reviewDueDate?: string;
  dmsDocumentId?: string;
  ownerRole?: string;
  notes?: string;
}

export type UpdateGovernanceRecordPayload = Partial<CreateGovernanceRecordPayload>;

export interface GovernanceActionPayload {
  note?: string;
}

export interface GovernanceChangeLogsQuery {
  governanceId?: string;
  limit?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildQs(params: Record<string, string | number | undefined>): string {
  const p = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') p.set(key, String(value));
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

// ─── API client ────────────────────────────────────────────────────────────────

export const sopGovernanceApi = {
  fetchSopGovernanceRecords(params: GovernanceListQuery = {}): Promise<SopGovernanceRecord[]> {
    return apiClient.get<SopGovernanceRecord[]>(
      `/sop-governance/records${buildQs(params)}`,
    );
  },

  fetchSopGovernanceRecord(id: string): Promise<SopGovernanceRecord> {
    return apiClient.get<SopGovernanceRecord>(`/sop-governance/records/${id}`);
  },

  createSopGovernanceRecord(payload: CreateGovernanceRecordPayload): Promise<SopGovernanceRecord> {
    return apiClient.post<SopGovernanceRecord>('/sop-governance/records', payload);
  },

  updateSopGovernanceRecord(
    id: string,
    payload: UpdateGovernanceRecordPayload,
  ): Promise<SopGovernanceRecord> {
    return apiClient.patch<SopGovernanceRecord>(`/sop-governance/records/${id}`, payload);
  },

  activateSopGovernanceRecord(
    id: string,
    payload: GovernanceActionPayload = {},
  ): Promise<SopGovernanceRecord> {
    return apiClient.post<SopGovernanceRecord>(
      `/sop-governance/records/${id}/activate`,
      payload,
    );
  },

  archiveSopGovernanceRecord(
    id: string,
    payload: GovernanceActionPayload = {},
  ): Promise<SopGovernanceRecord> {
    return apiClient.post<SopGovernanceRecord>(
      `/sop-governance/records/${id}/archive`,
      payload,
    );
  },

  markSopGovernanceForReview(
    id: string,
    payload: GovernanceActionPayload = {},
  ): Promise<SopGovernanceRecord> {
    return apiClient.post<SopGovernanceRecord>(
      `/sop-governance/records/${id}/mark-review`,
      payload,
    );
  },

  fetchSopGovernanceSummary(params: GovernanceListQuery = {}): Promise<SopGovernanceSummary> {
    return apiClient.get<SopGovernanceSummary>(
      `/sop-governance/summary${buildQs(params)}`,
    );
  },

  fetchSopGovernanceDueReview(params: GovernanceListQuery = {}): Promise<SopGovernanceRecord[]> {
    return apiClient.get<SopGovernanceRecord[]>(
      `/sop-governance/due-review${buildQs(params)}`,
    );
  },

  fetchSopGovernanceChangeLogs(
    params: GovernanceChangeLogsQuery = {},
  ): Promise<SopGovernanceChangeLog[]> {
    return apiClient.get<SopGovernanceChangeLog[]>(
      `/sop-governance/change-logs${buildQs(params)}`,
    );
  },
};
