import { IsBoolean, IsIn, IsNotEmpty, IsNumberString, IsOptional, IsString, MaxLength } from 'class-validator';

export const JENIS_JABATAN_KODE = {
  STRUKTURAL: 'STRUKTURAL',
  FUNGSIONAL: 'FUNGSIONAL',
  PELAKSANA: 'PELAKSANA',
} as const;

export type JenisJabatanKode = (typeof JENIS_JABATAN_KODE)[keyof typeof JENIS_JABATAN_KODE];

export const REF_JENIS_JABATAN_DEFAULTS = [
  {
    kode: JENIS_JABATAN_KODE.STRUKTURAL,
    nama: 'Jabatan Struktural',
    deskripsi:
      'Jabatan pimpinan tinggi, administrator, dan pengawas dalam struktur organisasi pemerintahan.',
  },
  {
    kode: JENIS_JABATAN_KODE.FUNGSIONAL,
    nama: 'Jabatan Fungsional',
    deskripsi:
      'Jabatan yang menjalankan fungsi pelayanan berdasarkan keahlian atau keterampilan tertentu.',
  },
  {
    kode: JENIS_JABATAN_KODE.PELAKSANA,
    nama: 'Jabatan Pelaksana',
    deskripsi:
      'Jabatan yang menjalankan tugas teknis, administratif, dan operasional pemerintahan.',
  },
] as const;

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

export const SIDATA_GENERIC_REF_TYPE = {
  GOLONGAN: 'GOLONGAN',
  PANGKAT: 'PANGKAT',
  PENDIDIKAN: 'PENDIDIKAN',
  AGAMA: 'AGAMA',
  JENIS_KELAMIN: 'JENIS_KELAMIN',
  STATUS_KAWIN: 'STATUS_KAWIN',
  KEDUDUKAN_HUKUM: 'KEDUDUKAN_HUKUM',
  JENIS_ASN: 'JENIS_ASN',
} as const;

export type SidataGenericReferenceType = (typeof SIDATA_GENERIC_REF_TYPE)[keyof typeof SIDATA_GENERIC_REF_TYPE];

export class SidataGenericReferenceQueryDto {
  @IsNotEmpty()
  @IsIn(Object.values(SIDATA_GENERIC_REF_TYPE))
  type!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export type NormalizedGenericReferenceFilters = {
  type: SidataGenericReferenceType;
  q?: string;
  isActive?: boolean;
};

export class SidataManualGenericReferenceDto {
  @IsNotEmpty()
  @IsIn(Object.values(SIDATA_GENERIC_REF_TYPE))
  type!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  kode?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  nama!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SidataManualUnitDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(80)
  kode!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  nama!: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsNumberString({ no_symbols: true })
  level?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SidataManualJabatanDto {
  @IsNotEmpty()
  @IsString()
  jenisJabatanId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  kode?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(300)
  nama!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  rumpun?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  jenjang?: string;

  @IsOptional()
  @IsNumberString({ no_symbols: true })
  kelasJabatan?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
