export type SopStage = 1 | 2 | 3;

export type SopStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED';

export type SopRiskStatus =
  | 'AMAN'
  | 'PERLU_PERHATIAN'
  | 'TERLAMBAT'
  | 'BELUM_ADA_BUKTI';

export type SopTargetUnit = 'Laporan' | 'Dokumen';

export interface SopProcedureStep {
  no: number;
  activity: string;
  actor: string;
  input: string;
  process: string;
  output: string;
  duration: string;
  note?: string;
}

export interface SopSignature {
  role: string;
  namePlaceholder: string;
}

export interface SopItem {
  id: string;
  code: string;
  title: string;
  stage: SopStage;
  stageTitle: string;
  rhkCodes: string[];
  targetQuantity: number;
  targetUnit: SopTargetUnit;
  qualityTarget: string;
  timeTarget: string;
  status: SopStatus;
  shortDescription: string;

  /**
   * true = SOP utama yang langsung menjadi indikator/RHK.
   * false = SOP pendukung/manajemen/layanan yang mendukung pelaksanaan RHK.
   */
  isRhkPrimary: boolean;
}

export interface SopDetail extends SopItem {
  legalBasis: string[];
  objective: string;
  scope: string;
  outputs: string[];
  evidenceExamples: string[];
  procedureSteps: SopProcedureStep[];
  signatures: SopSignature[];
}

export interface SopProgress {
  sopId: string;
  year: number;
  target: number;
  realization: number;
  verifiedEvidence: number;
  progressPercent: number;
  riskStatus: SopRiskStatus;
}

export interface SopStageGroup {
  stage: SopStage;
  title: string;
  description: string;
  toneClass: string;
  items: SopItem[];
}

const STAGE_1_TITLE = 'SOP Manajemen Bidang';
const STAGE_2_TITLE = 'SOP Pengelolaan Layanan Kepegawaian';
const STAGE_3_TITLE = 'SOP Fungsi Spesifik Bidang';

export const MANAGEMENT_SOP_ITEMS: SopItem[] = [
  {
    id: 'perencanaan-program-kegiatan-bidang',
    code: 'SOP-BKPSDM-MAN-001',
    title: 'Perencanaan Program dan Kegiatan Bidang',
    stage: 1,
    stageTitle: STAGE_1_TITLE,
    rhkCodes: ['Semua RHK'],
    targetQuantity: 1,
    targetUnit: 'Dokumen',
    qualityTarget: '90%–100%',
    timeTarget: 'Tahunan / awal tahun anggaran',
    status: 'ACTIVE',
    isRhkPrimary: false,
    shortDescription:
      'Mengatur penyusunan rencana program, kegiatan, target, jadwal, kebutuhan data, dan pembagian prioritas kerja Bidang PPIK.',
  },
  {
    id: 'pembagian-tugas-internal-bidang',
    code: 'SOP-BKPSDM-MAN-002',
    title: 'Pembagian Tugas Internal Bidang',
    stage: 1,
    stageTitle: STAGE_1_TITLE,
    rhkCodes: ['Semua RHK'],
    targetQuantity: 1,
    targetUnit: 'Dokumen',
    qualityTarget: '90%–100%',
    timeTarget: 'Tahunan / sesuai kebutuhan',
    status: 'ACTIVE',
    isRhkPrimary: false,
    shortDescription:
      'Mengatur pembagian tugas Kabid, analis, pelaksana, dan staf berdasarkan fungsi pengadaan, pemberhentian, data, dan informasi kepegawaian.',
  },
  {
    id: 'monitoring-pelaksanaan-kegiatan-bidang',
    code: 'SOP-BKPSDM-MAN-003',
    title: 'Monitoring Pelaksanaan Kegiatan Bidang',
    stage: 1,
    stageTitle: STAGE_1_TITLE,
    rhkCodes: ['Semua RHK'],
    targetQuantity: 12,
    targetUnit: 'Laporan',
    qualityTarget: '90%–100%',
    timeTarget: 'Bulanan',
    status: 'ACTIVE',
    isRhkPrimary: false,
    shortDescription:
      'Mengatur pemantauan progres kegiatan, hambatan, risiko keterlambatan, tindak lanjut, dan capaian output bidang.',
  },
  {
    id: 'pelaporan-kinerja-bidang',
    code: 'SOP-BKPSDM-MAN-004',
    title: 'Pelaporan Kinerja Bidang',
    stage: 1,
    stageTitle: STAGE_1_TITLE,
    rhkCodes: ['RHK 2'],
    targetQuantity: 1,
    targetUnit: 'Dokumen',
    qualityTarget: '90%–100%',
    timeTarget: 'Tahunan / periodik',
    status: 'ACTIVE',
    isRhkPrimary: false,
    shortDescription:
      'Mengatur penyusunan laporan kinerja bidang berdasarkan capaian RHK, realisasi kegiatan, kendala, tindak lanjut, dan bukti dukung.',
  },
  {
    id: 'pengelolaan-dokumen-arsip-bidang',
    code: 'SOP-BKPSDM-MAN-005',
    title: 'Pengelolaan Dokumen dan Arsip Bidang',
    stage: 1,
    stageTitle: STAGE_1_TITLE,
    rhkCodes: ['RHK 7'],
    targetQuantity: 12,
    targetUnit: 'Laporan',
    qualityTarget: '90%–100%',
    timeTarget: 'Bulanan',
    status: 'ACTIVE',
    isRhkPrimary: false,
    shortDescription:
      'Mengatur pengelolaan dokumen kerja, arsip bidang, bukti dukung kegiatan, serta penyimpanan dokumen formal bidang.',
  },
];

