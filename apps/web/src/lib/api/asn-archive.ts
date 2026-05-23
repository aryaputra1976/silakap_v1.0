import { apiClient } from './client';

export type ArchiveStatus = 'DRAFT' | 'FINAL';

export interface ArchiveListItem {
  id: string;
  bulan: number;
  tahun: number;
  label: string;
  status: ArchiveStatus;
  totalAsn: number;
  totalPns: number;
  totalPppk: number;
  countMutasiJabatan: number;
  countMutasiUnit: number;
  countNaikPangkat: number;
  countPensiun: number;
  countAsnBaru: number;
  countAsnKeluar: number;
  countTugasBelajar: number;
  countKgb: number;
  countAlihJabatan: number;
  countStatusBerubah: number;
  archivedAt: string | null;
  finalizedAt: string | null;
  createdAt: string;
}

export interface ChangeRow {
  id: string;
  nip: string;
  nama: string;
  changeType: string;
  fieldSebelum: Record<string, unknown> | null;
  fieldSesudah: Record<string, unknown> | null;
  detectedAt: string;
}

export interface PaginatedChanges {
  items: ChangeRow[];
  total: number;
  page: number;
  limit: number;
}

export interface MendekatiPensiunRow {
  id: string;
  nip: string;
  nama: string;
  jabatanNama: string | null;
  unitKerjaNama: string | null;
  golonganNama: string | null;
  tmtPensiun: string;
  sisaBulan: number;
}

export interface CreateArchiveResult {
  archiveId: string;
  label: string;
  totalAsn: number;
  totalChanges: number;
  isNew: boolean;
}

export interface EligibleBatchItem {
  id: string;
  source: string;
  importType: string;
  fileName: string | null;
  totalRows: number;
  validRows: number;
  finishedAt: string | null;
  createdAt: string;
}

export const ASN_CHANGE_TYPE_LABEL: Record<string, string> = {
  MUTASI_JABATAN: 'Mutasi Jabatan',
  MUTASI_UNIT: 'Mutasi Unit Kerja',
  NAIK_PANGKAT: 'Kenaikan Pangkat',
  PENSIUN: 'Pensiun',
  ASN_BARU: 'ASN Baru',
  ASN_KELUAR: 'ASN Keluar',
  TUGAS_BELAJAR: 'Tugas Belajar',
  KGB: 'KGB',
  ALIH_JABATAN: 'Alih Jenis Jabatan',
  STATUS_BERUBAH: 'Status Berubah',
};

export function listArchives() {
  return apiClient.get<ArchiveListItem[]>('/asn-archive');
}

export function getArchive(id: string) {
  return apiClient.get<ArchiveListItem>(`/asn-archive/${id}`);
}

export function createArchive(payload: { bulan: number; tahun: number; batchId?: string }) {
  return apiClient.post<CreateArchiveResult>('/asn-archive', payload);
}

export function createArchiveFromBatch(payload: { bulan: number; tahun: number; batchId: string }) {
  return apiClient.post<CreateArchiveResult>('/asn-archive/from-batch', payload);
}

export function listEligibleBatches() {
  return apiClient.get<EligibleBatchItem[]>('/asn-archive/eligible-batches');
}

export function finalizeArchive(id: string) {
  return apiClient.post<ArchiveListItem>(`/asn-archive/${id}/finalize`);
}

export function getChanges(
  id: string,
  params: { changeType?: string; search?: string; page?: number; limit?: number } = {},
) {
  const q: Record<string, string | number> = {};
  if (params.changeType) q.changeType = params.changeType;
  if (params.search) q.search = params.search;
  if (params.page) q.page = params.page;
  if (params.limit) q.limit = params.limit;
  return apiClient.get<PaginatedChanges>(`/asn-archive/${id}/changes`, q);
}

export function getMendekatiPensiun(bulanKedepan = 6) {
  return apiClient.get<MendekatiPensiunRow[]>('/asn-archive/mendekati-pensiun', { bulanKedepan });
}

export const asnArchiveApi = {
  listArchives,
  getArchive,
  createArchive,
  createArchiveFromBatch,
  listEligibleBatches,
  finalizeArchive,
  getChanges,
  getMendekatiPensiun,
};
