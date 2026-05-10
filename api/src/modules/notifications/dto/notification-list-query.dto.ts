import { IsOptional, IsString } from 'class-validator';

export class NotificationListQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  unreadOnly?: string;

  @IsOptional()
  @IsString()
  all?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}
