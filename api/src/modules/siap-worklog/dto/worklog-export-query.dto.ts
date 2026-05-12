import { IsOptional, IsString } from 'class-validator';

export class WorklogExportQueryDto {
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsString()
  unitKerjaId?: string;
}