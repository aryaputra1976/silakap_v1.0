import { IsBoolean, IsIn, IsNumberString, IsOptional, IsString, MaxLength } from 'class-validator';

export const JENIS_JABATAN_KODE = {
  STRUKTURAL: 'STRUKTURAL',
  FUNGSIONAL: 'FUNGSIONAL',
  PELAKSANA: 'PELAKSANA',
} as const;

export type JenisJabatanKode = (typeof JENIS_JABATAN_KODE)[keyof typeof JENIS_JABATAN_KODE];

export const JABATAN_SOURCE_VALUES = ['SIASN', 'MANUAL', 'IMPORT'] as const;
export type JabatanSource = (typeof JABATAN_SOURCE_VALUES)[number];

export class SidataJabatanQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsIn(Object.values(JENIS_JABATAN_KODE))
  jenisJabatanKode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  rumpun?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  kelasJabatan?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumberString({ no_symbols: true })
  page?: string;

  @IsOptional()
  @IsNumberString({ no_symbols: true })
  limit?: string;
}

export type NormalizedJabatanFilters = {
  q?: string;
  jenisJabatanKode?: string;
  rumpun?: string;
  kelasJabatan?: string;
  isActive?: boolean;
  page: number;
  limit: number;
};
