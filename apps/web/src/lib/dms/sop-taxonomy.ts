import type { AppRole } from '@/lib/rbac/roles';
import type { DmsAccessLevel, DmsDocumentCategory } from '@/lib/api/dms';

// ─── SOP taxonomy types ───────────────────────────────────────────────────────

export type SopDmsCategory =
  | 'SOP_MANAJEMEN_PPIK'
  | 'SOP_LAYANAN_KEPEGAWAIAN'
  | 'SOP_PENGADAAN_ASN'
  | 'SOP_DATA_KEPEGAWAIAN'
  | 'SOP_SIASN'
  | 'SOP_DMS'
  | 'SOP_PENSIUN'
  | 'SOP_PEMBERHENTIAN'
  | 'SOP_MONITORING';

/**
 * Semantic access level used inside the SOP taxonomy.
 * Maps 1:1 to DmsAccessLevel via sopAccessLevelToDms().
 */
export type SopDmsAccessLevel =
  | 'PUBLIC_INTERNAL'
  | 'BIDANG_PPIK'
  | 'CONFIDENTIAL'
  | 'LEADERSHIP_ONLY'
  | 'ADMIN_ONLY';

export type SopModuleKey =
  | 'KINERJA_BIDANG'
  | 'DMS'
  | 'SIPENSIUN'
  | 'LAYANAN_KEPEGAWAIAN'
  | 'SIDATA'
  | 'SIANALITIK';

export interface SopDmsMapping {
  sopCode: string;
  title: string;
  /** Primary application module that uses this SOP */
  moduleKey: SopModuleKey;
  dmsCategory: DmsDocumentCategory;
  dmsSubCategory: string;
  tags: string[];
  accessLevel: SopDmsAccessLevel;
  allowedRoles: AppRole[];
  /** RHK codes this SOP relates to, if any */
  relatedRhkCodes?: string[];
  description?: string;
}

// ─── Access level mapping ─────────────────────────────────────────────────────

export function sopAccessLevelToDms(level: SopDmsAccessLevel): DmsAccessLevel {
  switch (level) {
    case 'PUBLIC_INTERNAL':
      return 'INTERNAL';
    case 'BIDANG_PPIK':
      return 'TERBATAS';
    case 'CONFIDENTIAL':
      return 'SANGAT_TERBATAS';
    case 'LEADERSHIP_ONLY':
      return 'PIMPINAN';
    case 'ADMIN_ONLY':
      return 'AUDIT';
  }
}

export function sopAccessLevelLabel(level: SopDmsAccessLevel): string {
  const labels: Record<SopDmsAccessLevel, string> = {
    PUBLIC_INTERNAL: 'Internal Umum',
    BIDANG_PPIK: 'Bidang PPIK',
    CONFIDENTIAL: 'Rahasia',
    LEADERSHIP_ONLY: 'Pimpinan',
    ADMIN_ONLY: 'Admin Only',
  };
  return labels[level];
}

// ─── Role sets used in mappings ───────────────────────────────────────────────

const ALL_INTERNAL: AppRole[] = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
  'ANALIS_PERTAMA',
  'PENELAAH',
  'PPPK',
];

const BIDANG_ROLES: AppRole[] = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
  'ANALIS_PERTAMA',
  'PENELAAH',
];

const CONFIDENTIAL_ROLES: AppRole[] = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
  'ANALIS_MADYA',
];

const LEADERSHIP_ROLES: AppRole[] = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
];

const ADMIN_ROLES_LIST: AppRole[] = ['SUPER_ADMIN', 'ADMIN_BKPSDM'];

// ─── SOP DMS mapping catalogue ────────────────────────────────────────────────

