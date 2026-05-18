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
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  @IsIn(OPD_SUBMISSION_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  @IsIn(OPD_MODULE_KEYS)
  moduleKey?: string;

  @IsOptional()
  @IsString()
  serviceType?: string;

  @IsOptional()
  @IsString()
  opdUnitId?: string;

  @IsOptional()
  @IsString()
  @IsIn(OPD_SUBMISSION_SLA_STATUSES)
  slaStatus?: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}
