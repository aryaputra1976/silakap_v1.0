import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const SOP_CODES = [
  'SOP-BKPSDM-PAN-001', 'SOP-BKPSDM-PAN-002', 'SOP-BKPSDM-PAN-003',
  'SOP-BKPSDM-PAN-004', 'SOP-BKPSDM-PAN-005',
  'SOP-BKPSDM-LAY-001', 'SOP-BKPSDM-LAY-002', 'SOP-BKPSDM-LAY-003',
  'SOP-BKPSDM-LAY-004', 'SOP-BKPSDM-LAY-005',
  'SOP-BKPSDM-PGD-001', 'SOP-BKPSDM-PGD-002', 'SOP-BKPSDM-PGD-003',
  'SOP-BKPSDM-DAT-001', 'SOP-BKPSDM-DAT-002', 'SOP-BKPSDM-DAT-003', 'SOP-BKPSDM-DAT-004',
  'SOP-BKPSDM-SIA-001', 'SOP-BKPSDM-SIA-002', 'SOP-BKPSDM-SIA-003',
  'SOP-BKPSDM-DMS-001', 'SOP-BKPSDM-DMS-002',
  'SOP-BKPSDM-MON-001', 'SOP-BKPSDM-MON-002', 'SOP-BKPSDM-MON-003', 'SOP-BKPSDM-MON-004',
] as const;

export class CreateInstanceDto {
  @IsString()
  @IsIn(SOP_CODES)
  sopCode!: string;

  @IsString()
  @MaxLength(50)
  moduleKey!: string;

  @IsString()
  @MaxLength(50)
  entityType!: string;

  @IsString()
  @MaxLength(36)
  entityId!: string;
}
