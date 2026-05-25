import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadSubmissionDocumentDto {
  @ApiProperty({ example: 'SURAT_PERMOHONAN', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  documentType!: string;

  @ApiProperty({ example: 'Surat Permohonan Mutasi', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ description: 'ID dokumen dari DMS (jika sudah ada di DMS)', maxLength: 36 })
  @IsOptional()
  @IsString()
  @MaxLength(36)
  dmsDocumentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: 'Dokumen Utama', maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  subCategory?: string;
}
