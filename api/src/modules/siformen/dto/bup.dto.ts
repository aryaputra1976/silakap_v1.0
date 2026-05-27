import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpsertBupDto {
  @IsString() @MaxLength(36)
  jabatanId!: string;

  @IsInt() @Min(2020) @Max(2040) @Type(() => Number)
  tahun!: number;

  @IsInt() @Min(0) @Type(() => Number)
  jumlahPensiun!: number;
}

export class BulkUpsertBupDto {
  @Type(() => UpsertBupDto)
  items!: UpsertBupDto[];
}

export class GenerateBupFromAsnDto {
  @IsOptional() @IsInt() @Min(2020) @Max(2040) @Type(() => Number)
  tahunMulai?: number;

  @IsOptional() @IsInt() @Min(2020) @Max(2040) @Type(() => Number)
  tahunAkhir?: number;
}
