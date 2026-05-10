import { CaseStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CaseListQueryDto {
  @IsString()
  @IsOptional()
  q?: string;

  @IsString()
  @IsOptional()
  serviceType?: string;

  @IsString()
  @IsOptional()
  currentState?: string;

  @IsEnum(CaseStatus)
  @IsOptional()
  status?: CaseStatus;

  @IsString()
  @IsOptional()
  page?: string;

  @IsString()
  @IsOptional()
  limit?: string;
}
