import { apiClient } from './client';

export type JenisPemberhentian =
  | 'APS'
  | 'DH_BUP' | 'DH_BERAKHIR_PPPK' | 'DH_MENINGGAL' | 'DH_PERAMPINGAN' | 'DH_TIDAK_CAKAP' | 'DH_TIDAK_KINERJA'
  | 'TDH_PANCASILA' | 'TDH_DISIPLIN' | 'TDH_PIDANA' | 'TDH_PARPOL'
  | 'SEM_PEJABAT_NEGARA' | 'SEM_KOMISIONER' | 'SEM_CLTN' | 'SEM_DITAHAN';

export type KategoriPemberhentian = 'APS' | 'DENGAN_HORMAT' | 'TIDAK_DENGAN_HORMAT' | 'SEMENTARA';

export type StatusPemberhentian =
  | 'DRAFT'
  | 'PENGUMPULAN_BERKAS'
  | 'VERIFIKASI_BERKAS'
  | 'NOTA_USUL'
  | 'DIKIRIM_BKN'
  | 'PROSES_BKN'
  | 'SK_TERBIT'
  | 'DIKEMBALIKAN'
  | 'SELESAI'
  | 'DIBATALKAN';

export const JENIS_LABEL: Record<JenisPemberhentian, string> = {
  APS: 'Atas Permintaan Sendiri',
  DH_BUP: 'Batas Usia Pensiun (BUP)',
  DH_BERAKHIR_PPPK: 'Berakhir Masa PPPK',
  DH_MENINGGAL: 'Meninggal Dunia',
  DH_PERAMPINGAN: 'Perampingan Organisasi',
  DH_TIDAK_CAKAP: 'Tidak Cakap Jasmani/Rohani',
  DH_TIDAK_KINERJA: 'Tidak Menunjukkan Kinerja',
  TDH_PANCASILA: 'Penyelewengan Pancasila/UUD',
  TDH_DISIPLIN: 'Hukuman Disiplin Berat',
  TDH_PIDANA: 'Tindak Pidana Jabatan',
  TDH_PARPOL: 'Menjadi Anggota Parpol',
  SEM_PEJABAT_NEGARA: 'Diangkat Pejabat Negara',
  SEM_KOMISIONER: 'Diangkat Komisioner/Anggota LNS',
  SEM_CLTN: 'Cuti di Luar Tanggungan Negara',
  SEM_DITAHAN: 'Ditahan (Tersangka/Terdakwa)',
};

export const STATUS_LABEL: Record<StatusPemberhentian, string> = {
  DRAFT: 'Draft',
  PENGUMPULAN_BERKAS: 'Pengumpulan Berkas',
  VERIFIKASI_BERKAS: 'Verifikasi Berkas',
  NOTA_USUL: 'Nota Usul',
  DIKIRIM_BKN: 'Dikirim ke BKN',
  PROSES_BKN: 'Proses di BKN',
  SK_TERBIT: 'SK Terbit',
  DIKEMBALIKAN: 'Dikembalikan',
  SELESAI: 'Selesai',
  DIBATALKAN: 'Dibatalkan',
};

export const STATUS_COLOR: Record<StatusPemberhentian, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PENGUMPULAN_BERKAS: 'bg-blue-100 text-blue-700',
  VERIFIKASI_BERKAS: 'bg-yellow-100 text-yellow-700',
  NOTA_USUL: 'bg-purple-100 text-purple-700',
  DIKIRIM_BKN: 'bg-indigo-100 text-indigo-700',
  PROSES_BKN: 'bg-orange-100 text-orange-700',
  SK_TERBIT: 'bg-green-100 text-green-700',
  DIKEMBALIKAN: 'bg-red-100 text-red-700',
  SELESAI: 'bg-emerald-100 text-emerald-700',
  DIBATALKAN: 'bg-gray-200 text-gray-500',
};

export const JENIS_BY_KATEGORI: Record<KategoriPemberhentian, JenisPemberhentian[]> = {
  APS: ['APS'],
  DENGAN_HORMAT: ['DH_BUP', 'DH_BERAKHIR_PPPK', 'DH_MENINGGAL', 'DH_PERAMPINGAN', 'DH_TIDAK_CAKAP', 'DH_TIDAK_KINERJA'],
  TIDAK_DENGAN_HORMAT: ['TDH_PANCASILA', 'TDH_DISIPLIN', 'TDH_PIDANA', 'TDH_PARPOL'],
  SEMENTARA: ['SEM_PEJABAT_NEGARA', 'SEM_KOMISIONER', 'SEM_CLTN', 'SEM_DITAHAN'],
};

export const KATEGORI_LABEL: Record<KategoriPemberhentian, string> = {
  APS: 'Atas Permintaan Sendiri',
  DENGAN_HORMAT: 'Dengan Hormat',
  TIDAK_DENGAN_HORMAT: 'Tidak Dengan Hormat',
  SEMENTARA: 'Pemberhentian Sementara',
};

