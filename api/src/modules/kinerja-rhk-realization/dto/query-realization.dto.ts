import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const RHK_REALIZATION_STATUSES = ['DRAFT', 'APPROVED', 'REJECTED', 'ARCHIVED'] as const;
export const RHK_PERIOD_TYPES = ['MONTHLY', 'QUARTERLY', 'YEARLY'] as const;

export type RhkRealizationStatus = (typeof RHK_REALIZATION_STATUSES)[number];
export type RhkPeriodType = (typeof RHK_PERIOD_TYPES)[number];

export class QueryRealizationDto {
  @IsOptional()
  @IsString()
  rhkCode?: string;

  @IsOptional()
  @IsString()
  moduleKey?: string;

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

  @IsOptional()
  @IsIn(RHK_PERIOD_TYPES)
  periodType?: RhkPeriodType;

  @IsOptional()
  @IsIn(RHK_REALIZATION_STATUSES)
  status?: RhkRealizationStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
