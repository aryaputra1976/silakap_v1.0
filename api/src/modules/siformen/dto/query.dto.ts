import { IsOptional, IsString, MaxLength } from 'class-validator';

export class JabatanQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  jenisJabatan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  unitKerja?: string;

  @IsOptional()
  @IsString()
  isActive?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

export class BezettingQueryDto {
  @IsOptional()
  @IsString()
  tahun?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  unitKerja?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  statusIsi?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

export class FormasiQueryDto {
  @IsOptional()
  @IsString()
  tahun?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  unitKerja?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  jenisFormasi?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

export class AbkQueryDto {
  @IsOptional()
  @IsString()
  tahun?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  unitKerja?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

export class JabatanFungsionalRefQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  kategori?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  rumpunJabatan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  instansiPembina?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}