export interface AsnSummary {
  id: string;
  nip: string;
  nama: string;
  jabatanNama: string | null;
  jenisJabatanNama: string | null;
  golonganNama: string | null;
  pangkatNama?: string | null;
  tmtPensiun: string | null;
  unitKerja: { id: string; nama: string } | null;
}

export interface ProsesListItem {
  id: string;
  asnId: string;
  jenisPemberhentian: JenisPemberhentian;
  jenisLabel: string;
  kategori: KategoriPemberhentian;
  status: StatusPemberhentian;
  statusLabel: string;
  tmtPemberhentian: string | null;
  nomorSk: string | null;
  nomorUsul: string | null;
  asn: AsnSummary;
  createdAt: string;
  updatedAt: string;
}

export interface StatusHistoryItem {
  id: string;
  statusDari: StatusPemberhentian | null;
  statusKe: StatusPemberhentian;
  catatan: string | null;
  createdAt: string;
  createdBy: string | null;
}

export interface DokumenItem {
  id: string;
  jenisDokumen: string;
  namaFile: string;
  storagePath: string;
  fileSize: number | null;
  mimeType: string | null;
  keterangan: string | null;
  createdAt: string;
  createdBy: string | null;
}

export interface NextTransition {
  status: StatusPemberhentian;
  label: string;
}

export interface ProsesDetail extends ProsesListItem {
  tanggalSk: string | null;
  tanggalUsul: string | null;
  nomorPengembalian: string | null;
  alasanPengembalian: string | null;
  catatan: string | null;
  nextTransitions: NextTransition[];
  statusHistory: StatusHistoryItem[];
  dokumen: DokumenItem[];
}

export interface AsnMendekatiPensiun {
  id: string;
  nip: string;
  nama: string;
  jabatanNama: string | null;
  jenisJabatanNama: string | null;
  golonganNama: string | null;
  tmtPensiun: string | null;
  unitKerja: { id: string; nama: string } | null;
  prosesAktif: { id: string; status: StatusPemberhentian; jenisPemberhentian: JenisPemberhentian } | null;
  hariMenujuPensiun: number | null;
}

export interface MonitoringResult {
  periode: number;
  asnMendekatiPensiun: AsnMendekatiPensiun[];
  statusSummary: Partial<Record<StatusPemberhentian, number>>;
}

export interface PaginatedProses {
  items: ProsesListItem[];
  page: number;
  limit: number;
  total: number;
}

export function getMonitoring(bulan?: number) {
  return apiClient.get<MonitoringResult>(
    '/pemberhentian/monitoring',
    bulan ? { bulan: bulan.toString() } : undefined,
  );
}

export function listProses(params?: {
  q?: string;
  status?: StatusPemberhentian;
  jenis?: JenisPemberhentian;
  page?: number;
  limit?: number;
}) {
  const p: Record<string, string> = {};
  if (params?.q) p.q = params.q;
  if (params?.status) p.status = params.status;
  if (params?.jenis) p.jenis = params.jenis;
  if (params?.page) p.page = params.page.toString();
  if (params?.limit) p.limit = params.limit.toString();
  return apiClient.get<PaginatedProses>('/pemberhentian/proses', Object.keys(p).length ? p : undefined);
}

export function getProses(id: string) {
  return apiClient.get<ProsesDetail>(`/pemberhentian/proses/${id}`);
}

export function createProses(body: {
  asnId: string;
  jenisPemberhentian: JenisPemberhentian;
  tmtPemberhentian?: string;
  catatan?: string;
}) {
  return apiClient.post<ProsesDetail>('/pemberhentian/proses', body);
}

export function updateProses(
  id: string,
  body: {
    tmtPemberhentian?: string | null;
    nomorSk?: string | null;
    tanggalSk?: string | null;
    nomorUsul?: string | null;
    tanggalUsul?: string | null;
    nomorPengembalian?: string | null;
    alasanPengembalian?: string | null;
    catatan?: string | null;
  },
) {
  return apiClient.patch<ProsesDetail>(`/pemberhentian/proses/${id}`, body);
}

export function transisiStatus(
  id: string,
  body: { statusKe: StatusPemberhentian; catatan?: string },
) {
  return apiClient.post<ProsesDetail>(`/pemberhentian/proses/${id}/transisi`, body);
}

export function deleteProses(id: string) {
  return apiClient.delete<{ id: string }>(`/pemberhentian/proses/${id}`);
}

export function addDokumen(
  prosesId: string,
  body: {
    jenisDokumen: string;
    namaFile: string;
    storagePath: string;
    fileSize?: number;
    mimeType?: string;
    keterangan?: string;
  },
) {
  return apiClient.post<DokumenItem>(`/pemberhentian/proses/${prosesId}/dokumen`, body);
}

export function deleteDokumen(prosesId: string, dokId: string) {
  return apiClient.delete<{ id: string }>(`/pemberhentian/proses/${prosesId}/dokumen/${dokId}`);
}

export const pemberhentianApi = {
  getMonitoring,
  listProses,
  getProses,
  createProses,
  updateProses,
  transisiStatus,
  deleteProses,
  addDokumen,
  deleteDokumen,
};
