import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export const CANDIDATE_STATUSES = ['CANDIDATE', 'APPROVED', 'REJECTED', 'ARCHIVED'] as const;
export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number];

export class RhkCandidateQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsIn(CANDIDATE_STATUSES)
  status?: CandidateStatus;

  @IsOptional()
  @IsString()
  rhkCode?: string;

  @IsOptional()
  @IsString()
  sopCode?: string;

  @IsOptional()
  @IsString()
  moduleKey?: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 20;
}

export class RhkCandidateActionDto {
  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsIn(['MONTHLY', 'QUARTERLY', 'YEARLY'])
  periodType?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  periodYear?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  periodMonth?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4)
  periodQuarter?: number;
}

export class RhkCandidateRequiredNoteDto {
  @IsString()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  note!: string;
}
