import { IsOptional, IsString } from 'class-validator';

export class GovernanceActionDto {
  @IsOptional()
  @IsString()
  note?: string;
}
