import { IsOptional, IsString } from 'class-validator';

export class StartReviewDto {
  @IsOptional()
  @IsString()
  note?: string;
}
