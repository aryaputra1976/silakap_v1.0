export type SipensiunJenisKey =
  | 'BUP'
  | 'AHLI_WARIS'
  | 'APS'
  | 'TIDAK_CAKAP'
  | 'MENINGGAL_TEWAS_HILANG'
  | 'DISIPLIN_HUKUM'
  | 'SEMENTARA'
  | 'AKTIF_KEMBALI'
  | 'PERAMPINGAN'
  | 'PENYERAHAN'
  | 'UPDATE_DATA';

export type SipensiunViewKey =
  | 'dashboard'
  | 'received'
  | 'verification'
  | 'monitoring'
  | 'decision-delivery'
  | 'data-update'
  | 'reports';

export interface SipensiunSopInfo {
  code: string;
  title: string;
  rhkCode: string;
  dmsQuery: string;
}

export interface SipensiunLifecycleStep {
  label: string;
  mapState: string[];
  description: string;
}

export interface SipensiunJenisConfig {
  key: SipensiunJenisKey;
  label: string;
  shortLabel: string;
  description: string;
  /** Existing DB jenisPensiun values to use as API filter. Empty = show all. */
  dbJenisPensiun: string[];
  rhkCode: string;
  tone: 'info' | 'warning' | 'danger' | 'success' | 'neutral';
  sops: SipensiunSopInfo[];
  lifecycle: SipensiunLifecycleStep[];
}

const LIFECYCLE_SHARED_TAIL: SipensiunLifecycleStep[] = [
  {
    label: 'Keputusan Diterbitkan',
    mapState: ['APPROVAL', 'COMPLETED'],
    description: 'SK pensiun/pemberhentian diterbitkan dari BKN/BKD.',
  },
  {
    label: 'Penyerahan SK',
    mapState: ['COMPLETED'],
    description: 'Keputusan diserahkan kepada ASN bersangkutan.',
  },
  {
    label: 'Pemutakhiran Data',
    mapState: ['COMPLETED'],
    description: 'Data ASN diperbarui di SIDATA setelah SK terbit.',
  },
];

