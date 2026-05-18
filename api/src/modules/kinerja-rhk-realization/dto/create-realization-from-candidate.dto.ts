import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min, ValidateIf } from 'class-validator';
import { RHK_PERIOD_TYPES, type RhkPeriodType } from './query-realization.dto';

export class CreateRealizationFromCandidateDto {
  @IsOptional()
  @IsIn(RHK_PERIOD_TYPES)
  periodType?: RhkPeriodType = 'MONTHLY';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  periodYear?: number;

  @ValidateIf((value: CreateRealizationFromCandidateDto) => value.periodType !== 'QUARTERLY')
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  periodMonth?: number;

  @ValidateIf((value: CreateRealizationFromCandidateDto) => value.periodType === 'QUARTERLY')
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4)
  periodQuarter?: number;

  @IsOptional()
  @IsString()
  note?: string;
}