export const SERVICE_SOP_ITEMS: SopItem[] = [
  {
    id: 'penerimaan-permohonan-layanan-kepegawaian',
    code: 'SOP-BKPSDM-LAY-001',
    title: 'Penerimaan Permohonan Layanan Kepegawaian',
    stage: 2,
    stageTitle: STAGE_2_TITLE,
    rhkCodes: ['RHK 1', 'RHK 3', 'RHK 4', 'RHK 8'],
    targetQuantity: 12,
    targetUnit: 'Laporan',
    qualityTarget: '90%–100%',
    timeTarget: 'Bulanan / sesuai layanan',
    status: 'ACTIVE',
    isRhkPrimary: false,
    shortDescription:
      'Mengatur penerimaan permohonan layanan kepegawaian dari OPD/ASN, pencatatan, pemeriksaan awal, dan distribusi tindak lanjut.',
  },
  {
    id: 'verifikasi-kelengkapan-berkas-layanan',
    code: 'SOP-BKPSDM-LAY-002',
    title: 'Verifikasi Kelengkapan Berkas Layanan',
    stage: 2,
    stageTitle: STAGE_2_TITLE,
    rhkCodes: ['RHK 1', 'RHK 3'],
    targetQuantity: 12,
    targetUnit: 'Laporan',
    qualityTarget: '90%–100%',
    timeTarget: 'Bulanan / sesuai SLA',
    status: 'ACTIVE',
    isRhkPrimary: false,
    shortDescription:
      'Mengatur pemeriksaan kelengkapan dan kesesuaian berkas layanan sebelum diproses ke tahap teknis atau diteruskan ke instansi terkait.',
  },
  {
    id: 'monitoring-sla-layanan-kepegawaian',
    code: 'SOP-BKPSDM-LAY-003',
    title: 'Monitoring SLA Layanan Kepegawaian',
    stage: 2,
    stageTitle: STAGE_2_TITLE,
    rhkCodes: ['RHK 8'],
    targetQuantity: 12,
    targetUnit: 'Laporan',
    qualityTarget: '90%–100%',
    timeTarget: 'Bulanan',
    status: 'ACTIVE',
    isRhkPrimary: false,
    shortDescription:
      'Mengatur pemantauan ketepatan waktu layanan, identifikasi layanan berisiko terlambat, dan pelaporan SLA.',
  },
  {
    id: 'penanganan-keterlambatan-layanan',
    code: 'SOP-BKPSDM-LAY-004',
    title: 'Penanganan Keterlambatan Layanan',
    stage: 2,
    stageTitle: STAGE_2_TITLE,
    rhkCodes: ['RHK 8'],
    targetQuantity: 12,
    targetUnit: 'Laporan',
    qualityTarget: '90%–100%',
    timeTarget: 'Bulanan / insidental',
    status: 'ACTIVE',
    isRhkPrimary: false,
    shortDescription:
      'Mengatur tindak lanjut atas layanan yang melewati batas waktu, termasuk identifikasi penyebab, eskalasi, dan perbaikan proses.',
  },
  {
    id: 'evaluasi-kepuasan-layanan',
    code: 'SOP-BKPSDM-LAY-005',
    title: 'Evaluasi Kepuasan Layanan',
    stage: 2,
    stageTitle: STAGE_2_TITLE,
    rhkCodes: ['RHK 8'],
    targetQuantity: 2,
    targetUnit: 'Laporan',
    qualityTarget: '90%–100%',
    timeTarget: 'Semesteran',
    status: 'ACTIVE',
    isRhkPrimary: false,
    shortDescription:
      'Mengatur evaluasi kepuasan pengguna layanan, analisis masukan, dan rekomendasi perbaikan layanan kepegawaian.',
  },
];

