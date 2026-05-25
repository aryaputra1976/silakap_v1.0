import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RequestCorrectionDto {
  @ApiProperty({ example: 'Dokumen surat permohonan belum dilampirkan' })
  @IsString()
  note!: string;
}

export class InternalActionNoteDto {
  @ApiPropertyOptional({ example: 'Berkas diterima dan lengkap' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class CompleteOpdSubmissionDto {
  @ApiPropertyOptional({ example: 'Proses pengurusan selesai' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: 'Catatan override jika ada dokumen yang belum terverifikasi' })
  @IsOptional()
  @IsString()
  overrideNote?: string;
}
