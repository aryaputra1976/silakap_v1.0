import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { LAYANAN_SERVICE_TYPES } from '../../opd-submission/dto/create-opd-submission.dto';

export class UpdateLayananSubmissionDto {
  @ApiPropertyOptional({ enum: LAYANAN_SERVICE_TYPES, example: 'cuti' })
  @IsOptional()
  @IsString()
  @IsIn(LAYANAN_SERVICE_TYPES)
  serviceType?: string;

  @ApiPropertyOptional({ example: 'Cuti Tahunan — Budi Santoso', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Budi Santoso', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subjectName?: string;

  @ApiPropertyOptional({ example: '199001012020011001', maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  subjectNip?: string;
}
