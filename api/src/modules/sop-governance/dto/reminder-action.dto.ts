import { IsOptional, IsString } from 'class-validator';

export class ReminderActionDto {
  @IsOptional()
  @IsString()
  note?: string;
}
