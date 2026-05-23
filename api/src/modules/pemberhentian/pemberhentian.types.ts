import { JenisPemberhentian, StatusPemberhentian } from '@prisma/client';

export { JenisPemberhentian, StatusPemberhentian };

export type JenisPemberhentianKategori =
  | 'APS'
  | 'DENGAN_HORMAT'
  | 'TIDAK_DENGAN_HORMAT'
  | 'SEMENTARA';

export const JENIS_KATEGORI_MAP: Record<JenisPemberhentian, JenisPemberhentianKategori> = {
  APS: 'APS',
  DH_BUP: 'DENGAN_HORMAT',
  DH_BERAKHIR_PPPK: 'DENGAN_HORMAT',
  DH_MENINGGAL: 'DENGAN_HORMAT',
  DH_PERAMPINGAN: 'DENGAN_HORMAT',
  DH_TIDAK_CAKAP: 'DENGAN_HORMAT',
  DH_TIDAK_KINERJA: 'DENGAN_HORMAT',
  TDH_PANCASILA: 'TIDAK_DENGAN_HORMAT',
  TDH_DISIPLIN: 'TIDAK_DENGAN_HORMAT',
  TDH_PIDANA: 'TIDAK_DENGAN_HORMAT',
  TDH_PARPOL: 'TIDAK_DENGAN_HORMAT',
  SEM_PEJABAT_NEGARA: 'SEMENTARA',
  SEM_KOMISIONER: 'SEMENTARA',
  SEM_CLTN: 'SEMENTARA',
  SEM_DITAHAN: 'SEMENTARA',
};

export const JENIS_LABEL_MAP: Record<JenisPemberhentian, string> = {
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

export const STATUS_LABEL_MAP: Record<StatusPemberhentian, string> = {
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

// Valid forward transitions per status
export const STATUS_TRANSITIONS: Partial<Record<StatusPemberhentian, StatusPemberhentian[]>> = {
  DRAFT: ['PENGUMPULAN_BERKAS', 'DIBATALKAN'],
  PENGUMPULAN_BERKAS: ['VERIFIKASI_BERKAS', 'DIBATALKAN'],
  VERIFIKASI_BERKAS: ['NOTA_USUL', 'PENGUMPULAN_BERKAS', 'DIBATALKAN'],
  NOTA_USUL: ['DIKIRIM_BKN', 'VERIFIKASI_BERKAS', 'DIBATALKAN'],
  DIKIRIM_BKN: ['PROSES_BKN', 'DIKEMBALIKAN'],
  PROSES_BKN: ['SK_TERBIT', 'DIKEMBALIKAN'],
  SK_TERBIT: ['SELESAI'],
  DIKEMBALIKAN: ['NOTA_USUL', 'DIBATALKAN'],
};

// BUP per jabatan (years) per UU 20/2023 Pasal 55
export const BUP_BY_JABATAN: Record<string, number> = {
  'JPT Utama': 60,
  'JPT Madya': 60,
  'JPT Pratama': 60,
  Administrator: 58,
  Pengawas: 58,
  Pelaksana: 58,
};

export type CreatePemberhentianDto = {
  asnId: string;
  jenisPemberhentian: JenisPemberhentian;
  tmtPemberhentian?: string;
  catatan?: string;
};

export type UpdatePemberhentianDto = {
  tmtPemberhentian?: string | null;
  nomorSk?: string | null;
  tanggalSk?: string | null;
  nomorUsul?: string | null;
  tanggalUsul?: string | null;
  nomorPengembalian?: string | null;
  alasanPengembalian?: string | null;
  catatan?: string | null;
};

export type TransisiStatusDto = {
  statusKe: StatusPemberhentian;
  catatan?: string;
};

export type AddDokumenDto = {
  jenisDokumen: string;
  namaFile: string;
  storagePath: string;
  fileSize?: number;
  mimeType?: string;
  keterangan?: string;
};

export type PemberhentianListQuery = {
  q?: string;
  status?: StatusPemberhentian;
  jenisPemberhentian?: JenisPemberhentian;
  page: number;
  limit: number;
};
