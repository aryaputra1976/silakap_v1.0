import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { LAYANAN_SERVICE_TYPES } from '../../opd-submission/dto/create-opd-submission.dto';

export class CreateLayananSubmissionDto {
  @ApiProperty({
    enum: LAYANAN_SERVICE_TYPES,
    example: 'mutasi',
    description: 'Jenis layanan kepegawaian',
  })
  @IsString()
  @IsIn(LAYANAN_SERVICE_TYPES)
  serviceType!: string;

  @ApiProperty({ example: 'Mutasi — Budi Santoso', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ description: 'Deskripsi atau keterangan tambahan' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Budi Santoso', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subjectName?: string;

  @ApiPropertyOptional({ example: '199001012020011001', maxLength: 30, description: 'NIP ASN (18 digit)' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  subjectNip?: string;
}
