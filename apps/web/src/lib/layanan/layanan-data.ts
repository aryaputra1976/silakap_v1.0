export type LayananSopKey = 'LAY-001' | 'LAY-002' | 'LAY-003' | 'LAY-004' | 'LAY-005';

export const LAYANAN_SERVICE_TYPE_OPTIONS = [
  { value: 'kenaikan_pangkat',  label: 'Kenaikan Pangkat' },
  { value: 'pengangkatan',      label: 'Pengangkatan' },
  { value: 'mutasi',            label: 'Mutasi Pegawai' },
  { value: 'cuti',              label: 'Cuti ASN' },
  { value: 'penghargaan',       label: 'Penghargaan / Tanda Jasa' },
  { value: 'disiplin',          label: 'Disiplin Pegawai' },
  { value: 'pemberhentian',     label: 'Pemberhentian / Pensiun' },
] as const;

export type LayananServiceTypeValue =
  typeof LAYANAN_SERVICE_TYPE_OPTIONS[number]['value'];

export function layananServiceTypeLabel(value: string): string {
  return (
    LAYANAN_SERVICE_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value
  );
}

export interface LayananSopConfig {
  key: LayananSopKey;
  code: string;
  title: string;
  shortLabel: string;
  description: string;
  rhkCodes: string[];
  pageRoute: string;
  dmsQuery: string;
  lifecycle: Array<{ label: string; description: string; mapState: string[] }>;
}

