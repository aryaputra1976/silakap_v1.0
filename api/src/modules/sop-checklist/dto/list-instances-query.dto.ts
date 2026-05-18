import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ListInstancesQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sopCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  entityType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  entityId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  moduleKey?: string;

  @IsOptional()
  @IsString()
  @IsIn(['DRAFT', 'IN_REVIEW', 'APPROVED', 'REJECTED'])
  status?: string;
}
