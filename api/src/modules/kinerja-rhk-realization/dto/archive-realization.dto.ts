import { IsOptional, IsString } from 'class-validator';

export class ArchiveRealizationDto {
  @IsOptional()
  @IsString()
  note?: string;
}
