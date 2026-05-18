import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadSubmissionDocumentDto {
  @IsString()
  @MaxLength(100)
  documentType!: string;

  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  dmsDocumentId?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  subCategory?: string;
}