export const SOP_DMS_MAPPINGS: SopDmsMapping[] = [
  // ── Tahap 1: Manajemen Bidang PPIK ────────────────────────────────────────

  {
    sopCode: 'SOP-BKPSDM-MAN-001',
    title: 'Perencanaan Program dan Kegiatan Bidang PPIK',
    moduleKey: 'KINERJA_BIDANG',
    dmsCategory: 'DOKUMEN_KEBIJAKAN',
    dmsSubCategory: 'SOP_MANAJEMEN_PPIK',
    tags: ['SOP', 'Manajemen', 'Perencanaan', 'PPIK'],
    accessLevel: 'BIDANG_PPIK',
    allowedRoles: BIDANG_ROLES,
    relatedRhkCodes: ['Semua RHK'],
    description:
      'Mengatur penyusunan rencana program, kegiatan, target, dan jadwal kerja Bidang PPIK.',
  },
  {
    sopCode: 'SOP-BKPSDM-MAN-002',
    title: 'Pembagian Tugas Internal Bidang PPIK',
    moduleKey: 'KINERJA_BIDANG',
    dmsCategory: 'DOKUMEN_KEBIJAKAN',
    dmsSubCategory: 'SOP_MANAJEMEN_PPIK',
    tags: ['SOP', 'Manajemen', 'Pembagian Tugas', 'PPIK'],
    accessLevel: 'BIDANG_PPIK',
    allowedRoles: BIDANG_ROLES,
    relatedRhkCodes: ['Semua RHK'],
    description:
      'Mengatur pembagian tugas Kabid, analis, dan staf berdasarkan fungsi kepegawaian.',
  },
  {
    sopCode: 'SOP-BKPSDM-MAN-003',
    title: 'Monitoring Pelaksanaan Kegiatan Bidang PPIK',
    moduleKey: 'KINERJA_BIDANG',
    dmsCategory: 'DOKUMEN_KEBIJAKAN',
    dmsSubCategory: 'SOP_MANAJEMEN_PPIK',
    tags: ['SOP', 'Manajemen', 'Monitoring', 'PPIK'],
    accessLevel: 'BIDANG_PPIK',
    allowedRoles: BIDANG_ROLES,
    relatedRhkCodes: ['Semua RHK'],
    description:
      'Pemantauan progres kegiatan, hambatan, risiko keterlambatan, dan capaian output bidang.',
  },
  {
    sopCode: 'SOP-BKPSDM-MAN-004',
    title: 'Pelaporan Kinerja Bidang PPIK',
    moduleKey: 'KINERJA_BIDANG',
    dmsCategory: 'LAPORAN_TAHUNAN',
    dmsSubCategory: 'SOP_MANAJEMEN_PPIK',
    tags: ['SOP', 'Manajemen', 'Pelaporan', 'Kinerja', 'PPIK'],
    accessLevel: 'LEADERSHIP_ONLY',
    allowedRoles: LEADERSHIP_ROLES,
    relatedRhkCodes: ['RHK 2'],
    description:
      'Penyusunan laporan kinerja triwulan dan tahunan Bidang PPIK kepada pimpinan.',
  },
  {
    sopCode: 'SOP-BKPSDM-MAN-005',
    title: 'Pengelolaan Dokumen dan Arsip Bidang PPIK',
    moduleKey: 'DMS',
    dmsCategory: 'ARSIP_KEPEGAWAIAN',
    dmsSubCategory: 'SOP_MANAJEMEN_PPIK',
    tags: ['SOP', 'Manajemen', 'Dokumen', 'Arsip', 'PPIK'],
    accessLevel: 'BIDANG_PPIK',
    allowedRoles: BIDANG_ROLES,
    description:
      'Pengelolaan, penyimpanan, dan pengarsipan dokumen kerja Bidang PPIK.',
  },

  // ── Tahap 2: Layanan Kepegawaian ─────────────────────────────────────────

  {
    sopCode: 'SOP-BKPSDM-LAY-001',
    title: 'Penerimaan Permohonan Layanan Kepegawaian',
    moduleKey: 'LAYANAN_KEPEGAWAIAN',
    dmsCategory: 'DOKUMEN_KEBIJAKAN',
    dmsSubCategory: 'SOP_LAYANAN_KEPEGAWAIAN',
    tags: ['SOP', 'Layanan', 'Penerimaan', 'Kepegawaian'],
    accessLevel: 'PUBLIC_INTERNAL',
    allowedRoles: ALL_INTERNAL,
    description:
      'Prosedur penerimaan dan pencatatan awal permohonan layanan kepegawaian dari ASN atau OPD.',
  },
  {
    sopCode: 'SOP-BKPSDM-LAY-002',
    title: 'Verifikasi Kelengkapan Berkas Layanan',
    moduleKey: 'LAYANAN_KEPEGAWAIAN',
    dmsCategory: 'DOKUMEN_KEBIJAKAN',
    dmsSubCategory: 'SOP_LAYANAN_KEPEGAWAIAN',
    tags: ['SOP', 'Layanan', 'Verifikasi', 'Berkas'],
    accessLevel: 'PUBLIC_INTERNAL',
    allowedRoles: ALL_INTERNAL,
    description:
      'Pemeriksaan dan verifikasi kelengkapan berkas permohonan layanan kepegawaian.',
  },
  {
    sopCode: 'SOP-BKPSDM-LAY-003',
    title: 'Monitoring SLA Layanan Kepegawaian',
    moduleKey: 'LAYANAN_KEPEGAWAIAN',
    dmsCategory: 'LAPORAN_BULANAN',
    dmsSubCategory: 'SOP_LAYANAN_KEPEGAWAIAN',
    tags: ['SOP', 'Layanan', 'Monitoring', 'SLA'],
    accessLevel: 'BIDANG_PPIK',
    allowedRoles: BIDANG_ROLES,
    description:
      'Pemantauan pemenuhan SLA layanan kepegawaian dan identifikasi kasus berisiko terlambat.',
  },
  {
    sopCode: 'SOP-BKPSDM-LAY-004',
    title: 'Penanganan Keterlambatan Layanan',
    moduleKey: 'LAYANAN_KEPEGAWAIAN',
    dmsCategory: 'DOKUMEN_KEBIJAKAN',
    dmsSubCategory: 'SOP_LAYANAN_KEPEGAWAIAN',
    tags: ['SOP', 'Layanan', 'Keterlambatan', 'Penanganan'],
    accessLevel: 'BIDANG_PPIK',
    allowedRoles: BIDANG_ROLES,
    description:
      'Prosedur eskalasi dan penanganan keterlambatan penyelesaian layanan kepegawaian.',
  },
  {
    sopCode: 'SOP-BKPSDM-LAY-005',
    title: 'Evaluasi Kepuasan Layanan Kepegawaian',
    moduleKey: 'LAYANAN_KEPEGAWAIAN',
    dmsCategory: 'LAPORAN_BULANAN',
    dmsSubCategory: 'SOP_LAYANAN_KEPEGAWAIAN',
    tags: ['SOP', 'Layanan', 'Evaluasi', 'IKM', 'Kepuasan'],
    accessLevel: 'BIDANG_PPIK',
    allowedRoles: BIDANG_ROLES,
    description:
      'Pengumpulan dan analisis data kepuasan ASN/OPD terhadap layanan kepegawaian.',
  },

  // ── Tahap 3: Fungsi Spesifik PPIK ─────────────────────────────────────────

  {
    sopCode: 'SOP-BKPSDM-FNG-001',
    title: 'Penyusunan Rencana Kebutuhan ASN',
    moduleKey: 'KINERJA_BIDANG',
    dmsCategory: 'DOKUMEN_KEBIJAKAN',
    dmsSubCategory: 'SOP_PENGADAAN_ASN',
    tags: ['SOP', 'Pengadaan', 'Rencana', 'Kebutuhan ASN'],
    accessLevel: 'BIDANG_PPIK',
    allowedRoles: BIDANG_ROLES,
    relatedRhkCodes: ['RHK 1'],
    description:
      'Penyusunan dokumen rencana kebutuhan formasi ASN tahunan berdasarkan analisis jabatan.',
  },
  {
    sopCode: 'SOP-BKPSDM-FNG-002',
    title: 'Verifikasi Usulan Formasi ASN',
    moduleKey: 'KINERJA_BIDANG',
    dmsCategory: 'DOKUMEN_KEBIJAKAN',
    dmsSubCategory: 'SOP_PENGADAAN_ASN',
    tags: ['SOP', 'Pengadaan', 'Verifikasi', 'Formasi ASN'],
    accessLevel: 'BIDANG_PPIK',
    allowedRoles: BIDANG_ROLES,
    relatedRhkCodes: ['RHK 1'],
    description:
      'Verifikasi dan validasi usulan formasi ASN dari OPD sebelum diteruskan ke BKN.',
  },
  {
    sopCode: 'SOP-BKPSDM-DAT-002',
    title: 'Pemutakhiran Data ASN Umum / Non-Pensiun',
    moduleKey: 'SIDATA',
    dmsCategory: 'DATA_ASN',
    dmsSubCategory: 'SOP_DATA_KEPEGAWAIAN',
    tags: ['SOP', 'Data', 'Pemutakhiran', 'ASN'],
    accessLevel: 'BIDANG_PPIK',
    allowedRoles: BIDANG_ROLES,
    relatedRhkCodes: ['RHK 3'],
    description:
      'Prosedur pemutakhiran data ASN aktif di SIASN/MySAPK dan sistem lokal BKPSDM.',
  },
  {
    sopCode: 'SOP-BKPSDM-SIK-002',
    title: 'Sinkronisasi Data Kepegawaian dengan SIASN/MySAPK',
    moduleKey: 'SIDATA',
    dmsCategory: 'DATA_ASN',
    dmsSubCategory: 'SOP_SIASN',
    tags: ['SOP', 'SIASN', 'MySAPK', 'Sinkronisasi', 'Data'],
    accessLevel: 'BIDANG_PPIK',
    allowedRoles: BIDANG_ROLES,
    relatedRhkCodes: ['RHK 3'],
    description:
      'Sinkronisasi periodik data kepegawaian antara sistem lokal BKPSDM dan SIASN/MySAPK BKN.',
  },

  // ── DMS & Pengelolaan Dokumen ──────────────────────────────────────────────

  {
    sopCode: 'SOP-BKPSDM-DMS-001',
    title: 'Pengelolaan Dokumen Digital Kepegawaian',
    moduleKey: 'DMS',
    dmsCategory: 'ARSIP_KEPEGAWAIAN',
    dmsSubCategory: 'SOP_DMS',
    tags: ['SOP', 'DMS', 'Dokumen Digital', 'Kepegawaian'],
    accessLevel: 'BIDANG_PPIK',
    allowedRoles: BIDANG_ROLES,
    description:
      'Tata kelola penyimpanan, pengarsipan, dan pengelolaan dokumen digital kepegawaian di DMS.',
  },

  // ── Paket Pensiun ─────────────────────────────────────────────────────────

  {
    sopCode: 'SOP-BKPSDM-PAN-001',
    title: 'Penerimaan Usulan Pensiun ASN',
    moduleKey: 'SIPENSIUN',
    dmsCategory: 'ARSIP_KEPEGAWAIAN',
    dmsSubCategory: 'SOP_PENSIUN',
    tags: ['SOP', 'Pensiun', 'Penerimaan', 'Usulan'],
    accessLevel: 'PUBLIC_INTERNAL',
    allowedRoles: ALL_INTERNAL,
    description:
      'Penerimaan dan pencatatan awal usulan pensiun ASN yang diajukan oleh OPD atau ASN bersangkutan.',
  },
  {
    sopCode: 'SOP-BKPSDM-PAN-002',
    title: 'Verifikasi Berkas Usulan Pensiun ASN',
    moduleKey: 'SIPENSIUN',
    dmsCategory: 'ARSIP_KEPEGAWAIAN',
    dmsSubCategory: 'SOP_PENSIUN',
    tags: ['SOP', 'Pensiun', 'Verifikasi', 'Berkas'],
    accessLevel: 'BIDANG_PPIK',
    allowedRoles: BIDANG_ROLES,
    description:
      'Pemeriksaan kelengkapan dan keabsahan berkas usulan pensiun sebelum diproses lebih lanjut.',
  },
  {
    sopCode: 'SOP-BKPSDM-PAN-003',
    title: 'Pengusulan Pensiun BUP',
    moduleKey: 'SIPENSIUN',
    dmsCategory: 'ARSIP_KEPEGAWAIAN',
    dmsSubCategory: 'SOP_PENSIUN',
    tags: ['SOP', 'Pensiun', 'BUP', 'Batas Usia'],
    accessLevel: 'CONFIDENTIAL',
    allowedRoles: CONFIDENTIAL_ROLES,
    relatedRhkCodes: ['RHK 4', 'RHK 5'],
    description:
      'Proses pengusulan pensiun ASN yang mencapai batas usia pensiun kepada BKN.',
  },
  {
    sopCode: 'SOP-BKPSDM-PAN-004',
    title: 'Pengusulan Pensiun Janda/Duda/Yatim/Piatu/Ahli Waris',
    moduleKey: 'SIPENSIUN',
    dmsCategory: 'ARSIP_KEPEGAWAIAN',
    dmsSubCategory: 'SOP_PENSIUN',
    tags: ['SOP', 'Pensiun', 'Janda', 'Duda', 'Ahli Waris'],
    accessLevel: 'CONFIDENTIAL',
    allowedRoles: CONFIDENTIAL_ROLES,
    relatedRhkCodes: ['RHK 4', 'RHK 5'],
    description:
      'Pengusulan hak pensiun kepada ahli waris ASN yang meninggal dunia.',
  },

  // ── Monitoring Pensiun/Pemberhentian ─────────────────────────────────────

  {
    sopCode: 'SOP-BKPSDM-MON-001',
    title: 'Monitoring Status Usulan Pensiun/Pemberhentian ASN',
    moduleKey: 'SIPENSIUN',
    dmsCategory: 'LAPORAN_BULANAN',
    dmsSubCategory: 'SOP_MONITORING',
    tags: ['SOP', 'Monitoring', 'Pensiun', 'Pemberhentian', 'Status'],
    accessLevel: 'BIDANG_PPIK',
    allowedRoles: BIDANG_ROLES,
    relatedRhkCodes: ['RHK 4', 'RHK 5'],
    description:
      'Pemantauan status proses usulan pensiun dan pemberhentian ASN yang sedang berjalan.',
  },

  // ── Paket Pemberhentian ASN ───────────────────────────────────────────────

  {
    sopCode: 'SOP-BKPSDM-PBH-001',
    title: 'Pemberhentian PNS Atas Permintaan Sendiri',
    moduleKey: 'SIPENSIUN',
    dmsCategory: 'ARSIP_KEPEGAWAIAN',
    dmsSubCategory: 'SOP_PEMBERHENTIAN',
    tags: ['SOP', 'Pemberhentian', 'Permintaan Sendiri', 'PNS'],
    accessLevel: 'CONFIDENTIAL',
    allowedRoles: CONFIDENTIAL_ROLES,
    relatedRhkCodes: ['RHK 5'],
    description:
      'Prosedur pemberhentian PNS yang mengajukan permohonan berhenti atas kemauan sendiri.',
  },
  {
    sopCode: 'SOP-BKPSDM-PBH-002',
    title: 'Pemberhentian PNS Karena Tidak Cakap Jasmani/Rohani',
    moduleKey: 'SIPENSIUN',
    dmsCategory: 'ARSIP_KEPEGAWAIAN',
    dmsSubCategory: 'SOP_PEMBERHENTIAN',
    tags: ['SOP', 'Pemberhentian', 'Kesehatan', 'Jasmani', 'Rohani'],
    accessLevel: 'CONFIDENTIAL',
    allowedRoles: CONFIDENTIAL_ROLES,
    relatedRhkCodes: ['RHK 5'],
    description:
      'Pemberhentian PNS yang dinyatakan tidak cakap jasmani dan/atau rohani oleh tim medis.',
  },
  {
    sopCode: 'SOP-BKPSDM-PBH-003',
    title: 'Pemberhentian PNS Karena Meninggal Dunia/Tewas/Hilang',
    moduleKey: 'SIPENSIUN',
    dmsCategory: 'ARSIP_KEPEGAWAIAN',
    dmsSubCategory: 'SOP_PEMBERHENTIAN',
    tags: ['SOP', 'Pemberhentian', 'Meninggal', 'Tewas', 'Hilang'],
    accessLevel: 'CONFIDENTIAL',
    allowedRoles: CONFIDENTIAL_ROLES,
    relatedRhkCodes: ['RHK 5'],
    description:
      'Prosedur pemberhentian dan pengajuan hak kepegawaian PNS yang meninggal dunia, tewas dalam tugas, atau hilang.',
  },
  {
    sopCode: 'SOP-BKPSDM-PBH-004',
    title: 'Pemberhentian PNS Karena Pelanggaran Disiplin/Hukum',
    moduleKey: 'SIPENSIUN',
    dmsCategory: 'ARSIP_KEPEGAWAIAN',
    dmsSubCategory: 'SOP_PEMBERHENTIAN',
    tags: ['SOP', 'Pemberhentian', 'Disiplin', 'Pelanggaran Hukum'],
    accessLevel: 'CONFIDENTIAL',
    allowedRoles: CONFIDENTIAL_ROLES,
    relatedRhkCodes: ['RHK 5'],
    description:
      'Pemberhentian PNS tidak dengan hormat akibat pelanggaran disiplin berat atau tindak pidana.',
  },
  {
    sopCode: 'SOP-BKPSDM-PBH-005',
    title: 'Pemberhentian Sementara PNS',
    moduleKey: 'SIPENSIUN',
    dmsCategory: 'ARSIP_KEPEGAWAIAN',
    dmsSubCategory: 'SOP_PEMBERHENTIAN',
    tags: ['SOP', 'Pemberhentian Sementara', 'PNS'],
    accessLevel: 'CONFIDENTIAL',
    allowedRoles: CONFIDENTIAL_ROLES,
    relatedRhkCodes: ['RHK 5'],
    description:
      'Prosedur pemberhentian sementara PNS selama dalam proses hukum atau pemeriksaan.',
  },
  {
    sopCode: 'SOP-BKPSDM-PBH-006',
    title: 'Pengaktifan Kembali PNS',
    moduleKey: 'SIPENSIUN',
    dmsCategory: 'ARSIP_KEPEGAWAIAN',
    dmsSubCategory: 'SOP_PEMBERHENTIAN',
    tags: ['SOP', 'Pengaktifan Kembali', 'PNS', 'Rehabilitasi'],
    accessLevel: 'CONFIDENTIAL',
    allowedRoles: CONFIDENTIAL_ROLES,
    relatedRhkCodes: ['RHK 5'],
    description:
      'Prosedur pengaktifan kembali PNS yang sebelumnya diberhentikan sementara dan dinyatakan tidak bersalah.',
  },
  {
    sopCode: 'SOP-BKPSDM-PBH-007',
    title: 'Pemberhentian Karena Perampingan Organisasi/Kebijakan Pemerintah',
    moduleKey: 'SIPENSIUN',
    dmsCategory: 'ARSIP_KEPEGAWAIAN',
    dmsSubCategory: 'SOP_PEMBERHENTIAN',
    tags: ['SOP', 'Pemberhentian', 'Perampingan', 'Reorganisasi'],
    accessLevel: 'CONFIDENTIAL',
    allowedRoles: CONFIDENTIAL_ROLES,
    relatedRhkCodes: ['RHK 5'],
    description:
      'Pemberhentian PNS akibat kebijakan pemerintah berupa perampingan organisasi atau penghapusan jabatan.',
  },
  {
    sopCode: 'SOP-BKPSDM-PBH-008',
    title: 'Penyerahan Keputusan Pensiun/Pemberhentian ASN',
    moduleKey: 'SIPENSIUN',
    dmsCategory: 'ARSIP_KEPEGAWAIAN',
    dmsSubCategory: 'SOP_PEMBERHENTIAN',
    tags: ['SOP', 'Penyerahan', 'SK Pensiun', 'Keputusan'],
    accessLevel: 'CONFIDENTIAL',
    allowedRoles: CONFIDENTIAL_ROLES,
    relatedRhkCodes: ['RHK 4', 'RHK 5'],
    description:
      'Penyerahan surat keputusan pensiun atau pemberhentian kepada ASN yang bersangkutan.',
  },
  {
    sopCode: 'SOP-BKPSDM-DAT-003',
    title: 'Pemutakhiran Data ASN Setelah Keputusan Pemberhentian/Pensiun',
    moduleKey: 'SIDATA',
    dmsCategory: 'DATA_ASN',
    dmsSubCategory: 'SOP_DATA_KEPEGAWAIAN',
    tags: ['SOP', 'Data', 'Pemutakhiran', 'Pensiun', 'Pemberhentian'],
    accessLevel: 'BIDANG_PPIK',
    allowedRoles: BIDANG_ROLES,
    relatedRhkCodes: ['RHK 3', 'RHK 4', 'RHK 5'],
    description:
      'Pemutakhiran status dan data ASN di SIASN/MySAPK setelah terbitnya keputusan pensiun atau pemberhentian.',
  },
];