export const FUNCTIONAL_SOP_ITEMS: SopItem[] = [
  {
    id: 'penyusunan-rencana-kebutuhan-asn',
    code: 'SOP-BKPSDM-FNG-001',
    title: 'Penyusunan Rencana Kebutuhan ASN',
    stage: 3,
    stageTitle: STAGE_3_TITLE,
    rhkCodes: ['RHK 1'],
    targetQuantity: 1,
    targetUnit: 'Dokumen',
    qualityTarget: '90%–100%',
    timeTarget: 'Tahunan / sesuai jadwal nasional',
    status: 'ACTIVE',
    isRhkPrimary: false,
    shortDescription:
      'Mengatur penyusunan kebutuhan ASN berdasarkan analisis jabatan, analisis beban kerja, data pegawai, dan kebutuhan organisasi.',
  },
  {
    id: 'verifikasi-usulan-formasi-asn',
    code: 'SOP-BKPSDM-FNG-002',
    title: 'Verifikasi Usulan Formasi ASN',
    stage: 3,
    stageTitle: STAGE_3_TITLE,
    rhkCodes: ['RHK 1'],
    targetQuantity: 1,
    targetUnit: 'Dokumen',
    qualityTarget: '90%–100%',
    timeTarget: 'Tahunan / sesuai jadwal nasional',
    status: 'ACTIVE',
    isRhkPrimary: false,
    shortDescription:
      'Mengatur verifikasi usulan formasi ASN dari perangkat daerah sebelum menjadi bahan pengusulan kebutuhan ASN.',
  },
  {
    id: 'pengendalian-pelaksanaan-pengadaan-asn',
    code: 'SOP-BKPSDM-PAN-001',
    title: 'Pengendalian Pelaksanaan Pengadaan ASN',
    stage: 3,
    stageTitle: STAGE_3_TITLE,
    rhkCodes: ['RHK 1'],
    targetQuantity: 5,
    targetUnit: 'Laporan',
    qualityTarget: '90%–100%',
    timeTarget: 'Tahunan / sesuai tahapan pengadaan',
    status: 'ACTIVE',
    isRhkPrimary: true,
    shortDescription:
      'Mengatur pengendalian pelaksanaan pengadaan ASN mulai dari perencanaan, koordinasi, pelaksanaan, pemantauan, hingga pelaporan.',
  },
  {
    id: 'evaluasi-kinerja-bidang',
    code: 'SOP-BKPSDM-EVK-001',
    title: 'Evaluasi Kinerja Bidang',
    stage: 1,
    stageTitle: STAGE_1_TITLE,
    rhkCodes: ['RHK 2'],
    targetQuantity: 1,
    targetUnit: 'Dokumen',
    qualityTarget: '90%–100%',
    timeTarget: 'Tahunan',
    status: 'ACTIVE',
    isRhkPrimary: true,
    shortDescription:
      'Mengatur evaluasi capaian kinerja bidang berdasarkan target RHK, realisasi kegiatan, kendala, tindak lanjut, dan bukti dukung.',
  },
  {
    id: 'pengendalian-pemberhentian-asn',
    code: 'SOP-BKPSDM-PBH-001',
    title: 'Pengendalian Pemberhentian ASN',
    stage: 3,
    stageTitle: STAGE_3_TITLE,
    rhkCodes: ['RHK 3'],
    targetQuantity: 12,
    targetUnit: 'Laporan',
    qualityTarget: '90%–100%',
    timeTarget: 'Bulanan',
    status: 'ACTIVE',
    isRhkPrimary: true,
    shortDescription:
      'Mengatur pengendalian proses pemberhentian ASN, termasuk pensiun BUP, APS, meninggal dunia, tewas, hilang, dan jenis pemberhentian lainnya.',
  },
  {
    id: 'fasilitasi-lembaga-profesi-asn',
    code: 'SOP-BKPSDM-LPA-001',
    title: 'Fasilitasi Lembaga Profesi ASN',
    stage: 3,
    stageTitle: STAGE_3_TITLE,
    rhkCodes: ['RHK 4'],
    targetQuantity: 3,
    targetUnit: 'Laporan',
    qualityTarget: '90%–100%',
    timeTarget: 'Triwulan / sesuai kebutuhan',
    status: 'ACTIVE',
    isRhkPrimary: true,
    shortDescription:
      'Mengatur fasilitasi kelembagaan profesi ASN, koordinasi, pembinaan, dokumentasi, dan pelaporan hasil fasilitasi.',
  },
  {
    id: 'pengelolaan-sistem-informasi-kepegawaian',
    code: 'SOP-BKPSDM-SIK-001',
    title: 'Pengelolaan Sistem Informasi Kepegawaian',
    stage: 3,
    stageTitle: STAGE_3_TITLE,
    rhkCodes: ['RHK 5'],
    targetQuantity: 12,
    targetUnit: 'Laporan',
    qualityTarget: '90%–100%',
    timeTarget: 'Bulanan',
    status: 'ACTIVE',
    isRhkPrimary: true,
    shortDescription:
      'Mengatur pengelolaan sistem informasi kepegawaian, pemeliharaan aplikasi, monitoring operasional sistem, dan pelaporan layanan informasi.',
  },
  {
    id: 'pengendalian-pengelolaan-data-asn',
    code: 'SOP-BKPSDM-DAT-001',
    title: 'Pengendalian Pengelolaan Data ASN',
    stage: 3,
    stageTitle: STAGE_3_TITLE,
    rhkCodes: ['RHK 6'],
    targetQuantity: 12,
    targetUnit: 'Laporan',
    qualityTarget: '90%–100%',
    timeTarget: 'Bulanan',
    status: 'ACTIVE',
    isRhkPrimary: true,
    shortDescription:
      'Mengatur pengendalian data ASN agar lengkap, mutakhir, konsisten, tervalidasi, dan dapat digunakan sebagai dasar layanan kepegawaian.',
  },
  {
    id: 'pengelolaan-dms-data-kepegawaian',
    code: 'SOP-BKPSDM-DMS-001',
    title: 'Pengelolaan DMS & Data Kepegawaian',
    stage: 3,
    stageTitle: STAGE_3_TITLE,
    rhkCodes: ['RHK 7'],
    targetQuantity: 12,
    targetUnit: 'Laporan',
    qualityTarget: '90%–100%',
    timeTarget: 'Bulanan',
    status: 'ACTIVE',
    isRhkPrimary: true,
    shortDescription:
      'Mengatur kegiatan/program pengelolaan dokumen dan data kepegawaian ASN, termasuk pemutakhiran dan verifikasi dokumen/data sesuai kebutuhan program nasional BKN.',
  },
  {
    id: 'monev-publikasi-layanan-informasi-kepegawaian',
    code: 'SOP-BKPSDM-LIK-001',
    title: 'Monev Publikasi Layanan Informasi Kepegawaian',
    stage: 3,
    stageTitle: STAGE_3_TITLE,
    rhkCodes: ['RHK 8'],
    targetQuantity: 2,
    targetUnit: 'Laporan',
    qualityTarget: '90%–100%',
    timeTarget: 'Semesteran',
    status: 'ACTIVE',
    isRhkPrimary: true,
    shortDescription:
      'Mengatur monitoring dan evaluasi publikasi layanan informasi kepegawaian agar informasi layanan tersedia, mutakhir, jelas, dan mudah diakses.',
  },
];

