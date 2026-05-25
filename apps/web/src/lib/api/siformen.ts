import { apiClient } from './client';

export type SiformenBezettingStatus = 'VACANT' | 'FILLED' | 'ACTING';
export type SiformenFormasiJenis = 'CPNS' | 'PPPK';
export type SiformenFormasiStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
export type SiformenKategoriJabatan = 'KEAHLIAN' | 'KETERAMPILAN';

export interface SiformenJabatanFungsionalRef {
  id: string;
  namaJabatan: string;
  jenjang: string;
  kategori: SiformenKategoriJabatan | string;
  jenjangAwal: string | null;
  jenjangPuncak: string | null;
  golonganRuangAwal: string | null;
  rumpunJabatan: string | null;
  ruangLingkup: string | null;
  kedudukan: string | null;
  pengisianAsn: string | null;
  instansiPembina: string | null;
  dasarHukum: string | null;
  tugasJabatan: string | null;
  pendidikanPengangkatan: string | null;
  pendidikanPerpindahan: string | null;
  perpresTunjangan: string | null;
  besaranTunjangan: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SiformenJabatan {
  id: string;
  kodeJabatan: string;
  namaJabatan: string;
  jenisJabatan: string;
  eselonLevel: string | null;
  kelasJabatan: number | null;
  unitKerja: string;
  satuanKerja: string | null;
  kualifikasiPendidikan: string | null;
  isActive: boolean;
  sortOrder: number | null;
  unitKerjaId: string | null;
  unitKerjaRef: { id: string; nama: string; kode: string; level: number } | null;
  jabatanFungsionalRefId: string | null;
  jabatanFungsionalRef: SiformenJabatanFungsionalRef | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface SiformenBezetting {
  id: string;
  jabatanId: string | null;
  namaJabatan: string;
  unitKerja: string;
  tahun: number;
  nip: string | null;
  namaAsn: string | null;
  pangkat: string | null;
  golongan: string | null;
  tmtJabatan: string | null;
  statusIsi: SiformenBezettingStatus;
  keterangan: string | null;
  createdAt: string;
  updatedAt: string;
  jabatan: SiformenJabatan | null;
}

export interface SiformenFormasi {
  id: string;
  jabatanId: string | null;
  namaJabatan: string;
  unitKerja: string;
  jenisFormasi: SiformenFormasiJenis;
  tahun: number;
  periode: string | null;
  jumlahKebutuhan: number;
  jumlahTersedia: number;
  jumlahUsulan: number;
  kualifikasiPendidikan: string | null;
  kualifikasiJurusan: string | null;
  alasanKebutuhan: string | null;
  status: SiformenFormasiStatus;
  catatanVerifikasi: string | null;
  approvedById: string | null;
  approvedAt: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  jabatan: SiformenJabatan | null;
}

export interface SiformenAbk {
  id: string;
  jabatanId: string | null;
  namaJabatan: string;
  unitKerja: string;
  tahun: number;
  uraianTugas: string | null;
  volumeKerja: number;
  normaWaktu: number;
  bebanKerja: number;
  waktuEfektif: number;
  kebutuhanPegawai: number;
  pegawaiAda: number;
  selisih: number;
  keterangan: string | null;
  createdAt: string;
  updatedAt: string;
  jabatan: SiformenJabatan | null;
}

export interface SiformenPaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface SiformenDashboard {
  tahun: number;
  jabatan: { total: number };
  bezetting: {
    total: number;
    filled: number;
    vacant: number;
    acting: number;
    fillRate: number;
  };
  formasi: {
    total: number;
    byStatus: { status: string; count: number; totalUsulan: number }[];
    byJenis: { jenisFormasi: string; count: number; totalUsulan: number }[];
  };
  abk: { total: number };
}

export interface JabatanQuery {
  q?: string;
  jenisJabatan?: string;
  unitKerja?: string;
  isActive?: string;
  page?: number;
  limit?: number;
}

export interface BezettingQuery {
  tahun?: string | number;
  unitKerja?: string;
  statusIsi?: string;
  page?: number;
  limit?: number;
}

export interface FormasiQuery {
  tahun?: string | number;
  unitKerja?: string;
  jenisFormasi?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface AbkQuery {
  tahun?: string | number;
  unitKerja?: string;
  page?: number;
  limit?: number;
}

export interface JabatanFungsionalRefQuery {
  q?: string;
  kategori?: string;
  rumpunJabatan?: string;
  instansiPembina?: string;
  page?: number;
  limit?: number;
}

export interface CreateJabatanFungsionalRefPayload {
  namaJabatan: string;
  jenjang: string;
  kategori: string;
  jenjangAwal?: string;
  jenjangPuncak?: string;
  golonganRuangAwal?: string;
  rumpunJabatan?: string;
  ruangLingkup?: string;
  kedudukan?: string;
  pengisianAsn?: string;
  instansiPembina?: string;
  dasarHukum?: string;
  tugasJabatan?: string;
  pendidikanPengangkatan?: string;
  pendidikanPerpindahan?: string;
  perpresTunjangan?: string;
  besaranTunjangan?: string;
}

export type UpdateJabatanFungsionalRefPayload = Partial<CreateJabatanFungsionalRefPayload>;

export interface BulkImportJabatanItem {
  kodeJabatan: string;
  namaJabatan: string;
  jenisJabatan: string;
  eselonLevel?: string;
  unitKerja: string;
  sortOrder?: number;
}

export interface CreateJabatanPayload {
  kodeJabatan: string;
  namaJabatan: string;
  jenisJabatan: string;
  eselonLevel?: string;
  kelasJabatan?: number;
  unitKerja: string;
  satuanKerja?: string;
  kualifikasiPendidikan?: string;
  jabatanFungsionalRefId?: string;
}

export interface UpdateJabatanPayload {
  namaJabatan?: string;
  jenisJabatan?: string;
  eselonLevel?: string;
  kelasJabatan?: number;
  unitKerja?: string;
  satuanKerja?: string;
  kualifikasiPendidikan?: string;
  isActive?: boolean;
  jabatanFungsionalRefId?: string | null;
}

export interface CreateBezettingPayload {
  jabatanId?: string;
  namaJabatan: string;
  unitKerja: string;
  tahun: number;
  nip?: string;
  namaAsn?: string;
  pangkat?: string;
  golongan?: string;
  tmtJabatan?: string;
  statusIsi?: SiformenBezettingStatus;
  keterangan?: string;
}

export interface UpdateBezettingPayload {
  namaJabatan?: string;
  unitKerja?: string;
  tahun?: number;
  nip?: string;
  namaAsn?: string;
  pangkat?: string;
  golongan?: string;
  tmtJabatan?: string;
  statusIsi?: SiformenBezettingStatus;
  keterangan?: string;
}

export interface CreateFormasiPayload {
  jabatanId?: string;
  namaJabatan: string;
  unitKerja: string;
  jenisFormasi: SiformenFormasiJenis;
  tahun: number;
  periode?: string;
  jumlahKebutuhan: number;
  jumlahTersedia?: number;
  jumlahUsulan?: number;
  kualifikasiPendidikan?: string;
  kualifikasiJurusan?: string;
  alasanKebutuhan?: string;
}

export interface UpdateFormasiPayload {
  namaJabatan?: string;
  unitKerja?: string;
  jenisFormasi?: SiformenFormasiJenis;
  tahun?: number;
  periode?: string;
  jumlahKebutuhan?: number;
  jumlahTersedia?: number;
  jumlahUsulan?: number;
  kualifikasiPendidikan?: string;
  kualifikasiJurusan?: string;
  alasanKebutuhan?: string;
}

export interface ReviewFormasiPayload {
  catatanVerifikasi?: string;
}

export interface CreateAbkPayload {
  jabatanId?: string;
  namaJabatan: string;
  unitKerja: string;
  tahun: number;
  uraianTugas?: string;
  volumeKerja: number;
  normaWaktu: number;
  waktuEfektif?: number;
  pegawaiAda?: number;
  keterangan?: string;
}

export interface UpdateAbkPayload {
  namaJabatan?: string;
  unitKerja?: string;
  tahun?: number;
  uraianTugas?: string;
  volumeKerja?: number;
  normaWaktu?: number;
  waktuEfektif?: number;
  pegawaiAda?: number;
  keterangan?: string;
}

function cleanQuery(obj: Record<string, unknown>): Record<string, string | number | undefined> {
  const result: Record<string, string | number | undefined> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== '' && v !== null) {
      result[k] = typeof v === 'number' || typeof v === 'string' ? v : String(v);
    }
  }
  return result;
}

export const siformenApi = {
  getDashboard(tahun?: number) {
    return apiClient.get<SiformenDashboard>('/siformen/dashboard', tahun ? { tahun } : {});
  },

  // Jabatan Fungsional Ref
  getFilterOptions() {
    return apiClient.get<{ rumpunJabatan: string[]; instansiPembina: string[] }>(
      '/siformen/jabatan-fungsional-ref/filter-options',
    );
  },
  listJabatanFungsionalRef(query: JabatanFungsionalRefQuery = {}) {
    return apiClient.get<SiformenPaginatedResult<SiformenJabatanFungsionalRef>>(
      '/siformen/jabatan-fungsional-ref',
      cleanQuery(query),
    );
  },
  getJabatanFungsionalRef(id: string) {
    return apiClient.get<SiformenJabatanFungsionalRef>(`/siformen/jabatan-fungsional-ref/${id}`);
  },
  createJabatanFungsionalRef(payload: CreateJabatanFungsionalRefPayload) {
    return apiClient.post<SiformenJabatanFungsionalRef>(
      '/siformen/jabatan-fungsional-ref',
      payload,
    );
  },
  bulkImportJabatanFungsionalRef(items: CreateJabatanFungsionalRefPayload[]) {
    return apiClient.post<{ created: number; skipped: number }>(
      '/siformen/jabatan-fungsional-ref/import',
      { items },
    );
  },
  updateJabatanFungsionalRef(id: string, payload: UpdateJabatanFungsionalRefPayload) {
    return apiClient.patch<SiformenJabatanFungsionalRef>(
      `/siformen/jabatan-fungsional-ref/${id}`,
      payload,
    );
  },
  deleteJabatanFungsionalRef(id: string) {
    return apiClient.delete<null>(`/siformen/jabatan-fungsional-ref/${id}`);
  },

  // Jabatan
  listJabatan(query: JabatanQuery = {}) {
    return apiClient.get<SiformenPaginatedResult<SiformenJabatan>>(
      '/siformen/jabatan',
      cleanQuery(query),
    );
  },
  getJabatan(id: string) {
    return apiClient.get<SiformenJabatan>(`/siformen/jabatan/${id}`);
  },
  generateJabatanFromUnitKerja() {
    return apiClient.post<{ created: number; updated: number; skipped: number }>(
      '/siformen/jabatan/generate-from-unit-kerja',
    );
  },
  bulkImportJabatan(items: BulkImportJabatanItem[]) {
    return apiClient.post<{ created: number; updated: number }>('/siformen/jabatan/import', { items });
  },
  createJabatan(payload: CreateJabatanPayload) {
    return apiClient.post<SiformenJabatan>('/siformen/jabatan', payload);
  },
  updateJabatan(id: string, payload: UpdateJabatanPayload) {
    return apiClient.patch<SiformenJabatan>(`/siformen/jabatan/${id}`, payload);
  },
  deleteJabatan(id: string) {
    return apiClient.delete<null>(`/siformen/jabatan/${id}`);
  },

  // Bezetting
  listBezetting(query: BezettingQuery = {}) {
    return apiClient.get<SiformenPaginatedResult<SiformenBezetting>>(
      '/siformen/bezetting',
      cleanQuery(query),
    );
  },
  getBezetting(id: string) {
    return apiClient.get<SiformenBezetting>(`/siformen/bezetting/${id}`);
  },
  createBezetting(payload: CreateBezettingPayload) {
    return apiClient.post<SiformenBezetting>('/siformen/bezetting', payload);
  },
  updateBezetting(id: string, payload: UpdateBezettingPayload) {
    return apiClient.patch<SiformenBezetting>(`/siformen/bezetting/${id}`, payload);
  },
  deleteBezetting(id: string) {
    return apiClient.delete<null>(`/siformen/bezetting/${id}`);
  },

  // Formasi
  listFormasi(query: FormasiQuery = {}) {
    return apiClient.get<SiformenPaginatedResult<SiformenFormasi>>(
      '/siformen/formasi',
      cleanQuery(query),
    );
  },
  getFormasi(id: string) {
    return apiClient.get<SiformenFormasi>(`/siformen/formasi/${id}`);
  },
  createFormasi(payload: CreateFormasiPayload) {
    return apiClient.post<SiformenFormasi>('/siformen/formasi', payload);
  },
  updateFormasi(id: string, payload: UpdateFormasiPayload) {
    return apiClient.patch<SiformenFormasi>(`/siformen/formasi/${id}`, payload);
  },
  submitFormasi(id: string) {
    return apiClient.post<SiformenFormasi>(`/siformen/formasi/${id}/submit`);
  },
  approveFormasi(id: string, payload: ReviewFormasiPayload = {}) {
    return apiClient.post<SiformenFormasi>(`/siformen/formasi/${id}/approve`, payload);
  },
  rejectFormasi(id: string, payload: ReviewFormasiPayload = {}) {
    return apiClient.post<SiformenFormasi>(`/siformen/formasi/${id}/reject`, payload);
  },
  deleteFormasi(id: string) {
    return apiClient.delete<null>(`/siformen/formasi/${id}`);
  },

  // ABK
  getFilledBezettingCount(params: { namaJabatan: string; tahun: number; jabatanId?: string }) {
    return apiClient.get<{ count: number }>('/siformen/abk/bezetting-count', {
      namaJabatan: params.namaJabatan,
      tahun: params.tahun,
      jabatanId: params.jabatanId,
    });
  },

  listAbk(query: AbkQuery = {}) {
    return apiClient.get<SiformenPaginatedResult<SiformenAbk>>('/siformen/abk', cleanQuery(query));
  },
  getAbk(id: string) {
    return apiClient.get<SiformenAbk>(`/siformen/abk/${id}`);
  },
  createAbk(payload: CreateAbkPayload) {
    return apiClient.post<SiformenAbk>('/siformen/abk', payload);
  },
  updateAbk(id: string, payload: UpdateAbkPayload) {
    return apiClient.patch<SiformenAbk>(`/siformen/abk/${id}`, payload);
  },
  deleteAbk(id: string) {
    return apiClient.delete<null>(`/siformen/abk/${id}`);
  },
};

export function formasiStatusLabel(status: SiformenFormasiStatus | string): string {
  const map: Record<SiformenFormasiStatus, string> = {
    DRAFT: 'Draft',
    SUBMITTED: 'Diajukan',
    APPROVED: 'Disetujui',
    REJECTED: 'Ditolak',
  };
  return map[status as SiformenFormasiStatus] ?? status;
}

export function formasiStatusTone(
  status: SiformenFormasiStatus | string,
): 'success' | 'warning' | 'danger' | 'neutral' | 'info' {
  if (status === 'APPROVED') return 'success';
  if (status === 'SUBMITTED') return 'info';
  if (status === 'REJECTED') return 'danger';
  return 'neutral';
}

export function bezettingStatusLabel(status: SiformenBezettingStatus | string): string {
  const map: Record<SiformenBezettingStatus, string> = {
    FILLED: 'Terisi',
    VACANT: 'Kosong',
    ACTING: 'Plt',
  };
  return map[status as SiformenBezettingStatus] ?? status;
}

export function bezettingStatusTone(
  status: SiformenBezettingStatus | string,
): 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 'FILLED') return 'success';
  if (status === 'ACTING') return 'warning';
  return 'danger';
}

export function jenisFormasiLabel(jenis: SiformenFormasiJenis | string): string {
  const map: Record<SiformenFormasiJenis, string> = { CPNS: 'CPNS', PPPK: 'PPPK' };
  return map[jenis as SiformenFormasiJenis] ?? jenis;
}
