import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CompleteTaskDto {
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  note?: string;
}
