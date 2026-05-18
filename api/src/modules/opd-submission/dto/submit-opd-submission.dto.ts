import { IsOptional, IsString } from 'class-validator';

export class SubmitOpdSubmissionDto {
  @IsOptional()
  @IsString()
  note?: string;
}
