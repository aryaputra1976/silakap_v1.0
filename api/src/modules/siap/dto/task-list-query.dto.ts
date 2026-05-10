import { TaskStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class TaskListQueryDto {
  @IsString()
  @IsOptional()
  q?: string;

  @IsString()
  @IsOptional()
  taskType?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsString()
  @IsOptional()
  page?: string;

  @IsString()
  @IsOptional()
  limit?: string;
}
