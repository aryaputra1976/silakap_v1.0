import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateJabatanDto {
  @IsString()
  @MaxLength(40)
  kodeJabatan!: string;

  @IsString()
  @MaxLength(200)
  namaJabatan!: string;

  @IsString()
  @MaxLength(40)
  jenisJabatan!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  eselonLevel?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(17)
  @Type(() => Number)
  kelasJabatan?: number;

  @IsString()
  @MaxLength(200)
  unitKerja!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  satuanKerja?: string;

  @IsOptional()
  @IsString()
  kualifikasiPendidikan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  jabatanFungsionalRefId?: string;
}

export class UpdateJabatanDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  namaJabatan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  jenisJabatan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  eselonLevel?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(17)
  @Type(() => Number)
  kelasJabatan?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  unitKerja?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  satuanKerja?: string;

  @IsOptional()
  @IsString()
  kualifikasiPendidikan?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  jabatanFungsionalRefId?: string;
}
