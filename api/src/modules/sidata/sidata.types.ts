import { IsBoolean, IsIn, IsNumberString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export const SIDATA_STATUS_ASN_VALUES = [
  'AKTIF',
  'PENSIUN',
  'CLTN',
  'BERHENTI',
  'MENINGGAL',
] as const;

export type SidataStatusAsn = (typeof SIDATA_STATUS_ASN_VALUES)[number];

export const SIDATA_JENIS_ASN_VALUES = ['PNS', 'PPPK', 'PPPK_PARUH_WAKTU'] as const;

export type SidataJenisAsn = (typeof SIDATA_JENIS_ASN_VALUES)[number];

export const SIDATA_ASN_SYNC_STATUS_VALUES = [
  'SYNCED',
  'LOCAL_CORRECTION',
  'NEED_REVIEW',
  'PENDING_SIASN_UPDATE',
  'CONFLICT',
] as const;

export type SidataAsnSyncStatus = (typeof SIDATA_ASN_SYNC_STATUS_VALUES)[number];

export const SIDATA_ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN_BKPSDM'] as const;
export const SIDATA_IMPORT_OPERATOR_ROLES = [
  ...SIDATA_ADMIN_ROLES,
  'OPERATOR_IMPORT',
] as const;
export const SIDATA_MAPPING_REVIEWER_ROLES = [
  ...SIDATA_ADMIN_ROLES,
  'REVIEWER_MAPPING',
] as const;
export const SIDATA_ALL_ACCESS_ROLES = [
  ...SIDATA_ADMIN_ROLES,
  'KEPALA_BADAN',
  'OPERATOR_IMPORT',
  'REVIEWER_MAPPING',
] as const;

export const SIDATA_ASN_DOCUMENT_MAX_SIZE_BYTES = 10 * 1024 * 1024;

export const SIDATA_ASN_DOCUMENT_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const;

export type SidataAsnDocumentAllowedMimeType =
  (typeof SIDATA_ASN_DOCUMENT_ALLOWED_MIME_TYPES)[number];

export const SIDATA_ASN_DOCUMENT_ALLOWED_EXTENSIONS = [
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.docx',
  '.xlsx',
] as const;

export type SidataAsnDocumentAllowedExtension =
  (typeof SIDATA_ASN_DOCUMENT_ALLOWED_EXTENSIONS)[number];

export const SIDATA_ASN_DOCUMENT_EXTENSION_BY_MIME: Record<
  SidataAsnDocumentAllowedMimeType,
  SidataAsnDocumentAllowedExtension[]
> = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
};

export type SidataAccessScope = 'ALL' | 'UNIT';

export type SidataAsnQualityBreakdownItem = {
  key: string;
  label: string;
  total: number;
  percentage: number;
};

export type SidataAsnQualityDashboardResponse = {
  generatedAt: string;
  scope: {
    type: SidataAccessScope;
    unitKerjaId: string | null;
  };
  period: {
    today: string;
    bupUntil: string;
    bupWindowMonths: number;
  };
  totals: {
    totalAsn: number;
    activeAsn: number;
    inactiveAsn: number;
    pns: number;
    pppk: number;
    pppkParuhWaktu: number;
  };
  completeness: {
    withoutUnitKerja: number;
    withoutJabatan: number;
    withoutGolongan: number;
    withoutNik: number;
    withoutTanggalLahir: number;
    withoutTmtPensiun: number;
    withoutSiasnProfile: number;
  };
  retirement: {
    bupNext12Months: number;
    bupOverdueActive: number;
  };
  quality: {
    completeCoreRows: number;
    issueRows: number;
    qualityScore: number;
  };
  sync: {
    synced: number;
    localCorrection: number;
    needReview: number;
    pendingSiasnUpdate: number;
    conflict: number;
  };
  breakdown: {
    byStatusAsn: SidataAsnQualityBreakdownItem[];
    byJenisAsn: SidataAsnQualityBreakdownItem[];
    bySyncStatus: SidataAsnQualityBreakdownItem[];
  };
};

export class SidataAsnQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsUUID()
  unitKerjaId?: string;

  @IsOptional()
  @IsIn([...SIDATA_STATUS_ASN_VALUES])
  statusAsn?: string;

  @IsOptional()
  @IsIn([...SIDATA_JENIS_ASN_VALUES])
  jenisAsn?: string;

  @IsOptional()
  @IsIn([...SIDATA_ASN_SYNC_STATUS_VALUES])
  syncStatus?: string;

  @IsOptional()
  @IsNumberString({ no_symbols: true })
  page?: string;

  @IsOptional()
  @IsNumberString({ no_symbols: true })
  limit?: string;
}

export class SidataRekapJabatanAsnQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  jabatanNama?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  eselon?: string;
}

export type NormalizedAsnFilters = {
  q?: string;
  unitKerjaId?: string;
  statusAsn?: string;
  jenisAsn?: string;
  syncStatus?: string;
  page: number;
  limit: number;
};

export type RekapJabatanAsnRow = {
  id: string;
  nip: string;
  nama: string;
  golonganNama: string | null;
  tmtGolongan: string | null;
  jabatanNama: string | null;
  tmtJabatan: string | null;
  opdNama: string | null;
  unitKerjaNama: string | null;
  jenisAsn: SidataJenisAsn | string | null;
};