export const LAYANAN_SOP_LIST: LayananSopConfig[] = [
  {
    key: 'LAY-001',
    code: 'SOP-BKPSDM-LAY-001',
    title: 'Penerimaan Permohonan Layanan Kepegawaian',
    shortLabel: 'Permohonan Masuk',
    description: 'Mengatur penerimaan permohonan layanan kepegawaian dari OPD/ASN.',
    rhkCodes: ['RHK 1', 'RHK 3', 'RHK 4', 'RHK 8'],
    pageRoute: '/layanan',
    dmsQuery: 'category=DOKUMEN_KEBIJAKAN&subCategory=SOP_TAHAP_2',
    lifecycle: [
      {
        label: 'Permohonan Diterima',
        description: 'Berkas permohonan diterima dari OPD/ASN.',
        mapState: ['DRAFT'],
      },
      {
        label: 'Registrasi & Pencatatan',
        description: 'Permohonan diregistrasi dan dicatat dalam sistem.',
        mapState: ['SUBMITTED'],
      },
      {
        label: 'Verifikasi Awal',
        description: 'Berkas diperiksa kelengkapan awalnya.',
        mapState: ['VERIFICATION'],
      },
      {
        label: 'Proses Layanan',
        description: 'Layanan diproses sesuai jenis permohonan.',
        mapState: ['APPROVAL'],
      },
      {
        label: 'Selesai',
        description: 'Layanan diselesaikan dan hasil disampaikan.',
        mapState: ['COMPLETED'],
      },
    ],
  },
  {
    key: 'LAY-002',
    code: 'SOP-BKPSDM-LAY-002',
    title: 'Verifikasi Kelengkapan Berkas Layanan',
    shortLabel: 'Verifikasi Berkas',
    description: 'Mengatur pemeriksaan kelengkapan dan kesesuaian berkas layanan.',
    rhkCodes: ['RHK 1', 'RHK 3'],
    pageRoute: '/layanan/verifikasi',
    dmsQuery: 'category=DOKUMEN_KEBIJAKAN&subCategory=SOP_TAHAP_2',
    lifecycle: [
      {
        label: 'Berkas Diterima',
        description: 'Berkas layanan diterima dari front desk.',
        mapState: ['DRAFT', 'SUBMITTED'],
      },
      {
        label: 'Pemeriksaan Kelengkapan',
        description: 'Berkas diperiksa satu per satu sesuai checklist.',
        mapState: ['VERIFICATION'],
      },
      {
        label: 'Verifikasi Substansi',
        description: 'Kesesuaian substansi berkas dengan persyaratan diperiksa.',
        mapState: ['APPROVAL'],
      },
      {
        label: 'Berkas Dinyatakan Lengkap',
        description: 'Berkas dinyatakan lengkap dan dapat diproses.',
        mapState: ['COMPLETED'],
      },
    ],
  },
  {
    key: 'LAY-003',
    code: 'SOP-BKPSDM-LAY-003',
    title: 'Monitoring SLA Layanan Kepegawaian',
    shortLabel: 'Monitoring SLA',
    description: 'Mengatur pemantauan ketepatan waktu layanan dan pelaporan SLA.',
    rhkCodes: ['RHK 8'],
    pageRoute: '/layanan/sla',
    dmsQuery: 'category=DOKUMEN_KEBIJAKAN&subCategory=SOP_TAHAP_2',
    lifecycle: [
      {
        label: 'Penetapan SLA',
        description: 'SLA ditetapkan per jenis layanan.',
        mapState: ['DRAFT'],
      },
      {
        label: 'Pemantauan Berkala',
        description: 'Status layanan dipantau harian/mingguan.',
        mapState: ['SUBMITTED', 'VERIFICATION'],
      },
      {
        label: 'Identifikasi Risiko Pelanggaran',
        description: 'Layanan mendekati batas SLA diidentifikasi.',
        mapState: ['APPROVAL'],
      },
      {
        label: 'Pelaporan SLA',
        description: 'Laporan ketepatan waktu layanan disusun.',
        mapState: ['COMPLETED'],
      },
    ],
  },
  {
    key: 'LAY-004',
    code: 'SOP-BKPSDM-LAY-004',
    title: 'Penanganan Keterlambatan Layanan',
    shortLabel: 'Keterlambatan',
    description: 'Mengatur tindak lanjut atas layanan yang melewati batas waktu.',
    rhkCodes: ['RHK 8'],
    pageRoute: '/layanan/keterlambatan',
    dmsQuery: 'category=DOKUMEN_KEBIJAKAN&subCategory=SOP_TAHAP_2',
    lifecycle: [
      {
        label: 'Identifikasi Keterlambatan',
        description: 'Layanan yang melewati SLA diidentifikasi.',
        mapState: ['DRAFT'],
      },
      {
        label: 'Analisis Penyebab',
        description: 'Penyebab keterlambatan dianalisis.',
        mapState: ['SUBMITTED'],
      },
      {
        label: 'Tindak Lanjut',
        description: 'Tindak lanjut dan eskalasi dilakukan.',
        mapState: ['VERIFICATION', 'APPROVAL'],
      },
      {
        label: 'Dokumentasi & Pelaporan',
        description: 'Kasus keterlambatan didokumentasikan dan dilaporkan.',
        mapState: ['COMPLETED'],
      },
    ],
  },
  {
    key: 'LAY-005',
    code: 'SOP-BKPSDM-LAY-005',
    title: 'Evaluasi Kepuasan Layanan',
    shortLabel: 'Kepuasan Layanan',
    description: 'Mengatur evaluasi kepuasan pengguna layanan dan rekomendasi perbaikan.',
    rhkCodes: ['RHK 8'],
    pageRoute: '/layanan/kepuasan',
    dmsQuery: 'category=DOKUMEN_KEBIJAKAN&subCategory=SOP_TAHAP_2',
    lifecycle: [
      {
        label: 'Pengumpulan Survei',
        description: 'Survei kepuasan dikumpulkan dari pengguna layanan.',
        mapState: ['DRAFT'],
      },
      {
        label: 'Pengolahan Data',
        description: 'Data survei diolah dan dianalisis.',
        mapState: ['SUBMITTED'],
      },
      {
        label: 'Identifikasi Masalah',
        description: 'Area perbaikan diidentifikasi dari hasil survei.',
        mapState: ['VERIFICATION', 'APPROVAL'],
      },
      {
        label: 'Laporan & Rekomendasi',
        description: 'Laporan evaluasi dan rekomendasi perbaikan disusun.',
        mapState: ['COMPLETED'],
      },
    ],
  },
];

export function getLayananSopConfig(key: string): LayananSopConfig | undefined {
  return LAYANAN_SOP_LIST.find((item) => item.key === key);
}

export function getLayananSopByCode(code: string): LayananSopConfig | undefined {
  return LAYANAN_SOP_LIST.find((item) => item.code === code);
}

/** Maps SIAP task status to a human-readable SLA indicator */
export function getTaskSlaStatus(status: string, dueDate: string | null): 'on-time' | 'at-risk' | 'overdue' | 'completed' {
  if (status === 'COMPLETED' || status === 'CLOSED') return 'completed';
  if (status === 'OVERDUE') return 'overdue';
  if (!dueDate) return 'on-time';
  const due = new Date(dueDate);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 2) return 'at-risk';
  return 'on-time';
}

export const SLA_STATUS_LABEL: Record<string, string> = {
  'on-time': 'Tepat Waktu',
  'at-risk': 'Mendekati Batas',
  overdue: 'Terlambat',
  completed: 'Selesai',
};

export const SLA_STATUS_TONE: Record<string, string> = {
  'on-time': 'success',
  'at-risk': 'warning',
  overdue: 'danger',
  completed: 'neutral',
};
