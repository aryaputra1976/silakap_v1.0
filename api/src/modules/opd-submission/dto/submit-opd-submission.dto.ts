import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SubmitOpdSubmissionDto {
  @ApiPropertyOptional({ example: 'Pengajuan sudah lengkap dan siap diproses' })
  @IsOptional()
  @IsString()
  note?: string;
}
