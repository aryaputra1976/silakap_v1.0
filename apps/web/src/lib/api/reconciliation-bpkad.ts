import { apiClient } from './client';
import type { PaginatedResult } from './types';
import type {
  FindingSummaryItem,
  FindingsQuery,
  LaporanStats,
  ReconciliationBpkadPayrollRow,
  ReconciliationBeritaAcara,
  ReconciliationFinding,
  ReconciliationImportBatch,
  ReconciliationMatchingRun,
  ReconciliationPeriod,
  ReconciliationQuery,
} from '@/lib/reconciliation-bpkad/types';

function cleanQuery(
  query: ReconciliationQuery = {},
): Record<string, string | number | undefined> {
  return {
    page: query.page,
    limit: query.limit,
    status: query.status || undefined,
    q: query.q || undefined,
  };
}

export const reconciliationBpkadApi = {
  fetchPeriods() {
    return apiClient.get<ReconciliationPeriod[]>('/reconciliation/bpkad/periods');
  },

  createPeriod(payload: {
    periodYear?: string;
    periodMonth?: string;
    periodQuarter?: string;
    periodType?: string;
    title?: string;
    cutOffDate?: string;
    notes?: string;
  }) {
    return apiClient.post<ReconciliationPeriod>(
      '/reconciliation/bpkad/periods',
      payload,
    );
  },

  fetchBpkadSimgajiImports(query: ReconciliationQuery = {}) {
    return apiClient.get<PaginatedResult<ReconciliationImportBatch>>(
      '/reconciliation/bpkad/imports/bpkad-simgaji',
      cleanQuery(query),
    );
  },

  fetchBpkadSimgajiImport(id: string) {
    return apiClient.get<ReconciliationImportBatch>(
      `/reconciliation/bpkad/imports/bpkad-simgaji/${id}`,
    );
  },

  fetchBpkadSimgajiRows(id: string, query: ReconciliationQuery = {}) {
    return apiClient.get<PaginatedResult<ReconciliationBpkadPayrollRow>>(
      `/reconciliation/bpkad/imports/bpkad-simgaji/${id}/rows`,
      cleanQuery(query),
    );
  },

  uploadBpkadSimgaji(payload: FormData) {
    return apiClient.upload<ReconciliationImportBatch>(
      '/reconciliation/bpkad/imports/bpkad-simgaji/upload',
      payload,
    );
  },

  cancelBpkadSimgajiImport(id: string) {
    return apiClient.post<ReconciliationImportBatch>(
      `/reconciliation/bpkad/imports/bpkad-simgaji/${id}/cancel`,
    );
  },

  runMatching(periodId: string, batchId?: string) {
    return apiClient.post<ReconciliationMatchingRun>(
      `/reconciliation/bpkad/periods/${periodId}/matching/run`,
      batchId ? { batchId } : {},
    );
  },

  fetchMatchingRun(periodId: string) {
    return apiClient.get<ReconciliationMatchingRun | null>(
      `/reconciliation/bpkad/periods/${periodId}/matching`,
    );
  },

  fetchFindings(periodId: string, query: FindingsQuery = {}) {
    return apiClient.get<PaginatedResult<ReconciliationFinding>>(
      `/reconciliation/bpkad/periods/${periodId}/findings`,
      {
        page: query.page,
        limit: query.limit,
        findingCode: query.findingCode || undefined,
        priority: query.priority || undefined,
        status: query.status || undefined,
        q: query.q || undefined,
      },
    );
  },

  fetchFindingsSummary(periodId: string) {
    return apiClient.get<FindingSummaryItem[]>(
      `/reconciliation/bpkad/periods/${periodId}/findings/summary`,
    );
  },

  patchFinding(
    periodId: string,
    findingId: string,
    payload: {
      status?: string;
      notes?: string;
      rtlPic?: string;
      rtlDeadline?: string;
      rtlAction?: string;
      rtlNotes?: string;
    },
  ) {
    return apiClient.patch<ReconciliationFinding>(
      `/reconciliation/bpkad/periods/${periodId}/findings/${findingId}`,
      payload,
    );
  },

  createBeritaAcara(periodId: string, payload: { nomorBA?: string; tanggalBA?: string; notes?: string }) {
    return apiClient.post<ReconciliationBeritaAcara>(
      `/reconciliation/bpkad/periods/${periodId}/berita-acara`,
      payload,
    );
  },

  finalizeBeritaAcara(periodId: string, payload: { nomorBA?: string; tanggalBA?: string; notes?: string }) {
    return apiClient.post<ReconciliationBeritaAcara>(
      `/reconciliation/bpkad/periods/${periodId}/berita-acara/finalize`,
      payload,
    );
  },

  fetchBeritaAcara(periodId: string) {
    return apiClient.get<ReconciliationBeritaAcara | null>(
      `/reconciliation/bpkad/periods/${periodId}/berita-acara`,
    );
  },

  fetchLaporanStats(periodId: string) {
    return apiClient.get<LaporanStats>(
      `/reconciliation/bpkad/periods/${periodId}/laporan`,
    );
  },

  exportFindings(periodId: string, query: { findingCode?: string; status?: string } = {}) {
    return apiClient.get<ReconciliationFinding[]>(
      `/reconciliation/bpkad/periods/${periodId}/findings/export`,
      {
        findingCode: query.findingCode || undefined,
        status: query.status || undefined,
      },
    );
  },
};
