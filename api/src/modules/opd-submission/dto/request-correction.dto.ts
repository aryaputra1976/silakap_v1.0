import { IsOptional, IsString } from 'class-validator';

export class RequestCorrectionDto {
  @IsString()
  note!: string;
}

export class InternalActionNoteDto {
  @IsOptional()
  @IsString()
  note?: string;
}