// ─── Lookup index (built once at module load) ─────────────────────────────────

const _byCode = new Map<string, SopDmsMapping>(
  SOP_DMS_MAPPINGS.map((item) => [item.sopCode, item]),
);

// ─── Helper functions ─────────────────────────────────────────────────────────

export function getSopDmsMappingByCode(
  code: string,
): SopDmsMapping | undefined {
  return _byCode.get(code);
}

export function getSopDmsMappingsByModule(
  moduleKey: SopModuleKey,
): SopDmsMapping[] {
  return SOP_DMS_MAPPINGS.filter((item) => item.moduleKey === moduleKey);
}

export function getSopDmsMappingsBySubCategory(
  subCategory: string,
): SopDmsMapping[] {
  return SOP_DMS_MAPPINGS.filter(
    (item) => item.dmsSubCategory === subCategory,
  );
}

export function getSopAccessLevel(
  code: string,
): SopDmsAccessLevel | undefined {
  return _byCode.get(code)?.accessLevel;
}

export function canAccessSopDocument(
  role: AppRole,
  sopCode: string,
): boolean {
  const mapping = _byCode.get(sopCode);
  if (!mapping) {
    return false;
  }
  return (mapping.allowedRoles as AppRole[]).includes(role);
}

// ─── Category metadata ────────────────────────────────────────────────────────

