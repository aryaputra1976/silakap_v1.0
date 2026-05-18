import { IsIn, IsOptional, IsString } from 'class-validator';

export class ApproveRejectDto {
  @IsString()
  @IsIn(['APPROVED', 'REJECTED'])
  action!: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  approvalNote?: string;
}
