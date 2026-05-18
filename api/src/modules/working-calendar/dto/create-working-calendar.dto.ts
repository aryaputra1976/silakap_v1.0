import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsOptional, IsString, Matches } from 'class-validator';

const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateWorkingCalendarDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsArray()
  @Type(() => Number)
  workDays!: number[];

  @IsString()
  @Matches(HH_MM)
  workStart!: string;

  @IsString()
  @Matches(HH_MM)
  workEnd!: string;

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
