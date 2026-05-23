import { IsArray, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateJabatanFungsionalRefDto {
  @IsString()
  @MaxLength(200)
  namaJabatan!: string;

  @IsString()
  @MaxLength(30)
  jenjang!: string;

  @IsString()
  @MaxLength(20)
  kategori!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  jenjangAwal?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  jenjangPuncak?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  golonganRuangAwal?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  rumpunJabatan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ruangLingkup?: string;

  @IsOptional()
  @IsString()
  kedudukan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  pengisianAsn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  instansiPembina?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  dasarHukum?: string;

  @IsOptional()
  @IsString()
  tugasJabatan?: string;

  @IsOptional()
  @IsString()
  pendidikanPengangkatan?: string;

  @IsOptional()
  @IsString()
  pendidikanPerpindahan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  perpresTunjangan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  besaranTunjangan?: string;
}

export class UpdateJabatanFungsionalRefDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  namaJabatan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  jenjang?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  kategori?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  jenjangAwal?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  jenjangPuncak?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  golonganRuangAwal?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  rumpunJabatan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ruangLingkup?: string;

  @IsOptional()
  @IsString()
  kedudukan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  pengisianAsn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  instansiPembina?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  dasarHukum?: string;

  @IsOptional()
  @IsString()
  tugasJabatan?: string;

  @IsOptional()
  @IsString()
  pendidikanPengangkatan?: string;

  @IsOptional()
  @IsString()
  pendidikanPerpindahan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  perpresTunjangan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  besaranTunjangan?: string;
}

export class BulkImportJabatanFungsionalRefDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateJabatanFungsionalRefDto)
  items!: CreateJabatanFungsionalRefDto[];
}
