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
  @IsNumberString({ no_symbols: true })
  page?: string;

  @IsOptional()
  @IsNumberString({ no_symbols: true })
  limit?: string;
}

export type NormalizedAsnFilters = {
  q?: string;
  unitKerjaId?: string;
  statusAsn?: string;
  jenisAsn?: string;
  page: number;
  limit: number;
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
}

export class SidataAsnDocumentUploadDto {
  @IsString()
  @MaxLength(100)
  documentType!: string;
}
