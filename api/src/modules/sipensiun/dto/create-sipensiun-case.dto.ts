import { JenisPensiun } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateSipensiunCaseDto {
  @IsString()
  @IsNotEmpty()
  asnId!: string;

  @IsEnum(JenisPensiun)
  jenisPensiun!: JenisPensiun;

  @IsDateString()
  @IsOptional()
  tmtPensiun?: string;

  @IsString()
  @IsOptional()
  catatan?: string;
}
