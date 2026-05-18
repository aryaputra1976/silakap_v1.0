import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString, Matches } from 'class-validator';

const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

export class UpdateWorkingCalendarDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  workDays?: number[];

  @IsOptional()
  @IsString()
  @Matches(HH_MM)
  workStart?: string;

  @IsOptional()
  @IsString()
  @Matches(HH_MM)
  workEnd?: string;

  @IsOptional()
  @IsString()
  @Matches(HH_MM)
  breakStart?: string;

  @IsOptional()
  @IsString()
  @Matches(HH_MM)
  breakEnd?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
