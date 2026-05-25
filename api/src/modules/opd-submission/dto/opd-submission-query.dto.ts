import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { OPD_MODULE_KEYS } from './create-opd-submission.dto';

export const OPD_SUBMISSION_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'RECEIVED',
  'IN_VERIFICATION',
  'NEEDS_CORRECTION',
  'CORRECTION_SUBMITTED',
  'VERIFIED',
  'REJECTED',
  'COMPLETED',
  'CANCELLED',
] as const;

export const OPD_SUBMISSION_SLA_STATUSES = [
  'NOT_STARTED',
  'ON_TRACK',
  'DUE_SOON',
  'OVERDUE',
  'PAUSED_FOR_CORRECTION',
  'COMPLETED',
  'CANCELLED',
] as const;

export class OpdSubmissionQueryDto {
  @ApiPropertyOptional({ description: 'Kata kunci pencarian (nomor pengajuan / judul / nama subjek)' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: OPD_SUBMISSION_STATUSES })
  @IsOptional()
  @IsString()
  @IsIn(OPD_SUBMISSION_STATUSES)
  status?: string;

  @ApiPropertyOptional({ enum: OPD_MODULE_KEYS })
  @IsOptional()
  @IsString()
  @IsIn(OPD_MODULE_KEYS)
  moduleKey?: string;

  @ApiPropertyOptional({ example: 'mutasi' })
  @IsOptional()
  @IsString()
  serviceType?: string;

  @ApiPropertyOptional({ description: 'Filter berdasarkan unit kerja OPD (UUID)' })
  @IsOptional()
  @IsString()
  opdUnitId?: string;

  @ApiPropertyOptional({ enum: OPD_SUBMISSION_SLA_STATUSES })
  @IsOptional()
  @IsString()
  @IsIn(OPD_SUBMISSION_SLA_STATUSES)
  slaStatus?: string;

  @ApiPropertyOptional({ example: '2026-01-01', description: 'Tanggal mulai (ISO 8601)' })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-12-31', description: 'Tanggal akhir (ISO 8601)' })
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({ example: '20' })
  @IsOptional()
  @IsString()
  limit?: string;
}
