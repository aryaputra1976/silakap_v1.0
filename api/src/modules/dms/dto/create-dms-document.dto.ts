import { DmsDocumentCategory } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const DMS_ACCESS_LEVELS = [
  'INTERNAL',
  'TERBATAS',
  'SANGAT_TERBATAS',
  'PIMPINAN',
  'AUDIT',
] as const;

export class CreateDmsDocumentDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsEnum(DmsDocumentCategory)
  category?: DmsDocumentCategory;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  subCategory?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  @IsIn(DMS_ACCESS_LEVELS)
  accessLevel?: string;

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
