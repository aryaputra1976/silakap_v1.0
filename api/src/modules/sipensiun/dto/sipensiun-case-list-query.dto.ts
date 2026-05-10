import { CaseStatus, JenisPensiun } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class SipensiunCaseListQueryDto {
  @IsString()
  @IsOptional()
  q?: string;

  @IsEnum(JenisPensiun)
  @IsOptional()
  jenisPensiun?: JenisPensiun;

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