export const SOP_DMS_CATEGORY_LABELS: Record<SopDmsCategory, string> = {
  SOP_MANAJEMEN_PPIK: 'Manajemen Bidang PPIK',
  SOP_LAYANAN_KEPEGAWAIAN: 'Layanan Kepegawaian',
  SOP_PENGADAAN_ASN: 'Pengadaan ASN',
  SOP_DATA_KEPEGAWAIAN: 'Data Kepegawaian',
  SOP_SIASN: 'SIASN / MySAPK',
  SOP_DMS: 'Pengelolaan Dokumen Digital',
  SOP_PENSIUN: 'Pensiun ASN',
  SOP_PEMBERHENTIAN: 'Pemberhentian ASN',
  SOP_MONITORING: 'Monitoring Status',
};

export const SOP_DMS_CATEGORIES: SopDmsCategory[] = [
  'SOP_MANAJEMEN_PPIK',
  'SOP_LAYANAN_KEPEGAWAIAN',
  'SOP_PENGADAAN_ASN',
  'SOP_DATA_KEPEGAWAIAN',
  'SOP_SIASN',
  'SOP_DMS',
  'SOP_PENSIUN',
  'SOP_PEMBERHENTIAN',
  'SOP_MONITORING',
];

export function sopCategoryLabel(category: SopDmsCategory): string {
  return SOP_DMS_CATEGORY_LABELS[category];
}

