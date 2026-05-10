import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  documentType!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName!: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  originalFileName?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  storagePath!: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  mimeType?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  fileSize?: number;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  checksum?: string;
}
