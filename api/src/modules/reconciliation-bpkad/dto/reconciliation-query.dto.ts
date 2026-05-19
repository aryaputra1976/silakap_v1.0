import { IsOptional, IsString } from 'class-validator';

export class ReconciliationQueryDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  q?: string;
}

export class CreateReconciliationPeriodDto {
  @IsOptional()
  @IsString()
  periodYear?: string;

  @IsOptional()
  @IsString()
  periodMonth?: string;

  @IsOptional()
  @IsString()
  periodQuarter?: string;

  @IsOptional()
  @IsString()
  periodType?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  cutOffDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UploadBpkadSimgajiDto {
  @IsOptional()
  @IsString()
  periodId?: string;
}

export class RunMatchingDto {
  @IsOptional()
  @IsString()
  batchId?: string;
}

export class FindingsQueryDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  findingCode?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  q?: string;
}

export class PatchFindingDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  rtlPic?: string;

  @IsOptional()
  @IsString()
  rtlDeadline?: string;

  @IsOptional()
  @IsString()
  rtlAction?: string;

  @IsOptional()
  @IsString()
  rtlNotes?: string;
}

export class CreateBeritaAcaraDto {
  @IsOptional()
  @IsString()
  nomorBA?: string;

  @IsOptional()
  @IsString()
  tanggalBA?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class FinalizeBeritaAcaraDto {
  @IsOptional()
  @IsString()
  nomorBA?: string;

  @IsOptional()
  @IsString()
  tanggalBA?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
