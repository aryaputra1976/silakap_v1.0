export type ReconciliationPeriodType = 'MONTHLY' | 'QUARTERLY';

export type ReconciliationPeriod = {
  id: string;
  periodYear: number;
  periodMonth: number | null;
  periodQuarter: number | null;
  periodType: ReconciliationPeriodType | string;
  title: string;
  status: string;
  cutOffDate: string | null;
  notes: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReconciliationImportBatch = {
  id: string;
  periodId: string | null;
  source: string;
  importType: string;
  fileName: string | null;
  originalFileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  fileChecksum: string | null;
  sheetName: string | null;
  status: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  warningRows: number;
  requiredColumnsJson: unknown;
  missingColumnsJson: unknown;
  uploadedById: string | null;
  uploadedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  period: ReconciliationPeriod | null;
};

export type ReconciliationBpkadPayrollRow = {
  id: string;
  batchId: string;
  rowNumber: number;
  tglGaji: string | null;
  nip: string | null;
  nipLama: string | null;
  nama: string | null;
  kdSkpd: string | null;
  kdSatker: string | null;
  nmSkpd: string | null;
  nmSatker: string | null;
  kdStapeg: string | null;
  tmtStop: string | null;
  kdPangkat: string | null;
  gapok: string | null;
  kotor: string | null;
  potongan: string | null;
  bersih: string | null;
  npwp: string | null;
  noKtp: string | null;
  validationStatus: string;
  validationErrors: unknown;
  rawData: unknown;
  createdAt: string;
  updatedAt: string;
};

export type ReconciliationQuery = {
  page?: number;
  limit?: number;
  status?: string;
  q?: string;
};

export function getImportStatusTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
  const normalized = status.toUpperCase();
  if (normalized === 'VALIDATED' || normalized === 'COMMITTED') return 'success';
  if (normalized === 'HAS_ISSUES' || normalized === 'UPLOADED' || normalized === 'VALIDATING') return 'warning';
  if (normalized === 'FAILED' || normalized === 'CANCELLED') return 'danger';
  return 'neutral';
}

export function getRowStatusTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
  const normalized = status.toUpperCase();
  if (normalized === 'VALID') return 'success';
  if (normalized === 'WARNING') return 'warning';
  if (normalized === 'INVALID') return 'danger';
  return 'neutral';
}

export type ReconciliationMatchingRun = {
  id: string;
  periodId: string;
  batchId: string;
  status: string;
  totalBkpsdm: number;
  totalBpkad: number;
  totalMatched: number;
  totalR01: number;
  totalR02: number;
  totalR03: number;
  totalR04: number;
  totalR05: number;
  totalR06: number;
  totalR08: number;
  totalR09: number;
  totalFindings: number;
  runAt: string | null;
  runById: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReconciliationFinding = {
  id: string;
  matchingRunId: string;
  periodId: string;
  findingCode: string;
  priority: string;
  status: string;
  nip: string | null;
  namaBkpsdm: string | null;
  namaBpkad: string | null;
  bkpsdmValue: string | null;
  bpkadValue: string | null;
  description: string | null;
  asnId: string | null;
  bpkadRowId: string | null;
  notes: string | null;
  rtlPic: string | null;
  rtlDeadline: string | null;
  rtlAction: string | null;
  rtlNotes: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReconciliationBeritaAcara = {
  id: string;
  periodId: string;
  matchingRunId: string | null;
  status: string;
  nomorBA: string | null;
  tanggalBA: string | null;
  totalTemuan: number;
  totalResolved: number;
  totalPending: number;
  summaryJson: unknown;
  draftedById: string | null;
  draftedAt: string | null;
  finalizedById: string | null;
  finalizedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LaporanStats = {
  matchingRun: ReconciliationMatchingRun | null;
  beritaAcara: ReconciliationBeritaAcara | null;
  findings: {
    total: number;
    totalResolved: number;
    totalOpen: number;
    totalInFollowUp: number;
    totalNeedsOpdClarification: number;
    resolvedPct: number;
    totalSegera: number;
    totalBulanIni: number;
    byCode: Record<string, number>;
    byStatus: Record<string, number>;
  };
};

export const RTL_ACTION_LABELS: Record<string, string> = {
  BKPSDM_FIX: 'Perbaikan data BKPSDM/SIASN',
  BPKAD_FIX: 'Perbaikan data Simgaji BPKAD',
  OPD_CLARIFY: 'Klarifikasi ke OPD',
  REJECT: 'Ditolak / tidak valid',
  NO_ACTION: 'Tidak perlu tindak lanjut',
};

export const FINDING_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Terbuka',
  NEEDS_CLARIFICATION: 'Perlu Klarifikasi OPD',
  IN_FOLLOW_UP: 'Dalam Tindak Lanjut',
  RESOLVED: 'Selesai',
  REJECTED: 'Ditolak',
};

export function getFindingStatusTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 'RESOLVED') return 'success';
  if (status === 'IN_FOLLOW_UP' || status === 'NEEDS_CLARIFICATION') return 'warning';
  if (status === 'OPEN') return 'danger';
  return 'neutral';
}

export type FindingSummaryItem = {
  findingCode: string;
  priority: string;
  count: number;
};

export type FindingsQuery = ReconciliationQuery & {
  findingCode?: string;
  priority?: string;
};

export const FINDING_LABELS: Record<string, string> = {
  R01: 'Ada di BKPSDM, tidak ada di BPKAD',
  R02: 'Ada di BPKAD, tidak ada di BKPSDM',
  R03: 'Status kepegawaian berbeda',
  R04: 'Pangkat/golongan berbeda',
  R05: 'Jabatan berbeda',
  R06: 'Unit kerja/OPD berbeda',
  R07: 'TMT pangkat/jabatan berbeda',
  R08: 'Nama/NIP bermasalah',
  R09: 'ASN ganda di Simgaji',
  R10: 'Komponen pembayaran tidak sesuai',
};

export function getMatchingRunStatusTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
  const s = status.toUpperCase();
  if (s === 'DONE') return 'success';
  if (s === 'RUNNING' || s === 'PENDING') return 'warning';
  if (s === 'FAILED') return 'danger';
  return 'neutral';
}

export function getFindingPriorityTone(priority: string): 'danger' | 'warning' | 'neutral' {
  if (priority === 'SEGERA') return 'danger';
  if (priority === 'BULAN_INI') return 'warning';
  return 'neutral';
}
