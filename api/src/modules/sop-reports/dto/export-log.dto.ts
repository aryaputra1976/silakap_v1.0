import { IsIn, IsOptional, IsString } from 'class-validator';

const REPORT_TYPES = ['EXECUTIVE', 'EVIDENCE_PACKAGE', 'SUMMARY_PRINT'] as const;
const FORMATS = ['JSON', 'HTML', 'PRINT'] as const;

export class ExportLogDto {
  @IsIn(REPORT_TYPES)
  reportType!: (typeof REPORT_TYPES)[number];

  @IsOptional()
  @IsString()
  moduleKey?: string;

  @IsOptional()
  @IsString()
  sopCode?: string;

  @IsOptional()
  @IsIn(FORMATS)
  format?: (typeof FORMATS)[number];
}
