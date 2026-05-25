import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateOpdSubmissionDto {
  @ApiPropertyOptional({ example: 'cuti' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
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
