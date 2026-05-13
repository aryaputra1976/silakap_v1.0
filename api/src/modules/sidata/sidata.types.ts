import { IsIn, IsNumberString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export const SIDATA_STATUS_ASN_VALUES = [
  'AKTIF',
  'PENSIUN',
  'CLTN',
  'BERHENTI',
  'MENINGGAL',
] as const;

export type SidataStatusAsn = (typeof SIDATA_STATUS_ASN_VALUES)[number];

export const SIDATA_JENIS_ASN_VALUES = ['PNS', 'PPPK'] as const;

export type SidataJenisAsn = (typeof SIDATA_JENIS_ASN_VALUES)[number];

export const SIDATA_ALL_ACCESS_ROLES = ['SUPER_ADMIN', 'ADMIN_BKPSDM'] as const;

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
