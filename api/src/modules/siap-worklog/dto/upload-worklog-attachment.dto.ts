import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadWorklogAttachmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  label?: string;

  @IsOptional()
  @IsString()
  description?: string;
}