/**
 * Master utama seluruh paket SOP Bidang PPIK.
 * Mulai sekarang komponen daftar, peta, dan detail SOP sebaiknya membaca dari SOP_ITEMS.
 */
export const SOP_ITEMS: SopItem[] = [
  ...MANAGEMENT_SOP_ITEMS,
  ...SERVICE_SOP_ITEMS,
  ...FUNCTIONAL_SOP_ITEMS,
];

/**
 * SOP utama yang langsung menjadi target/RHK.
 * Monitoring RHK tetap memakai koleksi ini.
 */
export const SOP_RHK_PRIMARY_ITEMS: SopItem[] = SOP_ITEMS.filter(
  (item) => item.isRhkPrimary,
);

export const SOP_STAGE_GROUPS: SopStageGroup[] = [
  {
    stage: 1,
    title: 'Tahap 1 — SOP Manajemen Bidang',
    description:
      'Mengatur cara kerja internal bidang, pembagian tugas, monitoring, pelaporan, dan pengelolaan arsip bidang.',
    toneClass: 'border-indigo-200 bg-indigo-50 text-indigo-900',
    items: SOP_ITEMS.filter((item) => item.stage === 1),
  },
  {
    stage: 2,
    title: 'Tahap 2 — SOP Pengelolaan Layanan Kepegawaian',
    description:
      'Mengatur alur layanan, verifikasi berkas, pemantauan SLA, penanganan keterlambatan, dan evaluasi kepuasan layanan.',
    toneClass: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    items: SOP_ITEMS.filter((item) => item.stage === 2),
  },
  {
    stage: 3,
    title: 'Tahap 3 — SOP Fungsi Spesifik Bidang',
    description:
      'Mengeksekusi fungsi teknis Bidang PPIK yang berkaitan dengan pengadaan, pemberhentian, data, sistem informasi, dan publikasi layanan.',
    toneClass: 'border-orange-200 bg-orange-50 text-orange-900',
    items: SOP_ITEMS.filter((item) => item.stage === 3),
  },
];

