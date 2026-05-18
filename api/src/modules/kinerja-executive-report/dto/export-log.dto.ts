import { IsIn, IsOptional, IsString } from 'class-validator';

export class ExecutiveExportLogDto {
  @IsString()
  @IsIn(['MONTHLY', 'QUARTERLY', 'SUMMARY', 'EVIDENCE_BUNDLE'])
  reportType!: string;

  @IsOptional()
  @IsString()
  format?: string;

  @IsOptional()
  @IsString()
  rhkCode?: string;

  @IsOptional()
  @IsString()
  moduleKey?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
