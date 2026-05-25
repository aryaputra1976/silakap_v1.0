import { apiClient } from './client';
import type { DmsDocument, DmsDocumentCategory, DmsDocumentStatus } from './dms';

export type KinerjaSopStage = 'TAHAP_1' | 'TAHAP_2' | 'TAHAP_3';

export type KinerjaSopStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED';

export type KinerjaSopTargetUnit = 'LAPORAN' | 'DOKUMEN';

export type KinerjaSopRealizationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'REVIEWED'
  | 'APPROVED'
  | 'REVISION_REQUIRED';

export type KinerjaRhkReportStatus =
  | 'AMAN'
  | 'PERLU_PERHATIAN'
  | 'BELUM_ADA_BUKTI'
  | 'TERLAMPAUI';

export interface KinerjaBidangSopRhk {
  id: string;
  sopId: string;
  rhkCode: string;
  title: string | null;
  description: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface KinerjaBidangSopStep {
  id: string;
  sopId: string;
  stepNumber: number;
  activity: string;
  actor: string;
  input: string;
  process: string;
  output: string;
  duration: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KinerjaBidangSop {
  id: string;
  code: string;
  title: string;
  stage: KinerjaSopStage;
  stageTitle: string;
  shortDescription: string;
  objective: string | null;
  scope: string | null;
  legalBasis: string[] | null;
  outputs: string[] | null;
  evidenceExamples: string[] | null;
  status: KinerjaSopStatus;
  isRhkPrimary: boolean;
  sortOrder: number;

  targetQuantity: number | null;
  targetUnit: KinerjaSopTargetUnit;
  qualityTarget: string | null;
  timeTarget: string | null;

  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
  updatedBy: string | null;
  deletedAt: string | null;

  rhkMappings: KinerjaBidangSopRhk[];
  steps: KinerjaBidangSopStep[];
}

export interface KinerjaBidangSopTarget {
  id: string;
  sopId: string;
  rhkCode: string;
  year: number;
  targetQuantity: number;
  targetUnit: KinerjaSopTargetUnit;
  qualityTarget: string;
  timeTarget: string;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
  updatedBy: string | null;
  deletedAt: string | null;
}

export interface KinerjaBidangTargetForInput extends KinerjaBidangSopTarget {
  sop: KinerjaBidangSop;
}

export interface KinerjaBidangTargetQuery {
  year?: string;
  rhkCode?: string;
  isRhkPrimary?: boolean | '';
}

export interface KinerjaBidangEvidence {
  id: string;
  realizationId: string;
  dmsDocumentId: string;
  label: string | null;
  description: string | null;
  isPrimary: boolean;
  createdAt: string;
  createdBy: string | null;
  dmsDocument: Pick<
    DmsDocument,
    | 'id'
    | 'title'
    | 'description'
    | 'category'
    | 'status'
    | 'fileName'
    | 'originalFileName'
    | 'periodYear'
    | 'periodMonth'
    | 'periodQuarter'
    | 'createdAt'
    | 'updatedAt'
  >;
}

export interface KinerjaBidangRealization {
  id: string;
  targetId: string;
  sopId: string;
  rhkCode: string;
  year: number;
  month: number | null;
  quarter: number | null;

  realizationQuantity: number;
  qualityPercent: number | null;
  timeStatus: string | null;
  status: KinerjaSopRealizationStatus;

  title: string;
  description: string | null;
  constraint: string | null;
  followUp: string | null;
  reviewNote: string | null;

  submittedAt: string | null;
  reviewedAt: string | null;
  approvedAt: string | null;

  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
  updatedBy: string | null;
  deletedAt: string | null;

  sop: KinerjaBidangSop;
  target: KinerjaBidangSopTarget;
  evidence: KinerjaBidangEvidence[];
}

export interface KinerjaBidangDashboardSummary {
  totalSop: number;
  totalRhkPrimary: number;
  totalTarget: number;
  totalRealization: number;
  totalApprovedRealization: number;
  totalEvidence: number;
  averageProgressPercent: number;
  needAttention: number;
}

export interface KinerjaBidangRhkReportRow {
  targetId: string;
  sopId: string;
  sopCode: string;
  sopTitle: string;
  rhkCode: string;
  year: number;
  targetQuantity: number;
  targetUnit: KinerjaSopTargetUnit | string;
  realizationQuantity: number;
  approvedRealizationQuantity: number;
  evidenceCount: number;
  progressPercent: number;
  status: KinerjaRhkReportStatus;
}

export interface KinerjaBidangReportNarrative {
  title: string;
  opening: string;
  achievement: string;
  constraint: string;
  followUp: string;
}

export interface KinerjaBidangReportResponse {
  year: number;
  summary: KinerjaBidangDashboardSummary;
  rows: KinerjaBidangRhkReportRow[];
  realizations: KinerjaBidangRealization[];
  narrative: KinerjaBidangReportNarrative;
}

export interface KinerjaBidangSeedResponse {
  seeded: boolean;
  year: number;
  total: number;
}

export interface KinerjaBidangSopQuery {
  q?: string;
  stage?: KinerjaSopStage | '';
  status?: KinerjaSopStatus | '';
  isRhkPrimary?: boolean | '';
  rhkCode?: string;
  page?: number;
  limit?: number;
}

export interface KinerjaBidangReportQuery {
  year?: string;
  month?: string;
  quarter?: string;
  status?: KinerjaSopRealizationStatus | '';
}

export interface SopEvidenceInputPayload {
  dmsDocumentId: string;
  label?: string;
  description?: string;
  isPrimary?: boolean;
}

export interface CreateSopRealizationPayload {
  targetId: string;
  month?: number;
  quarter?: number;
  realizationQuantity: number;
  qualityPercent?: number;
  timeStatus?: string;
  title: string;
  description?: string;
  constraint?: string;
  followUp?: string;
  evidence?: SopEvidenceInputPayload[];
}

export interface UpdateSopRealizationPayload {
  realizationQuantity?: number;
  qualityPercent?: number;
  timeStatus?: string;
  title?: string;
  description?: string;
  constraint?: string;
  followUp?: string;
  reviewNote?: string;
  evidence?: SopEvidenceInputPayload[];
}

export interface RealizationReviewPayload {
  reviewNote?: string;
}

export interface AddSopEvidencePayload {
  dmsDocumentId: string;
  label?: string;
  description?: string;
  isPrimary?: boolean;
}

export const KINERJA_SOP_STAGES: KinerjaSopStage[] = ['TAHAP_1', 'TAHAP_2', 'TAHAP_3'];

export const KINERJA_SOP_STATUSES: KinerjaSopStatus[] = ['ACTIVE', 'DRAFT', 'ARCHIVED'];

export const KINERJA_REALIZATION_STATUSES: KinerjaSopRealizationStatus[] = [
  'DRAFT',
  'SUBMITTED',
  'REVIEWED',
  'APPROVED',
  'REVISION_REQUIRED',
];

function cleanSopQuery(
  query: KinerjaBidangSopQuery = {},
): Record<string, string | number | undefined> {
  return {
    q: query.q,
    stage: query.stage || undefined,
    status: query.status || undefined,
    isRhkPrimary:
      typeof query.isRhkPrimary === 'boolean' ? String(query.isRhkPrimary) : undefined,
    rhkCode: query.rhkCode,
    page: query.page,
    limit: query.limit,
  };
}

function cleanTargetQuery(
  query: KinerjaBidangTargetQuery = {},
): Record<string, string | number | undefined> {
  return {
    year: query.year,
    rhkCode: query.rhkCode,
    isRhkPrimary:
      typeof query.isRhkPrimary === 'boolean'
        ? String(query.isRhkPrimary)
        : undefined,
  };
}

function cleanReportQuery(
  query: KinerjaBidangReportQuery = {},
): Record<string, string | number | undefined> {
  return {
    year: query.year,
    month: query.month,
    quarter: query.quarter,
    status: query.status || undefined,
  };
}

export const kinerjaBidangApi = {
  seedDefault() {
    return apiClient.post<KinerjaBidangSeedResponse>('/kinerja-bidang/seed-default');
  },

  listSop(query: KinerjaBidangSopQuery = {}) {
    return apiClient.get<KinerjaBidangSop[]>('/kinerja-bidang/sop', cleanSopQuery(query));
  },

  getSop(idOrCode: string) {
    return apiClient.get<KinerjaBidangSop>(`/kinerja-bidang/sop/${encodeURIComponent(idOrCode)}`);
  },

  getDashboard(query: KinerjaBidangReportQuery = {}) {
    return apiClient.get<KinerjaBidangDashboardSummary>(
      '/kinerja-bidang/dashboard',
      cleanReportQuery(query),
    );
  },

  getReport(query: KinerjaBidangReportQuery = {}) {
    return apiClient.get<KinerjaBidangReportResponse>(
      '/kinerja-bidang/report',
      cleanReportQuery(query),
    );
  },

  listTargets(query: KinerjaBidangTargetQuery = {}) {
    return apiClient.get<KinerjaBidangTargetForInput[]>(
      '/kinerja-bidang/targets',
      cleanTargetQuery(query),
    );
  },

  listRealizations(query: KinerjaBidangReportQuery = {}) {
    return apiClient.get<KinerjaBidangRealization[]>(
      '/kinerja-bidang/realizations',
      cleanReportQuery(query),
    );
  },

  getRealization(id: string) {
    return apiClient.get<KinerjaBidangRealization>(`/kinerja-bidang/realizations/${id}`);
  },

  createRealization(payload: CreateSopRealizationPayload) {
    return apiClient.post<KinerjaBidangRealization>('/kinerja-bidang/realizations', payload);
  },

  updateRealization(id: string, payload: UpdateSopRealizationPayload) {
    return apiClient.patch<KinerjaBidangRealization>(
      `/kinerja-bidang/realizations/${id}`,
      payload,
    );
  },

  submitRealization(id: string) {
    return apiClient.post<KinerjaBidangRealization>(
      `/kinerja-bidang/realizations/${id}/submit`,
    );
  },

  reviewRealization(id: string, payload: RealizationReviewPayload = {}) {
    return apiClient.post<KinerjaBidangRealization>(
      `/kinerja-bidang/realizations/${id}/review`,
      payload,
    );
  },

  approveRealization(id: string, payload: RealizationReviewPayload = {}) {
    return apiClient.post<KinerjaBidangRealization>(
      `/kinerja-bidang/realizations/${id}/approve`,
      payload,
    );
  },

  requestRevision(id: string, payload: RealizationReviewPayload = {}) {
    return apiClient.post<KinerjaBidangRealization>(
      `/kinerja-bidang/realizations/${id}/request-revision`,
      payload,
    );
  },

  addEvidence(id: string, payload: AddSopEvidencePayload) {
    return apiClient.post<KinerjaBidangRealization>(
      `/kinerja-bidang/realizations/${id}/evidence`,
      payload,
    );
  },

  removeEvidence(id: string, evidenceId: string) {
    return apiClient.delete<KinerjaBidangRealization>(
      `/kinerja-bidang/realizations/${id}/evidence/${evidenceId}`,
    );
  },
};

export function kinerjaSopStageLabel(stage: KinerjaSopStage | string) {
  const labels: Record<KinerjaSopStage, string> = {
    TAHAP_1: 'Tahap 1',
    TAHAP_2: 'Tahap 2',
    TAHAP_3: 'Tahap 3',
  };
  return labels[stage as KinerjaSopStage] ?? stage;
}

export function kinerjaSopStageTitle(stage: KinerjaSopStage | string) {
  const labels: Record<KinerjaSopStage, string> = {
    TAHAP_1: 'Tahap 1 — SOP Manajemen Bidang',
    TAHAP_2: 'Tahap 2 — SOP Pengelolaan Layanan Kepegawaian',
    TAHAP_3: 'Tahap 3 — SOP Fungsi Spesifik Bidang',
  };
  return labels[stage as KinerjaSopStage] ?? stage;
}

export function kinerjaSopStatusLabel(status: KinerjaSopStatus | string) {
  const labels: Record<KinerjaSopStatus, string> = {
    ACTIVE: 'Aktif',
    DRAFT: 'Draft',
    ARCHIVED: 'Arsip',
  };
  return labels[status as KinerjaSopStatus] ?? status;
}

export function kinerjaTargetUnitLabel(unit: KinerjaSopTargetUnit | string) {
  const labels: Record<KinerjaSopTargetUnit, string> = {
    LAPORAN: 'Laporan',
    DOKUMEN: 'Dokumen',
  };
  return labels[unit as KinerjaSopTargetUnit] ?? unit;
}

export function kinerjaRealizationStatusLabel(status: KinerjaSopRealizationStatus | string) {
  const labels: Record<KinerjaSopRealizationStatus, string> = {
    DRAFT: 'Draft',
    SUBMITTED: 'Submitted',
    REVIEWED: 'Reviewed',
    APPROVED: 'Approved',
    REVISION_REQUIRED: 'Perlu Revisi',
  };
  return labels[status as KinerjaSopRealizationStatus] ?? status;
}

export function kinerjaRhkReportStatusLabel(status: KinerjaRhkReportStatus | string) {
  const labels: Record<KinerjaRhkReportStatus, string> = {
    AMAN: 'Aman',
    PERLU_PERHATIAN: 'Perlu Perhatian',
    BELUM_ADA_BUKTI: 'Belum Ada Bukti',
    TERLAMPAUI: 'Terlampaui',
  };
  return labels[status as KinerjaRhkReportStatus] ?? status;
}

export function kinerjaRhkReportStatusTone(
  status: KinerjaRhkReportStatus | string,
): 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 'AMAN' || status === 'TERLAMPAUI') return 'success';
  if (status === 'BELUM_ADA_BUKTI') return 'neutral';
  return 'warning';
}

export function kinerjaRealizationStatusTone(
  status: KinerjaSopRealizationStatus | string,
): 'success' | 'warning' | 'danger' | 'neutral' | 'info' {
  if (status === 'APPROVED') return 'success';
  if (status === 'SUBMITTED' || status === 'REVIEWED') return 'info';
  if (status === 'REVISION_REQUIRED') return 'warning';
  return 'neutral';
}

export function kinerjaDmsCategoryLabel(category: DmsDocumentCategory | string) {
  return category;
}

export function kinerjaDmsStatusLabel(status: DmsDocumentStatus | string) {
  return status;
}
