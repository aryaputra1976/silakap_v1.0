import { IsISO8601, IsOptional, IsString } from 'class-validator';

export class KeepActiveDto {
  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsISO8601()
  reviewDueDate?: string;
}
