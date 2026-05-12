import { DmsDocumentCategory, DmsDocumentStatus } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class DmsDocumentListQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsEnum(DmsDocumentCategory)
  category?: DmsDocumentCategory;

  @IsOptional()
  @IsEnum(DmsDocumentStatus)
  status?: DmsDocumentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  unitKerjaId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  asnId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  caseId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  worklogId?: string;

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
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}