const commonLegalBasis = [
  'Undang-Undang Nomor 20 Tahun 2023 tentang Aparatur Sipil Negara.',
  'Peraturan Pemerintah tentang Manajemen PNS dan/atau manajemen ASN sesuai ketentuan yang berlaku.',
  'Peraturan BKN terkait tata kelola data, layanan, dan administrasi kepegawaian.',
  'Peraturan daerah/peraturan kepala daerah terkait organisasi dan tata kerja BKPSDM.',
  'Dokumen perencanaan, perjanjian kinerja, dan RHK Bidang PPIK.',
];

const commonSignatures: SopSignature[] = [
  {
    role: 'Disusun oleh',
    namePlaceholder: 'Analis / Pelaksana terkait',
  },
  {
    role: 'Diperiksa oleh',
    namePlaceholder: 'Kepala Bidang PPIK',
  },
  {
    role: 'Disahkan oleh',
    namePlaceholder: 'Kepala BKPSDM',
  },
];

function buildProcedureSteps(title: string): SopProcedureStep[] {
  return [
    {
      no: 1,
      activity: 'Menyiapkan rencana kerja dan data awal',
      actor: 'Analis / Pelaksana',
      input: 'Target RHK, data awal, jadwal kerja, dan dokumen pendukung',
      process: `Mengidentifikasi kebutuhan, ruang lingkup, pelaksana, dan tahapan kerja ${title}.`,
      output: 'Rencana kerja kegiatan',
      duration: '1 hari kerja',
    },
    {
      no: 2,
      activity: 'Mengumpulkan dan memeriksa dokumen/data pendukung',
      actor: 'Analis / Pelaksana',
      input: 'Data ASN, dokumen, laporan, permohonan, atau bahan teknis',
      process:
        'Memeriksa kelengkapan, kesesuaian, validitas, dan keterkaitan data/dokumen dengan kegiatan.',
      output: 'Daftar data/dokumen valid dan belum valid',
      duration: '1–3 hari kerja',
    },
    {
      no: 3,
      activity: 'Melaksanakan proses teknis sesuai SOP',
      actor: 'Analis terkait',
      input: 'Data/dokumen yang telah diperiksa',
      process: `Melaksanakan proses utama sesuai ruang lingkup ${title}.`,
      output: 'Hasil pelaksanaan kegiatan',
      duration: 'Sesuai kompleksitas kegiatan',
    },
    {
      no: 4,
      activity: 'Menyusun rekapitulasi dan draft laporan',
      actor: 'Analis terkait',
      input: 'Hasil kegiatan teknis',
      process:
        'Menyusun rekap capaian, kendala, tindak lanjut, dan daftar bukti dukung kegiatan.',
      output: 'Draft laporan kegiatan',
      duration: '1 hari kerja',
    },
    {
      no: 5,
      activity: 'Melakukan review dan validasi',
      actor: 'Kepala Bidang',
      input: 'Draft laporan dan bukti dukung',
      process:
        'Melakukan pemeriksaan substansi, capaian target, risiko, tindak lanjut, dan kelayakan bukti dukung.',
      output: 'Laporan tervalidasi',
      duration: '1 hari kerja',
    },
    {
      no: 6,
      activity: 'Finalisasi dan pengarsipan bukti dukung',
      actor: 'Pelaksana / Analis',
      input: 'Laporan tervalidasi',
      process:
        'Menyimpan laporan dan bukti dukung pada media arsip atau modul DMS Bukti Dukung.',
      output: 'Bukti dukung tersimpan',
      duration: '1 hari kerja',
    },
  ];
}

