import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';
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

export class BulkImportJabatanItemDto {
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

  @IsString()
  @MaxLength(200)
  unitKerja!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  sortOrder?: number;
}

export class BulkImportJabatanDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkImportJabatanItemDto)
  items!: BulkImportJabatanItemDto[];
}

export class AddJabatanFromRefDto {
  @IsString()
  @MaxLength(36)
  refId!: string;

  @IsString()
  @MaxLength(200)
  unitKerja!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  kodeJabatan?: string;
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
