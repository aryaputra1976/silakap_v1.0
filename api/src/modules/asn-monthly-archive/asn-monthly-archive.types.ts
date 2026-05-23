export const ASN_CHANGE_TYPE = {
  MUTASI_JABATAN:   'MUTASI_JABATAN',
  MUTASI_UNIT:      'MUTASI_UNIT',
  NAIK_PANGKAT:     'NAIK_PANGKAT',
  PENSIUN:          'PENSIUN',
  ASN_BARU:         'ASN_BARU',
  ASN_KELUAR:       'ASN_KELUAR',
  TUGAS_BELAJAR:    'TUGAS_BELAJAR',
  KGB:              'KGB',
  ALIH_JABATAN:     'ALIH_JABATAN',
  STATUS_BERUBAH:   'STATUS_BERUBAH',
} as const;

export type AsnChangeType = (typeof ASN_CHANGE_TYPE)[keyof typeof ASN_CHANGE_TYPE];

export const ARCHIVE_STATUS = {
  DRAFT: 'DRAFT',
  FINAL: 'FINAL',
} as const;

export type ArchiveStatus = (typeof ARCHIVE_STATUS)[keyof typeof ARCHIVE_STATUS];

export type AsnSnapshotData = {
  nip: string;
  nama: string;
  tipePegawai: string | null;
  jenisAsnNama: string | null;
  unitKerjaId: string | null;
  unitKerjaNama: string | null;
  jabatanNama: string | null;
  jenisJabatanNama: string | null;
  golonganNama: string | null;
  pangkatNama: string | null;
  eselonNama: string | null;
  kedudukanHukumNama: string | null;
  statusAsn: string | null;
  tmtPensiun: string | null;
  masaKerjaTahun: number | null;
  masaKerjaBulan: number | null;
  tmtGolongan: string | null;
};

export type ArchiveListItem = {
  id: string;
  bulan: number;
  tahun: number;
  label: string;
  status: string;
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
};

export type ChangeRow = {
  id: string;
  nip: string;
  nama: string;
  changeType: string;
  fieldSebelum: Record<string, unknown> | null;
  fieldSesudah: Record<string, unknown> | null;
  detectedAt: string;
};

export type PaginatedChanges = {
  items: ChangeRow[];
  total: number;
  page: number;
  limit: number;
};

export type MendekatiPensiunRow = {
  id: string;
  nip: string;
  nama: string;
  jabatanNama: string | null;
  unitKerjaNama: string | null;
  golonganNama: string | null;
  tmtPensiun: string;
  sisaBulan: number;
};

export type CreateArchiveResult = {
  archiveId: string;
  label: string;
  totalAsn: number;
  totalChanges: number;
  isNew: boolean;
};

export type EligibleBatchItem = {
  id: string;
  source: string;
  importType: string;
  fileName: string | null;
  totalRows: number;
  validRows: number;
  finishedAt: string | null;
  createdAt: string;
};
