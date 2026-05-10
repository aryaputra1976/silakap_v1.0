import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateWorklogDto {
  @IsOptional()
  @IsDateString()
  workDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  output?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  volume?: number;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  obstacle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  caseId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  taskId?: string;
}
