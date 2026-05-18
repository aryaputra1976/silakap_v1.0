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
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}
