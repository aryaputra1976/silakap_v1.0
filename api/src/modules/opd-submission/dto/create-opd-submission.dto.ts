import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  LAYANAN_SERVICE_TYPES,
  OPD_MODULE_KEYS,
  type LayananServiceType,
  type OpdModuleKey,
} from '../opd-service-catalog.policy';

export { LAYANAN_SERVICE_TYPES, OPD_MODULE_KEYS };
export type { LayananServiceType, OpdModuleKey };

export class CreateOpdSubmissionDto {
  @ApiProperty({
    enum: OPD_MODULE_KEYS,
    example: 'LAYANAN_KEPEGAWAIAN',
    description: 'Module tujuan pengajuan OPD.',
  })
  @IsString()
  @IsIn(OPD_MODULE_KEYS)
  moduleKey!: string;

  @ApiProperty({
    enum: LAYANAN_SERVICE_TYPES,
    example: 'PEREMAJAAN_NIK',
    description:
      'Jenis layanan PPIK. Untuk fase awal, layanan difokuskan pada Peremajaan Data ASN dan Pemberhentian/Pensiun ASN.',
  })
  @IsString()
  @IsIn(LAYANAN_SERVICE_TYPES)
  @MaxLength(80)
  serviceType!: string;

  @ApiProperty({
    example: 'Peremajaan NIK — Budi Santoso',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({
    description: 'Deskripsi pengajuan layanan PPIK.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'Budi Santoso',
    maxLength: 200,
    description: 'Nama ASN yang menjadi subjek pengajuan.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subjectName?: string;

  @ApiPropertyOptional({
    example: '199001012020011001',
    maxLength: 30,
    description: 'NIP ASN yang menjadi subjek pengajuan.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  subjectNip?: string;
}