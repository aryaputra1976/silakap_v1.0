import { SopRealizationStatus, SopStage, SopStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class KinerjaBidangSopQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsEnum(SopStage)
  stage?: SopStage;

  @IsOptional()
  @IsEnum(SopStatus)
  status?: SopStatus;

  @IsOptional()
  @IsString()
  isRhkPrimary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  rhkCode?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

export class KinerjaBidangTargetQueryDto {
  @IsOptional()
  @IsString()
  year?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  rhkCode?: string;

  @IsOptional()
  @IsString()
  isRhkPrimary?: string;
}

export class KinerjaBidangReportQueryDto {
  @IsOptional()
  @IsString()
  year?: string;

  @IsOptional()
  @IsString()
  month?: string;

  @IsOptional()
  @IsString()
  quarter?: string;

  @IsOptional()
  @IsEnum(SopRealizationStatus)
  status?: SopRealizationStatus;
}
