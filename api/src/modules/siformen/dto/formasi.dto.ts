import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum FormasiJenis {
  CPNS = 'CPNS',
  PPPK = 'PPPK',
}

export enum FormasiStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class CreateFormasiDto {
  @IsOptional()
  @IsString()
  jabatanId?: string;

  @IsString()
  @MaxLength(200)
  namaJabatan!: string;

  @IsString()
  @MaxLength(200)
  unitKerja!: string;

  @IsIn(Object.values(FormasiJenis))
  jenisFormasi!: FormasiJenis;

  @IsInt()
  @Min(2000)
  @Type(() => Number)
  tahun!: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  periode?: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  jumlahKebutuhan!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  jumlahTersedia?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  jumlahUsulan?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  kualifikasiPendidikan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  kualifikasiJurusan?: string;

  @IsOptional()
  @IsString()
  alasanKebutuhan?: string;
}

export class UpdateFormasiDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  namaJabatan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  unitKerja?: string;

  @IsOptional()
  @IsIn(Object.values(FormasiJenis))
  jenisFormasi?: FormasiJenis;

  @IsOptional()
  @IsInt()
  @Min(2000)
  @Type(() => Number)
  tahun?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  periode?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  jumlahKebutuhan?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  jumlahTersedia?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  jumlahUsulan?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  kualifikasiPendidikan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  kualifikasiJurusan?: string;

  @IsOptional()
  @IsString()
  alasanKebutuhan?: string;
}

export class ReviewFormasiDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  catatanVerifikasi?: string;
}