function buildObjective(item: SopItem): string {
  if (item.id === 'pengelolaan-dms-data-kepegawaian') {
    return 'Menjamin pelaksanaan pengelolaan dokumen dan data kepegawaian ASN berjalan terarah, terdokumentasi, sesuai kebutuhan program nasional BKN, dan menghasilkan laporan yang dapat dipertanggungjawabkan.';
  }

  if (item.stage === 1) {
    return `Menjamin ${item.title.toLowerCase()} berjalan tertib, terukur, terdokumentasi, dan mendukung pencapaian target RHK Bidang PPIK.`;
  }

  if (item.stage === 2) {
    return `Menjamin ${item.title.toLowerCase()} berjalan konsisten, tepat waktu, transparan, dan mendukung mutu pelayanan kepegawaian.`;
  }

  return `Menjamin ${item.title.toLowerCase()} berjalan terarah, terukur, sesuai ketentuan, dan menghasilkan output yang mendukung capaian RHK Bidang PPIK.`;
}

function buildScope(item: SopItem): string {
  if (item.id === 'pengelolaan-dms-data-kepegawaian') {
    return 'Meliputi pengumpulan data/dokumen kepegawaian ASN, pemantauan kelengkapan, verifikasi status dokumen/data, tindak lanjut perbaikan, rekapitulasi hasil, dan penyusunan laporan bulanan kegiatan.';
  }

  if (item.stage === 1) {
    return 'Meliputi perencanaan internal, pembagian tugas, koordinasi, monitoring, evaluasi, pelaporan, dan pengarsipan dokumen bidang.';
  }

  if (item.stage === 2) {
    return 'Meliputi penerimaan permohonan, pemeriksaan berkas, pencatatan layanan, pemantauan SLA, tindak lanjut keterlambatan, dan evaluasi layanan.';
  }

  return `Meliputi perencanaan, pelaksanaan, verifikasi, monitoring, pelaporan, dan pengarsipan bukti dukung atas ${item.title.toLowerCase()}.`;
}

