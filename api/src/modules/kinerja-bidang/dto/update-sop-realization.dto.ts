import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { SopEvidenceInputDto } from './create-sop-realization.dto';

export class UpdateSopRealizationDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  realizationQuantity?: number;

  @IsOptional()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  qualityPercent?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  timeStatus?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  constraint?: string;

  @IsOptional()
  @IsString()
  followUp?: string;

  @IsOptional()
  @IsString()
  reviewNote?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SopEvidenceInputDto)
  evidence?: SopEvidenceInputDto[];
}

export class AddSopEvidenceDto {
  @IsUUID()
  dmsDocumentId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  label?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  isPrimary?: boolean;
}

export class RealizationReviewDto {
  @IsOptional()
  @IsString()
  reviewNote?: string;
}