/** Returns the SopDmsCategory that maps to the given dmsSubCategory string. */
export function subCategoryToSopCategory(
  subCategory: string,
): SopDmsCategory | undefined {
  return SOP_DMS_CATEGORIES.find((cat) => cat === subCategory);
}

/** True when a dmsSubCategory string belongs to SOP taxonomy. */
export function isSopSubCategory(subCategory: string): boolean {
  return SOP_DMS_CATEGORIES.includes(subCategory as SopDmsCategory);
}

/** All SOP codes whose dmsSubCategory matches given subCategory. */
export function getSopCodesForSubCategory(subCategory: string): string[] {
  return getSopDmsMappingsBySubCategory(subCategory).map(
    (item) => item.sopCode,
  );
}

/** Unused roles list, reserved for future SEKRETARIS/AUDITOR expansion. */
export const RESERVED_ROLES_NOTE =
  'SEKRETARIS dan AUDITOR belum diaktifkan di Sprint 11–12. ' +
  'Tambahkan ke allowedRoles ketika role tersebut diaktifkan.';

/** All unique SOP module keys used in the taxonomy. */
export const SOP_MODULE_KEYS: SopModuleKey[] = [
  'KINERJA_BIDANG',
  'DMS',
  'SIPENSIUN',
  'LAYANAN_KEPEGAWAIAN',
  'SIDATA',
  'SIANALITIK',
];

export const SOP_MODULE_LABELS: Record<SopModuleKey, string> = {
  KINERJA_BIDANG: 'Kinerja Bidang',
  DMS: 'DMS',
  SIPENSIUN: 'SIPENSIUN',
  LAYANAN_KEPEGAWAIAN: 'Layanan Kepegawaian',
  SIDATA: 'SIDATA ASN',
  SIANALITIK: 'SIANALITIK',
};

// Kept here so admin_roles is not referenced as unused
export { ADMIN_ROLES_LIST as SOP_ADMIN_ROLES };
