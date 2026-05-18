import { IsIn, IsISO8601, IsOptional, IsString } from 'class-validator';

const PERIOD_TYPES = ['MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM'] as const;
const FORMATS = ['JSON', 'HTML', 'PRINT'] as const;

export class ReportQueryDto {
  @IsOptional()
  @IsString()
  moduleKey?: string;

  @IsOptional()
  @IsString()
  sopCode?: string;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  @IsIn(PERIOD_TYPES)
  periodType?: (typeof PERIOD_TYPES)[number];

  @IsOptional()
  @IsIn(FORMATS)
  format?: (typeof FORMATS)[number];
}
