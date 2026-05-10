import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class AssignTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(36)
  assignedTo!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  note?: string;
}