export const SIPENSIUN_JENIS_LIST: SipensiunJenisConfig[] = [
  {
    key: 'BUP',
    label: 'Pensiun Batas Usia Pensiun (BUP)',
    shortLabel: 'BUP',
    description: 'Pensiun karena telah mencapai batas usia pensiun sesuai ketentuan.',
    dbJenisPensiun: ['BUP'],
    rhkCode: 'RHK 3',
    tone: 'info',
    sops: [
      { code: 'SOP-BKPSDM-PAN-001', title: 'Penerimaan Usulan Pensiun ASN', rhkCode: 'RHK 3', dmsQuery: 'category=DOKUMEN_KEBIJAKAN&subCategory=SOP_PENSIUN_PEMBERHENTIAN&q=Penerimaan+Usulan' },
      { code: 'SOP-BKPSDM-PAN-002', title: 'Verifikasi Berkas Usulan Pensiun ASN', rhkCode: 'RHK 3', dmsQuery: 'category=DOKUMEN_KEBIJAKAN&subCategory=SOP_PENSIUN_PEMBERHENTIAN&q=Verifikasi+Berkas' },
      { code: 'SOP-BKPSDM-PAN-003', title: 'Pengusulan Pensiun BUP', rhkCode: 'RHK 3', dmsQuery: 'category=DOKUMEN_KEBIJAKAN&subCategory=SOP_PENSIUN_PEMBERHENTIAN&q=Pengusulan+BUP' },
      { code: 'SOP-BKPSDM-MON-001', title: 'Monitoring Status Usulan Pensiun/Pemberhentian', rhkCode: 'RHK 3', dmsQuery: 'category=DOKUMEN_KEBIJAKAN&subCategory=SOP_PENSIUN_PEMBERHENTIAN&q=Monitoring' },
    ],
    lifecycle: [
      { label: 'Penerimaan Usulan', mapState: ['DRAFT'], description: 'Usulan pensiun BUP diterima dari ASN atau unit kerja.' },
      { label: 'Verifikasi Berkas', mapState: ['SUBMITTED', 'VERIFICATION'], description: 'Kelengkapan berkas administratif diperiksa.' },
      { label: 'Pengusulan ke BKN', mapState: ['VERIFICATION', 'APPROVAL'], description: 'Berkas diteruskan ke BKN untuk pengusulan resmi.' },
      ...LIFECYCLE_SHARED_TAIL,
    ],
  },
  {
    key: 'AHLI_WARIS',
    label: 'Pensiun Janda/Duda/Yatim Piatu/Ahli Waris',
    shortLabel: 'Ahli Waris',
    description: 'Pensiun diteruskan kepada janda, duda, yatim piatu, atau ahli waris ASN.',
    dbJenisPensiun: ['JDU', 'YATIM_PIATU'],
    rhkCode: 'RHK 3',
    tone: 'neutral',
    sops: [
      { code: 'SOP-BKPSDM-PAN-001', title: 'Penerimaan Usulan Pensiun ASN', rhkCode: 'RHK 3', dmsQuery: 'category=DOKUMEN_KEBIJAKAN&subCategory=SOP_PENSIUN_PEMBERHENTIAN&q=Penerimaan+Usulan' },
      { code: 'SOP-BKPSDM-PAN-002', title: 'Verifikasi Berkas Usulan Pensiun ASN', rhkCode: 'RHK 3', dmsQuery: 'category=DOKUMEN_KEBIJAKAN&subCategory=SOP_PENSIUN_PEMBERHENTIAN&q=Verifikasi+Berkas' },
      { code: 'SOP-BKPSDM-PAN-004', title: 'Pengusulan Pensiun Janda/Duda/Yatim/Piatu/Ahli Waris', rhkCode: 'RHK 3', dmsQuery: 'category=DOKUMEN_KEBIJAKAN&subCategory=SOP_PENSIUN_PEMBERHENTIAN&q=Ahli+Waris' },
    ],
    lifecycle: [
      { label: 'Penerimaan Permohonan', mapState: ['DRAFT'], description: 'Permohonan diterima dari ahli waris ASN.' },
      { label: 'Verifikasi Identitas', mapState: ['SUBMITTED', 'VERIFICATION'], description: 'Identitas ahli waris dan hubungan keluarga diverifikasi.' },
      { label: 'Pengusulan ke BKN', mapState: ['VERIFICATION', 'APPROVAL'], description: 'Berkas diteruskan ke BKN.' },
      ...LIFECYCLE_SHARED_TAIL,
    ],
  },
  {
    key: 'APS',
    label: 'Pemberhentian Atas Permintaan Sendiri (APS)',
    shortLabel: 'APS',
    description: 'Pemberhentian ASN karena mengajukan pengunduran diri secara sukarela.',
    dbJenisPensiun: ['APS'],
    rhkCode: 'RHK 3',
    tone: 'success',
    sops: [
      { code: 'SOP-BKPSDM-PBH-001', title: 'Pemberhentian PNS Atas Permintaan Sendiri', rhkCode: 'RHK 3', dmsQuery: 'category=DOKUMEN_KEBIJAKAN&subCategory=SOP_PENSIUN_PEMBERHENTIAN&q=APS' },
      { code: 'SOP-BKPSDM-LAY-002', title: 'Verifikasi Kelengkapan Berkas Layanan', rhkCode: 'RHK 1', dmsQuery: 'category=DOKUMEN_KEBIJAKAN&subCategory=SOP_TAHAP_2&q=Verifikasi' },
    ],
    lifecycle: [
      { label: 'Penerimaan Surat Permohonan', mapState: ['DRAFT'], description: 'Surat APS diterima dari ASN bersangkutan.' },
      { label: 'Verifikasi & Clearance', mapState: ['SUBMITTED', 'VERIFICATION'], description: 'Verifikasi clearance hutang, aset, dan kewajiban dinas.' },
      { label: 'Pengesahan Pemberhentian', mapState: ['APPROVAL'], description: 'SK pemberhentian dengan hormat diterbitkan.' },
      ...LIFECYCLE_SHARED_TAIL,
    ],
  },
  {
    key: 'TIDAK_CAKAP',
    label: 'Pemberhentian Tidak Cakap Jasmani/Rohani',
    shortLabel: 'Tidak Cakap',
    description: 'Pemberhentian karena ASN tidak lagi memenuhi syarat jasmani atau rohani.',
    dbJenisPensiun: ['SAK'],
    rhkCode: 'RHK 3',
    tone: 'warning',
    sops: [
      { code: 'SOP-BKPSDM-PBH-002', title: 'Pemberhentian PNS Karena Tidak Cakap Jasmani/Rohani', rhkCode: 'RHK 3', dmsQuery: 'category=DOKUMEN_KEBIJAKAN&subCategory=SOP_PENSIUN_PEMBERHENTIAN&q=Tidak+Cakap' },
    ],
    lifecycle: [
      { label: 'Penerimaan Berkas Medis', mapState: ['DRAFT'], description: 'Surat keterangan dokter/tim penguji kesehatan diterima.' },
      { label: 'Telaah Tim Penguji Kesehatan', mapState: ['VERIFICATION'], description: 'Tim penguji kesehatan memberikan rekomendasi.' },
      { label: 'Pengesahan Pemberhentian', mapState: ['APPROVAL'], description: 'SK pemberhentian dengan hormat atas dasar kesehatan diterbitkan.' },
      ...LIFECYCLE_SHARED_TAIL,
    ],
  },
  {
    key: 'MENINGGAL_TEWAS_HILANG',
    label: 'Pemberhentian Meninggal Dunia/Tewas/Hilang',
    shortLabel: 'Meninggal/Tewas/Hilang',
    description: 'Pemberhentian karena ASN meninggal dunia, tewas dalam tugas, atau dinyatakan hilang.',
    dbJenisPensiun: ['TWS', 'HLG'],
    rhkCode: 'RHK 3',
    tone: 'neutral',
    sops: [
      { code: 'SOP-BKPSDM-PBH-003', title: 'Pemberhentian PNS Karena Meninggal Dunia/Tewas/Hilang', rhkCode: 'RHK 3', dmsQuery: 'category=DOKUMEN_KEBIJAKAN&subCategory=SOP_PENSIUN_PEMBERHENTIAN&q=Meninggal' },
    ],
    lifecycle: [
      { label: 'Penerimaan Laporan/Surat Keterangan', mapState: ['DRAFT'], description: 'Laporan kematian atau hilangnya ASN diterima.' },
      { label: 'Verifikasi Dokumen', mapState: ['VERIFICATION'], description: 'Akta kematian / surat keterangan dari pihak berwenang diverifikasi.' },
      { label: 'Penetapan Status', mapState: ['APPROVAL'], description: 'SK pemberhentian atau pengusulan pensiun ahli waris diterbitkan.' },
      ...LIFECYCLE_SHARED_TAIL,
    ],
  },
  {
    key: 'DISIPLIN_HUKUM',
    label: 'Pemberhentian Pelanggaran Disiplin/Hukum',
    shortLabel: 'Disiplin/Hukum',
    description: 'Pemberhentian tidak dengan hormat karena pelanggaran disiplin atau putusan hukum.',
    dbJenisPensiun: ['PTDH'],
    rhkCode: 'RHK 3',
    tone: 'danger',
    sops: [
      { code: 'SOP-BKPSDM-PBH-004', title: 'Pemberhentian PNS Karena Pelanggaran Disiplin/Hukum', rhkCode: 'RHK 3', dmsQuery: 'category=DOKUMEN_KEBIJAKAN&subCategory=SOP_PENSIUN_PEMBERHENTIAN&q=Disiplin' },
    ],
    lifecycle: [
      { label: 'Penerimaan Putusan/Rekomendasi', mapState: ['DRAFT'], description: 'Putusan pengadilan atau rekomendasi Badan Pertimbangan diterima.' },
      { label: 'Telaah Hukum', mapState: ['VERIFICATION'], description: 'Tim hukum kepegawaian menelaah dasar pemberhentian.' },
      { label: 'Penetapan Pemberhentian PTDH', mapState: ['APPROVAL'], description: 'SK pemberhentian tidak dengan hormat diterbitkan.' },
      ...LIFECYCLE_SHARED_TAIL,
    ],
  },
  {
    key: 'SEMENTARA',
    label: 'Pemberhentian Sementara',
    shortLabel: 'Pemberhentian Sementara',
    description: 'Pemberhentian sementara karena sedang dalam proses hukum atau proses disiplin.',
    dbJenisPensiun: [],
    rhkCode: 'RHK 3',
    tone: 'warning',
    sops: [
      { code: 'SOP-BKPSDM-PBH-005', title: 'Pemberhentian Sementara PNS', rhkCode: 'RHK 3', dmsQuery: 'category=DOKUMEN_KEBIJAKAN&subCategory=SOP_PENSIUN_PEMBERHENTIAN&q=Sementara' },
    ],
    lifecycle: [
      { label: 'Penerimaan Penetapan', mapState: ['DRAFT'], description: 'Penetapan pemberhentian sementara dari pejabat berwenang.' },
      { label: 'Verifikasi Dasar Hukum', mapState: ['VERIFICATION'], description: 'Dasar hukum pemberhentian sementara diperiksa.' },
      { label: 'Penerbitan SK Sementara', mapState: ['APPROVAL'], description: 'SK pemberhentian sementara diterbitkan, hak gaji dibekukan.' },
      { label: 'Monitoring Proses Hukum', mapState: ['COMPLETED'], description: 'Perkembangan kasus hukum dipantau secara berkala.' },
    ],
  },
  {
    key: 'AKTIF_KEMBALI',
    label: 'Pengaktifan Kembali PNS',
    shortLabel: 'Aktif Kembali',
    description: 'Pengaktifan kembali PNS yang sebelumnya diberhentikan sementara setelah proses hukum selesai.',
    dbJenisPensiun: [],
    rhkCode: 'RHK 3',
    tone: 'success',
    sops: [
      { code: 'SOP-BKPSDM-PBH-006', title: 'Pengaktifan Kembali PNS', rhkCode: 'RHK 3', dmsQuery: 'category=DOKUMEN_KEBIJAKAN&subCategory=SOP_PENSIUN_PEMBERHENTIAN&q=Pengaktifan' },
    ],
    lifecycle: [
      { label: 'Penerimaan Putusan Pengadilan', mapState: ['DRAFT'], description: 'Putusan bebas/bersalah yang menentukan nasib kepegawaian.' },
      { label: 'Telaah Syarat Pengaktifan', mapState: ['VERIFICATION'], description: 'Verifikasi kelayakan pengaktifan kembali.' },
      { label: 'Penerbitan SK Aktif Kembali', mapState: ['APPROVAL'], description: 'SK pengaktifan kembali diterbitkan.' },
      { label: 'Pemulihan Hak Kepegawaian', mapState: ['COMPLETED'], description: 'Gaji, jabatan, dan hak kepegawaian dipulihkan.' },
    ],
  },
  {
    key: 'PERAMPINGAN',
    label: 'Pemberhentian Perampingan Organisasi',
    shortLabel: 'Perampingan',
    description: 'Pemberhentian karena kebijakan pemerintah berupa perampingan atau restrukturisasi organisasi.',
    dbJenisPensiun: [],
    rhkCode: 'RHK 3',
    tone: 'warning',
    sops: [
      { code: 'SOP-BKPSDM-PBH-007', title: 'Pemberhentian Karena Perampingan Organisasi/Kebijakan Pemerintah', rhkCode: 'RHK 3', dmsQuery: 'category=DOKUMEN_KEBIJAKAN&subCategory=SOP_PENSIUN_PEMBERHENTIAN&q=Perampingan' },
    ],
    lifecycle: [
      { label: 'Penerimaan Kebijakan', mapState: ['DRAFT'], description: 'Kebijakan perampingan organisasi diterima dari pemerintah pusat.' },
      { label: 'Identifikasi ASN Terdampak', mapState: ['VERIFICATION'], description: 'Daftar ASN yang terkena dampak perampingan disusun.' },
      { label: 'Konsultasi dan Penetapan', mapState: ['APPROVAL'], description: 'Penetapan SK pemberhentian dengan hak pensiun.' },
      ...LIFECYCLE_SHARED_TAIL,
    ],
  },
  {
    key: 'PENYERAHAN',
    label: 'Penyerahan Keputusan Pensiun/Pemberhentian',
    shortLabel: 'Penyerahan SK',
    description: 'Penyerahan SK pensiun atau pemberhentian kepada ASN bersangkutan.',
    dbJenisPensiun: [],
    rhkCode: 'RHK 3',
    tone: 'info',
    sops: [
      { code: 'SOP-BKPSDM-PBH-008', title: 'Penyerahan Keputusan Pensiun/Pemberhentian ASN', rhkCode: 'RHK 3', dmsQuery: 'category=DOKUMEN_KEBIJAKAN&subCategory=SOP_PENSIUN_PEMBERHENTIAN&q=Penyerahan' },
    ],
    lifecycle: [
      { label: 'SK Diterima dari BKN', mapState: ['APPROVAL', 'COMPLETED'], description: 'SK asli diterima dari BKN/BKD.' },
      { label: 'Jadwal Penyerahan', mapState: ['COMPLETED'], description: 'Jadwal penyerahan SK disusun bersama ASN.' },
      { label: 'Serah Terima SK', mapState: ['COMPLETED'], description: 'SK diserahkan, tanda terima ditandatangani.' },
      { label: 'Arsip Dokumen', mapState: ['COMPLETED'], description: 'Salinan SK diarsipkan di SIARSIP dan DMS.' },
    ],
  },
  {
    key: 'UPDATE_DATA',
    label: 'Pemutakhiran Data ASN Setelah SK',
    shortLabel: 'Update Data',
    description: 'Pemutakhiran data ASN di SIDATA/SIASN setelah SK pensiun atau pemberhentian terbit.',
    dbJenisPensiun: [],
    rhkCode: 'RHK 6',
    tone: 'success',
    sops: [
      { code: 'SOP-BKPSDM-DAT-003', title: 'Pemutakhiran Data ASN Setelah Keputusan Pemberhentian/Pensiun', rhkCode: 'RHK 6', dmsQuery: 'category=DOKUMEN_KEBIJAKAN&subCategory=SOP_TAHAP_3&q=Pemutakhiran' },
    ],
    lifecycle: [
      { label: 'Penerimaan SK Final', mapState: ['COMPLETED'], description: 'SK pensiun/pemberhentian yang sudah final diterima.' },
      { label: 'Update Data Lokal (SIDATA)', mapState: ['COMPLETED'], description: 'Status kepegawaian ASN diperbarui di database lokal.' },
      { label: 'Sinkronisasi ke SIASN/MySAPK', mapState: ['COMPLETED'], description: 'Data dikirimkan ke SIASN BKN melalui MySAPK.' },
      { label: 'Verifikasi Sinkronisasi', mapState: ['COMPLETED'], description: 'Konfirmasi bahwa data sudah konsisten di semua sistem.' },
    ],
  },
];

