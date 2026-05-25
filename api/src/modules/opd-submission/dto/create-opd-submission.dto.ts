import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const OPD_MODULE_KEYS = [
  'LAYANAN_KEPEGAWAIAN',
  'SIPENSIUN',
  'SIDATA',
  'DMS',
] as const;

export const LAYANAN_SERVICE_TYPES = [
  'kenaikan_pangkat',
  'pengangkatan',
  'mutasi',
  'cuti',
  'penghargaan',
  'disiplin',
  'pemberhentian',
] as const;

export type LayananServiceType = typeof LAYANAN_SERVICE_TYPES[number];

export class CreateOpdSubmissionDto {
  @ApiProperty({ enum: OPD_MODULE_KEYS, example: 'LAYANAN_KEPEGAWAIAN' })
  @IsString()
  @IsIn(OPD_MODULE_KEYS)
  moduleKey!: string;

  @ApiProperty({ example: 'mutasi', description: 'Jenis layanan (untuk LAYANAN_KEPEGAWAIAN: kenaikan_pangkat | pengangkatan | mutasi | cuti | penghargaan | disiplin | pemberhentian)' })
  @IsString()
  @MaxLength(80)
  serviceType!: string;

  @ApiProperty({ example: 'Mutasi — Budi Santoso', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ description: 'Deskripsi pengajuan' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Budi Santoso', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subjectName?: string;

  @ApiPropertyOptional({ example: '199001012020011001', maxLength: 30, description: 'NIP ASN (18 digit)' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  subjectNip?: string;
}
