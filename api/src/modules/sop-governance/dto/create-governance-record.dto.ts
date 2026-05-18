import {
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const GOVERNANCE_STATUSES = ['DRAFT', 'ACTIVE', 'NEEDS_REVIEW', 'REVISION', 'ARCHIVED'] as const;

const MODULE_KEYS = [
  'KINERJA_BIDANG',
  'DMS',
  'SIPENSIUN',
  'LAYANAN_KEPEGAWAIAN',
  'SIDATA',
  'SIANALITIK',
] as const;

export class CreateGovernanceRecordDto {
  @IsString()
  @MaxLength(50)
  sopCode!: string;

  @IsString()
  @MaxLength(255)
  title!: string;

  @IsString()
  @IsIn(MODULE_KEYS)
  moduleKey!: string;

  @IsString()
  @MaxLength(20)
  version!: string;

  @IsOptional()
  @IsString()
  @IsIn(GOVERNANCE_STATUSES)
  status?: string;

  @IsOptional()
  @IsISO8601()
  effectiveDate?: string;

  @IsOptional()
  @IsISO8601()
  reviewDueDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  dmsDocumentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  ownerRole?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