function buildOutputs(item: SopItem): string[] {
  if (item.id === 'pengelolaan-dms-data-kepegawaian') {
    return [
      'Rekapitulasi dokumen dan data kepegawaian ASN.',
      'Daftar ASN/data/dokumen yang perlu pemutakhiran.',
      'Daftar tindak lanjut perbaikan data/dokumen.',
      'Laporan bulanan pengelolaan DMS & data kepegawaian.',
      'Bukti dukung RHK 7.',
    ];
  }

  if (item.isRhkPrimary) {
    return [
      `Laporan ${item.title}.`,
      'Rekapitulasi capaian target.',
      'Daftar kendala dan tindak lanjut.',
      'Bukti dukung kegiatan.',
    ];
  }

  return [
    `Dokumen pelaksanaan ${item.title}.`,
    'Rekapitulasi kegiatan.',
    'Catatan kendala dan tindak lanjut.',
    'Bukti dukung pendukung SOP/RHK.',
  ];
}

function buildEvidenceExamples(item: SopItem): string[] {
  if (item.id === 'pengelolaan-dms-data-kepegawaian') {
    return [
      'Rekapitulasi data/dokumen kepegawaian ASN.',
      'Daftar ASN/data/dokumen yang perlu perbaikan.',
      'Nota dinas hasil pemantauan/pemutakhiran.',
      'Laporan bulanan pengelolaan DMS & data kepegawaian.',
      'Dokumen pendukung program nasional BKN.',
    ];
  }

  if (item.stage === 1) {
    return [
      'Rencana kerja bidang.',
      'Matriks pembagian tugas.',
      'Laporan monitoring internal.',
      'Laporan kinerja bidang.',
      'Arsip dokumen kegiatan.',
    ];
  }

  if (item.stage === 2) {
    return [
      'Register layanan.',
      'Daftar verifikasi berkas.',
      'Rekap SLA layanan.',
      'Daftar layanan terlambat dan tindak lanjut.',
      'Rekap evaluasi kepuasan layanan.',
    ];
  }

  return [
    'Laporan kegiatan.',
    'Nota dinas atau berita acara.',
    'Rekap data pendukung.',
    'Dokumen hasil validasi.',
    'Dokumentasi kegiatan.',
  ];
}

function buildSopDetail(item: SopItem): SopDetail {
  return {
    ...item,
    legalBasis: commonLegalBasis,
    objective: buildObjective(item),
    scope: buildScope(item),
    outputs: buildOutputs(item),
    evidenceExamples: buildEvidenceExamples(item),
    procedureSteps: buildProcedureSteps(item.title),
    signatures: commonSignatures,
  };
}

export const SOP_DETAILS: SopDetail[] = SOP_ITEMS.map(buildSopDetail);