export type RekapJabatanAsnResponse = {
  jabatanNama: string;
  total: number;
  groups: {
    pns: RekapJabatanAsnRow[];
    pppk: RekapJabatanAsnRow[];
    pppkParuhWaktu: RekapJabatanAsnRow[];
  };
};

export type UnitTreeNode = {
  id: string;
  kode: string;
  nama: string;
  parentId: string | null;
  level: number;
  isActive: boolean;
  children: UnitTreeNode[];
};

export class SidataUpdateAsnDto {
  @IsOptional()
  @IsString()
  @MaxLength(30)
  nipLama?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  nik?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  nama?: string;

  @IsOptional()
  @IsIn([...SIDATA_JENIS_ASN_VALUES])
  jenisAsn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  statusAsn?: string;

  @IsOptional()
  @IsUUID()
  unitKerjaId?: string;

  @IsOptional()
  @IsUUID()
  jabatanRefId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  jabatanNama?: string;

  @IsOptional()
  @IsUUID()
  golonganRefId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  golonganNama?: string;

  @IsOptional()
  @IsString()
  tmtJabatan?: string;

  @IsOptional()
  @IsString()
  tmtGolongan?: string;

  @IsOptional()
  @IsString()
  tmtPensiun?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  changeReason?: string;

  @IsOptional()
  @IsUUID()
  evidenceDocumentId?: string;

  @IsOptional()
  @IsBoolean()
  needsReview?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reviewNote?: string;
}

export type SidataAsnChangeLogResponse = {
  id: string;
  asnId: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedBy: string | null;
  changedAt: string;
  reason: string | null;
  evidenceDocumentId: string | null;
  source: string;
  sourceBatchId: string | null;
  metadata: unknown;
};

export class SidataAsnDocumentUploadDto {
  @IsString()
  @MaxLength(100)
  documentType!: string;
}

export type RekapJKRow = { pria: number; wanita: number; lainnya: number; total: number; persenPria: number; persenWanita: number };
export type RekapGolonganRow = { golru: string; pria: number; wanita: number; total: number };
export type RekapPendidikanRow = { pddkn: string; pria: number; wanita: number; total: number };
export type RekapJenjangRow = { jenisAsn?: string; jabatan: string; pria: number; wanita: number; total: number; persenPria: number; persenWanita: number };
export type RekapStrukturalEselonRow = { eselon: string; terisi: number; pria: number; wanita: number };
export type RekapStrukturalPendidikanRow = { pddkn: string; ess1: number; ess2: number; ess3: number; ess4: number; total: number };
export type RekapStrukturalJabatanRow = { namaJabatan: string; eselon: string; pria: number; wanita: number; jumlahTotal: number };
export type RekapFungsionalRow = { namaJabatan: string; ahliPria: number; ahliWanita: number; jumlahAhli: number; terampilPria: number; terampilWanita: number; jumlahTerampil: number; jumlahTotal: number };
export type RekapIkhtisarResponse = {
  allJk: RekapJKRow;
  pppkJk: RekapJKRow;
  allJenjangJabatan: RekapJenjangRow[];
  pppkJenjangJabatan: RekapJenjangRow[];
};

export type RekapPnsResponse = {
  pnsGolonganDetail: RekapGolonganRow[];
  pnsGolonganGroup: RekapGolonganRow[];
  pnsPendidikanDetail: RekapPendidikanRow[];
  pnsPendidikanGroup: RekapPendidikanRow[];
  strukturalEselonDetail: RekapStrukturalEselonRow[];
  strukturalEselonGroup: RekapStrukturalEselonRow[];
  strukturalPendidikan: RekapStrukturalPendidikanRow[];
  strukturalJabatan: RekapStrukturalJabatanRow[];
  fungsionalJabatan: RekapFungsionalRow[];
};

export type RekapPppkResponse = {
  pppkGolongan: RekapGolonganRow[];
  pppkPendidikanDetail: RekapPendidikanRow[];
  pppkPendidikanGroup: RekapPendidikanRow[];
  pppkParuhWaktuGolongan: RekapGolonganRow[];
  pppkParuhWaktuPendidikanDetail: RekapPendidikanRow[];
  pppkParuhWaktuPendidikanGroup: RekapPendidikanRow[];
};

export type RekapAsnResponse = {
  allJk: RekapJKRow;
  pnsGolonganDetail: RekapGolonganRow[];
  pnsGolonganGroup: RekapGolonganRow[];
  pnsPendidikanDetail: RekapPendidikanRow[];
  pnsPendidikanGroup: RekapPendidikanRow[];
  allJenjangJabatan: RekapJenjangRow[];
  strukturalEselonDetail: RekapStrukturalEselonRow[];
  strukturalEselonGroup: RekapStrukturalEselonRow[];
  strukturalPendidikan: RekapStrukturalPendidikanRow[];
  fungsionalJabatan: RekapFungsionalRow[];
  pppkJk: RekapJKRow;
  pppkGolongan: RekapGolonganRow[];
  pppkPendidikanDetail: RekapPendidikanRow[];
  pppkPendidikanGroup: RekapPendidikanRow[];
  pppkParuhWaktuGolongan: RekapGolonganRow[];
  pppkParuhWaktuPendidikanDetail: RekapPendidikanRow[];
  pppkParuhWaktuPendidikanGroup: RekapPendidikanRow[];
  pppkJenjangJabatan: RekapJenjangRow[];
};
