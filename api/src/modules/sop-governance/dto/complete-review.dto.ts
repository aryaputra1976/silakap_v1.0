import { IsIn, IsISO8601, IsOptional, IsString } from 'class-validator';

const DECISIONS = ['KEEP_ACTIVE', 'REVISION_REQUIRED', 'ARCHIVED'] as const;

export class CompleteReviewDto {
  @IsString()
  @IsIn(DECISIONS)
  decision!: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsISO8601()
  reviewDueDate?: string;
}
