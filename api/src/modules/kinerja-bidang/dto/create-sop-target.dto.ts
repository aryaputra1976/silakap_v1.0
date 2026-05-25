import { SopTargetUnit } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSopTargetDto {
  @IsUUID()
  sopId!: string;

  @IsString()
  @MaxLength(30)
  rhkCode!: string;

  @IsInt()
  @Min(2020)
  @Max(2040)
  @Type(() => Number)
  year!: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  targetQuantity!: number;

  @IsEnum(SopTargetUnit)
  targetUnit!: SopTargetUnit;

  @IsString()
  @MaxLength(80)
  qualityTarget!: string;

  @IsString()
  @MaxLength(150)
  timeTarget!: string;
}

export class UpdateSopTargetDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  targetQuantity?: number;

  @IsOptional()
  @IsEnum(SopTargetUnit)
  targetUnit?: SopTargetUnit;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  qualityTarget?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  timeTarget?: string;
}
