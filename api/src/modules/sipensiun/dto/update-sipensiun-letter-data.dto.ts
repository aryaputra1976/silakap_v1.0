import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSipensiunLetterDataDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  nomorKarpeg?: string;

  @IsOptional()
  @IsString()
  alamatSekarang?: string;

  @IsOptional()
  @IsString()
  alamatSesudahPensiun?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  noHp?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  namaPemohon?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  nikPemohon?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  hubunganPemohon?: string;

  @IsOptional()
  @IsString()
  alamatPemohon?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  noHpPemohon?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  namaPenerimaManfaat?: string;

  @IsOptional()
  @IsDateString()
  tanggalMeninggal?: string;
}
