import { CasePriority } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateCaseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  serviceType!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  asnId?: string;

  @IsEnum(CasePriority)
  @IsOptional()
  priority?: CasePriority;
}
