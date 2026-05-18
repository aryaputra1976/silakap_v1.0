import { IsIn, IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

const REMINDER_TYPES = ['DUE_SOON', 'OVERDUE', 'MANUAL_REVIEW', 'REVISION_REQUIRED'] as const;

export class CreateReminderDto {
  @IsString()
  @IsIn(REMINDER_TYPES)
  reminderType!: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  sentToRole?: string;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  sentToUserId?: string;

  @IsOptional()
  @IsISO8601()
  dueDate?: string;
}
