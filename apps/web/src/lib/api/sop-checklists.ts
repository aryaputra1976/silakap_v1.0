import { apiClient } from './client';

// ─── Types matching backend Prisma models ──────────────────────────────────

export type SopChecklistItemStatusApi =
  | 'PENDING'
  | 'TERPENUHI'
  | 'TIDAK_TERPENUHI'
  | 'TIDAK_RELEVAN'
  | 'PERLU_PERBAIKAN';

export type SopChecklistOverallStatusApi =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

export interface SopChecklistItemApi {
  id: string;
  instanceId: string;
  itemId: string;
  status: SopChecklistItemStatusApi;
  notes: string | null;
  dmsDocumentId: string | null;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SopChecklistInstanceApi {
  id: string;
  sopCode: string;
  moduleKey: string;
  entityType: string;
  entityId: string;
  status: SopChecklistOverallStatusApi;
  progress: number;
  completedItems: number;
  totalItems: number;
  approvedById: string | null;
  approvedAt: string | null;
  rejectedById: string | null;
  rejectedAt: string | null;
  approvalNote: string | null;
  createdById: string | null;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
  items: SopChecklistItemApi[];
}

export interface SopChecklistAuditLogApi {
  id: string;
  instanceId: string;
  actorId: string | null;
  action: string;
  itemId: string | null;
  fromStatus: string | null;
  toStatus: string | null;
  notes: string | null;
  createdAt: string;
}

// ─── Request payloads ───────────────────────────────────────────────────────

export interface CreateInstancePayload {
  sopCode: string;
  moduleKey: string;
  entityType: string;
  entityId: string;
}

export interface UpdateItemPayload {
  itemId: string;
  status: SopChecklistItemStatusApi;
  notes?: string;
  dmsDocumentId?: string;
}

export interface ApproveRejectPayload {
  action: 'APPROVED' | 'REJECTED';
  approvalNote?: string;
}

export interface ListInstancesQuery {
  sopCode?: string;
  entityType?: string;
  entityId?: string;
  moduleKey?: string;
  status?: SopChecklistOverallStatusApi;
}

// ─── API functions ──────────────────────────────────────────────────────────

export const sopChecklistsApi = {
  listInstances(query: ListInstancesQuery): Promise<SopChecklistInstanceApi[]> {
    const params = new URLSearchParams();
    if (query.sopCode) params.set('sopCode', query.sopCode);
    if (query.entityType) params.set('entityType', query.entityType);
    if (query.entityId) params.set('entityId', query.entityId);
    if (query.moduleKey) params.set('moduleKey', query.moduleKey);
    if (query.status) params.set('status', query.status);
    const qs = params.toString();
    return apiClient.get<SopChecklistInstanceApi[]>(`/sop-checklists${qs ? `?${qs}` : ''}`);
  },

  getOrCreateInstance(payload: CreateInstancePayload): Promise<SopChecklistInstanceApi> {
    return apiClient.post<SopChecklistInstanceApi>('/sop-checklists/instances', payload);
  },

  getInstance(id: string): Promise<SopChecklistInstanceApi> {
    return apiClient.get<SopChecklistInstanceApi>(`/sop-checklists/instances/${id}`);
  },

  updateItem(instanceId: string, payload: UpdateItemPayload): Promise<SopChecklistInstanceApi> {
    return apiClient.patch<SopChecklistInstanceApi>(
      `/sop-checklists/instances/${instanceId}/items`,
      payload,
    );
  },

  approveReject(instanceId: string, payload: ApproveRejectPayload): Promise<SopChecklistInstanceApi> {
    return apiClient.post<SopChecklistInstanceApi>(
      `/sop-checklists/instances/${instanceId}/approve`,
      payload,
    );
  },

  getAuditLogs(instanceId: string): Promise<SopChecklistAuditLogApi[]> {
    return apiClient.get<SopChecklistAuditLogApi[]>(
      `/sop-checklists/instances/${instanceId}/audit-logs`,
    );
  },
};
