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

// ─── Dashboard types ────────────────────────────────────────────────────────

export interface ChecklistDashboardByModule {
  moduleKey: string;
  total: number;
  approved: number;
  averageProgress: number;
}

export interface ChecklistDashboardBySop {
  sopCode: string;
  moduleKey: string;
  total: number;
  approved: number;
  rejected: number;
  inReview: number;
  draft: number;
  averageProgress: number;
  lastUpdatedAt: string | null;
}

export interface ChecklistDashboardSummary {
  totalInstances: number;
  totalItems: number;
  completedItems: number;
  approved: number;
  rejected: number;
  inReview: number;
  draft: number;
  averageProgress: number;
  pendingItems: number;
  perluPerbaikanItems: number;
  byModule: ChecklistDashboardByModule[];
  bySop: ChecklistDashboardBySop[];
  byStatus: Array<{ status: string; count: number }>;
}

export interface ChecklistDashboardActivity {
  id: string;
  instanceId: string;
  sopCode: string;
  moduleKey: string;
  entityType: string;
  entityId: string;
  action: string;
  actorId: string | null;
  fromStatus: string | null;
  toStatus: string | null;
  notes: string | null;
  createdAt: string;
}

export interface ChecklistRhkProgressRow {
  sopCode: string;
  moduleKey: string;
  checklistTotal: number;
  checklistApproved: number;
  checklistProgress: number;
  rhkCodes: string[];
  targetQuantity: number | null;
  realizationQuantity: number;
  evidenceCount: number;
}

export interface DashboardQuery {
  moduleKey?: string;
  sopCode?: string;
  status?: SopChecklistOverallStatusApi;
  entityType?: string;
  from?: string;
  to?: string;
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

  // ── Dashboard ──────────────────────────────────────────────────────────────

  fetchChecklistDashboardSummary(params: DashboardQuery): Promise<ChecklistDashboardSummary> {
    const qs = buildDashboardQs(params);
    return apiClient.get<ChecklistDashboardSummary>(
      `/sop-checklists/dashboard/summary${qs}`,
    );
  },

  fetchChecklistDashboardBySop(params: DashboardQuery): Promise<ChecklistDashboardBySop[]> {
    const qs = buildDashboardQs(params);
    return apiClient.get<ChecklistDashboardBySop[]>(
      `/sop-checklists/dashboard/by-sop${qs}`,
    );
  },

  fetchChecklistRecentActivities(limit?: number): Promise<ChecklistDashboardActivity[]> {
    const qs = limit ? `?limit=${limit}` : '';
    return apiClient.get<ChecklistDashboardActivity[]>(
      `/sop-checklists/dashboard/recent-activities${qs}`,
    );
  },

  fetchChecklistRhkProgress(params: DashboardQuery): Promise<ChecklistRhkProgressRow[]> {
    const qs = buildDashboardQs(params);
    return apiClient.get<ChecklistRhkProgressRow[]>(
      `/sop-checklists/dashboard/rhk-progress${qs}`,
    );
  },
};

function buildDashboardQs(params: DashboardQuery): string {
  const p = new URLSearchParams();
  if (params.moduleKey) p.set('moduleKey', params.moduleKey);
  if (params.sopCode) p.set('sopCode', params.sopCode);
  if (params.status) p.set('status', params.status);
  if (params.entityType) p.set('entityType', params.entityType);
  if (params.from) p.set('from', params.from);
  if (params.to) p.set('to', params.to);
  const s = p.toString();
  return s ? `?${s}` : '';
}
