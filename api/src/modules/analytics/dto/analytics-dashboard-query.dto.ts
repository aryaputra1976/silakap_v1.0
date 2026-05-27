import { IsOptional, IsString } from 'class-validator';

export class AnalyticsDashboardQueryDto {
  @IsOptional()
  @IsString()
  year?: string;

  @IsOptional()
  @IsString()
  quarter?: string;

  @IsOptional()
  @IsString()
  month?: string;
}