export const SIPENSIUN_JENIS_MAP: Record<string, SipensiunJenisConfig> = Object.fromEntries(
  SIPENSIUN_JENIS_LIST.map((item) => [item.key, item]),
);

export function getSipensiunJenisConfig(jenisKey: string): SipensiunJenisConfig | undefined {
  return SIPENSIUN_JENIS_MAP[jenisKey];
}

/** Map URL ?jenis param to a DB jenisPensiun filter value (for API call). */
export function jenisKeyToDbFilter(jenisKey: string): string {
  const config = SIPENSIUN_JENIS_MAP[jenisKey];
  if (!config || config.dbJenisPensiun.length === 0) {
    return '';
  }
  return config.dbJenisPensiun[0];
}

export function sipensiunJenisLabel(jenisPensiun: string): string {
  const labels: Record<string, string> = {
    BUP: 'Batas Usia Pensiun (BUP)',
    APS: 'Atas Permintaan Sendiri (APS)',
    JDU: 'Janda/Duda',
    YATIM_PIATU: 'Yatim/Piatu',
    TWS: 'Tewas',
    HLG: 'Hilang',
    SAK: 'Tidak Cakap Jasmani/Rohani',
    PTDH: 'Pelanggaran Disiplin/Hukum (PTDH)',
  };
  return labels[jenisPensiun] ?? jenisPensiun;
}

export function sipensiunViewLabel(view: string): string {
  const labels: Record<string, string> = {
    dashboard: 'Dashboard Pensiun & Pemberhentian',
    received: 'Penerimaan Usulan',
    verification: 'Verifikasi Berkas',
    monitoring: 'Monitoring Status',
    'decision-delivery': 'Penyerahan Keputusan',
    'data-update': 'Update Data Setelah SK',
    reports: 'Laporan',
  };
  return labels[view] ?? 'Pensiun & Pemberhentian ASN';
}

/** Map ?view param to API currentState filter. */
export function viewToStateFilter(view: string): string {
  const map: Record<string, string> = {
    received: 'DRAFT',
    verification: 'VERIFICATION',
    'decision-delivery': 'APPROVAL',
    'data-update': 'COMPLETED',
  };
  return map[view] ?? '';
}
