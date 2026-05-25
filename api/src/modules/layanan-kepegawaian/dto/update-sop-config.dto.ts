import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateSopConfigDto {
  @ApiPropertyOptional({ example: 'Penerimaan Permohonan Layanan Kepegawaian', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: 'Permohonan Masuk', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  shortLabel?: string;

  @ApiPropertyOptional({ description: 'Deskripsi singkat SOP' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [String], example: ['RHK 1', 'RHK 3'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  rhkCodes?: string[];

  @ApiPropertyOptional({ example: 1, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
