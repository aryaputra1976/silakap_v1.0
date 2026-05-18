import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class DashboardQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  moduleKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  sopCode?: string;

  @IsOptional()
  @IsString()
  @IsIn(['DRAFT', 'IN_REVIEW', 'APPROVED', 'REJECTED'])
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  entityType?: string;

  /** ISO date string — inclusive lower bound (createdAt >= from) */
  @IsOptional()
  @IsString()
  from?: string;

  /** ISO date string — inclusive upper bound (createdAt <= to) */
  @IsOptional()
  @IsString()
  to?: string;
}
