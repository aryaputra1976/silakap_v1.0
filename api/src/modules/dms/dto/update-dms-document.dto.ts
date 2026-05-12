import { DmsDocumentCategory } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateDmsDocumentDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsEnum(DmsDocumentCategory)
  category?: DmsDocumentCategory;

  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2100)
  periodYear?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  periodMonth?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  periodQuarter?: number;

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
}