import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewWorklogDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
