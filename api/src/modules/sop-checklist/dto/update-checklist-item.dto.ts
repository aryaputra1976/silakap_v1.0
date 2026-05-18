import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const ITEM_STATUSES = ['PENDING', 'TERPENUHI', 'TIDAK_TERPENUHI', 'TIDAK_RELEVAN', 'PERLU_PERBAIKAN'] as const;

export class UpdateChecklistItemDto {
  @IsString()
  @MaxLength(100)
  itemId!: string;

  @IsString()
  @IsIn(ITEM_STATUSES)
  status!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  dmsDocumentId?: string;
}
