import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsOptional, IsString } from 'class-validator';

export class CreateHolidayDto {
  @Type(() => Date)
  @IsDate()
  date!: Date;

  @IsString()
  name!: string;

  @IsOptional()
  @IsBoolean()
  isRecurringYearly?: boolean;
}
