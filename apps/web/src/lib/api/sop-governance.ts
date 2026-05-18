import { apiClient } from './client';
import type {
  SopGovernanceRecord,
  SopGovernanceSummary,
  SopGovernanceChangeLog,
  SopReviewReminder,
  SopReviewQueue,
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

// ─── Review workflow payloads ─────────────────────────────────────────────────

export interface StartReviewPayload {
  note?: string;
}

export interface CompleteReviewPayload {
  decision: 'KEEP_ACTIVE' | 'REVISION_REQUIRED' | 'ARCHIVED';
  note?: string;
  reviewDueDate?: string;
}

export interface KeepActivePayload {
  note?: string;
  reviewDueDate?: string;
}

export interface RequestRevisionPayload {
  note?: string;
}

export interface CreateReminderPayload {
  reminderType: 'DUE_SOON' | 'OVERDUE' | 'MANUAL_REVIEW' | 'REVISION_REQUIRED';
  message?: string;
  sentToRole?: string;
  sentToUserId?: string;
  dueDate?: string;
}

export interface ReminderActionPayload {
  note?: string;
}

export interface RemindersQuery {
  governanceId?: string;
  status?: string;
  moduleKey?: string;
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

  // ── Review workflow ───────────────────────────────────────────────────────────

  fetchSopReviewQueue(): Promise<SopReviewQueue> {
    return apiClient.get<SopReviewQueue>('/sop-governance/review/queue');
  },

  startSopReview(recordId: string, payload: StartReviewPayload = {}): Promise<SopGovernanceRecord> {
    return apiClient.post<SopGovernanceRecord>(
      `/sop-governance/records/${recordId}/start-review`,
      payload,
    );
  },

  completeSopReview(recordId: string, payload: CompleteReviewPayload): Promise<SopGovernanceRecord> {
    return apiClient.post<SopGovernanceRecord>(
      `/sop-governance/records/${recordId}/complete-review`,
      payload,
    );
  },

  keepSopActive(recordId: string, payload: KeepActivePayload = {}): Promise<SopGovernanceRecord> {
    return apiClient.post<SopGovernanceRecord>(
      `/sop-governance/records/${recordId}/keep-active`,
      payload,
    );
  },

  requestSopRevision(recordId: string, payload: RequestRevisionPayload = {}): Promise<SopGovernanceRecord> {
    return apiClient.post<SopGovernanceRecord>(
      `/sop-governance/records/${recordId}/request-revision`,
      payload,
    );
  },

  createSopReviewReminder(recordId: string, payload: CreateReminderPayload): Promise<SopReviewReminder> {
    return apiClient.post<SopReviewReminder>(
      `/sop-governance/records/${recordId}/reminders`,
      payload,
    );
  },

  fetchSopReviewReminders(params: RemindersQuery = {}): Promise<SopReviewReminder[]> {
    return apiClient.get<SopReviewReminder[]>(
      `/sop-governance/reminders${buildQs(params)}`,
    );
  },

  resolveSopReviewReminder(reminderId: string, payload: ReminderActionPayload = {}): Promise<SopReviewReminder> {
    return apiClient.post<SopReviewReminder>(
      `/sop-governance/reminders/${reminderId}/resolve`,
      payload,
    );
  },

  dismissSopReviewReminder(reminderId: string, payload: ReminderActionPayload = {}): Promise<SopReviewReminder> {
    return apiClient.post<SopReviewReminder>(
      `/sop-governance/reminders/${reminderId}/dismiss`,
      payload,
    );
  },
};
