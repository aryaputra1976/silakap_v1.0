import { IsDateString, IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GenerateBezettingDto {
  @IsInt()
  @Min(2000)
  @Type(() => Number)
  tahun!: number;
}

export enum BezettingStatusIsi {
  VACANT = 'VACANT',
  FILLED = 'FILLED',
  ACTING = 'ACTING',
}

export class CreateBezettingDto {
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
  @MaxLength(20)
  nip?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  namaAsn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  pangkat?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  golongan?: string;

  @IsOptional()
  @IsDateString()
  tmtJabatan?: string;

  @IsOptional()
  @IsIn(Object.values(BezettingStatusIsi))
  statusIsi?: BezettingStatusIsi;

  @IsOptional()
  @IsString()
  keterangan?: string;
}

export class UpdateBezettingDto {
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
  @MaxLength(20)
  nip?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  namaAsn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  pangkat?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  golongan?: string;

  @IsOptional()
  @IsDateString()
  tmtJabatan?: string;

  @IsOptional()
  @IsIn(Object.values(BezettingStatusIsi))
  statusIsi?: BezettingStatusIsi;

  @IsOptional()
  @IsString()
  keterangan?: string;
}
