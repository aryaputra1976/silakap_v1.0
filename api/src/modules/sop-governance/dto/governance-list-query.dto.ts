import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const GOVERNANCE_STATUSES = ['DRAFT', 'ACTIVE', 'NEEDS_REVIEW', 'REVISION', 'ARCHIVED'] as const;

export class GovernanceListQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  moduleKey?: string;

  @IsOptional()
  @IsString()
  @IsIn(GOVERNANCE_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  sopCode?: string;
}
