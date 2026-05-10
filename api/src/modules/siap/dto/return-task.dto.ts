import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReturnTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason!: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  targetRole?: string;
}
