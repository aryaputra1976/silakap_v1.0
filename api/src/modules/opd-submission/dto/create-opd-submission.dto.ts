import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const OPD_MODULE_KEYS = [
  'LAYANAN_KEPEGAWAIAN',
  'SIPENSIUN',
  'SIDATA',
  'DMS',
] as const;

export class CreateOpdSubmissionDto {
  @IsString()
  @IsIn(OPD_MODULE_KEYS)
  moduleKey!: string;

  @IsString()
  @MaxLength(80)
  serviceType!: string;

  @IsString()
  @MaxLength(200)
  title!: string;

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
