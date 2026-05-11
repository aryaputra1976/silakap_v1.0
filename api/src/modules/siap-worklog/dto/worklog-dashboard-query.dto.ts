import { IsOptional, IsString } from 'class-validator';

export class WorklogDashboardQueryDto {
  @IsOptional()
  @IsString()
  date?: string;

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