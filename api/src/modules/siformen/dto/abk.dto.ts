import { IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAbkDto {
  @IsOptional()
  @IsString()
  jabatanId?: string;

  @IsString()
  @MaxLength(200)
  namaJabatan!: string;

  @IsString()
  @MaxLength(200)
  unitKerja!: string;

  @IsInt()
  @Min(2000)
  @Type(() => Number)
  tahun!: number;

  @IsOptional()
  @IsString()
  uraianTugas?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  volumeKerja!: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  normaWaktu!: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  waktuEfektif?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  pegawaiAda?: number;

  @IsOptional()
  @IsString()
  keterangan?: string;
}

export class UpdateAbkDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  namaJabatan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  unitKerja?: string;

  @IsOptional()
  @IsInt()
  @Min(2000)
  @Type(() => Number)
  tahun?: number;

  @IsOptional()
  @IsString()
  uraianTugas?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  volumeKerja?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  normaWaktu?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  waktuEfektif?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  pegawaiAda?: number;

  @IsOptional()
  @IsString()
  keterangan?: string;
}
