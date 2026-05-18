import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateOpdSubmissionDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  serviceType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subjectName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  subjectNip?: string;
}