export const SOP_PROGRESS: SopProgress[] = [
  {
    sopId: 'pengendalian-pelaksanaan-pengadaan-asn',
    year: 2026,
    target: 5,
    realization: 3,
    verifiedEvidence: 3,
    progressPercent: 60,
    riskStatus: 'PERLU_PERHATIAN',
  },
  {
    sopId: 'evaluasi-kinerja-bidang',
    year: 2026,
    target: 1,
    realization: 0,
    verifiedEvidence: 0,
    progressPercent: 0,
    riskStatus: 'BELUM_ADA_BUKTI',
  },
  {
    sopId: 'pengendalian-pemberhentian-asn',
    year: 2026,
    target: 12,
    realization: 5,
    verifiedEvidence: 5,
    progressPercent: 42,
    riskStatus: 'PERLU_PERHATIAN',
  },
  {
    sopId: 'fasilitasi-lembaga-profesi-asn',
    year: 2026,
    target: 3,
    realization: 1,
    verifiedEvidence: 1,
    progressPercent: 33,
    riskStatus: 'PERLU_PERHATIAN',
  },
  {
    sopId: 'pengelolaan-sistem-informasi-kepegawaian',
    year: 2026,
    target: 12,
    realization: 6,
    verifiedEvidence: 5,
    progressPercent: 50,
    riskStatus: 'AMAN',
  },
  {
    sopId: 'pengendalian-pengelolaan-data-asn',
    year: 2026,
    target: 12,
    realization: 6,
    verifiedEvidence: 6,
    progressPercent: 50,
    riskStatus: 'AMAN',
  },
  {
    sopId: 'pengelolaan-dms-data-kepegawaian',
    year: 2026,
    target: 12,
    realization: 8,
    verifiedEvidence: 8,
    progressPercent: 67,
    riskStatus: 'AMAN',
  },
  {
    sopId: 'monev-publikasi-layanan-informasi-kepegawaian',
    year: 2026,
    target: 2,
    realization: 0,
    verifiedEvidence: 0,
    progressPercent: 0,
    riskStatus: 'BELUM_ADA_BUKTI',
  },
];

export function getSopDetail(idOrCode: string | undefined): SopDetail | undefined {
  if (!idOrCode) {
    return undefined;
  }

  const normalized = decodeURIComponent(idOrCode).toLowerCase();

  return SOP_DETAILS.find(
    (item) =>
      item.id.toLowerCase() === normalized ||
      item.code.toLowerCase() === normalized,
  );
}

export function getSopItemById(id: string): SopItem | undefined {
  return SOP_ITEMS.find((item) => item.id === id);
}

export function getTotalSopCount(): number {
  return SOP_ITEMS.length;
}

export function getStageSopCount(stage: SopStage): number {
  return SOP_ITEMS.filter((item) => item.stage === stage).length;
}

export function getRhkPrimarySopCount(): number {
  return SOP_RHK_PRIMARY_ITEMS.length;
}

/**
 * Backward compatible.
 * Dipakai oleh komponen lama, tetapi sekarang dihitung dari SOP utama RHK.
 */
export function getTotalTarget(): number {
  return SOP_RHK_PRIMARY_ITEMS.reduce(
    (total, item) => total + item.targetQuantity,
    0,
  );
}

export function getTotalRealization(): number {
  return SOP_PROGRESS.reduce((total, item) => total + item.realization, 0);
}

export function getTotalVerifiedEvidence(): number {
  return SOP_PROGRESS.reduce((total, item) => total + item.verifiedEvidence, 0);
}

export function getAverageProgress(): number {
  if (SOP_PROGRESS.length === 0) {
    return 0;
  }

  const total = SOP_PROGRESS.reduce(
    (sum, item) => sum + item.progressPercent,
    0,
  );

  return Math.round(total / SOP_PROGRESS.length);
}

export function getRiskCount(): number {
  return SOP_PROGRESS.filter(
    (item) =>
      item.riskStatus === 'PERLU_PERHATIAN' ||
      item.riskStatus === 'TERLAMBAT' ||
      item.riskStatus === 'BELUM_ADA_BUKTI',
  ).length;
}

export function formatRiskStatus(value: SopRiskStatus): string {
  const labels: Record<SopRiskStatus, string> = {
    AMAN: 'Aman',
    PERLU_PERHATIAN: 'Perlu Perhatian',
    TERLAMBAT: 'Terlambat',
    BELUM_ADA_BUKTI: 'Belum Ada Bukti',
  };

  return labels[value];
}

export function getRiskTone(
  value: SopRiskStatus,
): 'success' | 'warning' | 'danger' | 'neutral' {
  if (value === 'AMAN') {
    return 'success';
  }

  if (value === 'TERLAMBAT') {
    return 'danger';
  }

  if (value === 'BELUM_ADA_BUKTI') {
    return 'neutral';
  }

  return 'warning';
}
