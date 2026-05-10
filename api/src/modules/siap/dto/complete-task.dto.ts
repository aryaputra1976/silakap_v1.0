import { IsOptional, IsString } from 'class-validator';

export class CompleteTaskDto {
  @IsString()
  @IsOptional()
  note?: string;
}
