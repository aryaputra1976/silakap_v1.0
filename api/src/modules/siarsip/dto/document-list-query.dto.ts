import { IsOptional, IsString } from 'class-validator';

export class DocumentListQueryDto {
  @IsString()
  @IsOptional()
  caseId?: string;

  @IsString()
  @IsOptional()
  documentType?: string;

  @IsString()
  @IsOptional()
  q?: string;

  @IsString()
  @IsOptional()
  page?: string;

  @IsString()
  @IsOptional()
  limit?: string;
}
