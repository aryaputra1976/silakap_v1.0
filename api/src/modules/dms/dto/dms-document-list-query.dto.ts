import { DmsDocumentCategory, DmsDocumentStatus } from '@prisma/client';
import {
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { DMS_ACCESS_LEVELS } from './create-dms-document.dto';

export class DmsDocumentListQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsEnum(DmsDocumentCategory)
  category?: DmsDocumentCategory;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  subCategory?: string;

  @IsOptional()
  @IsString()
  @IsIn(DMS_ACCESS_LEVELS)
  accessLevel?: string;

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
