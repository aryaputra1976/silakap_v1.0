import { Prisma } from '@prisma/client';

export type ReconciliationBufferedFile = Express.Multer.File & {
  buffer: Buffer;
};

export type NormalizedPagination = {
  page: number;
  limit: number;
};

export type BpkadPayrollMappedRow = {
  rowNumber: number;
  tglGaji: Date | null;
  nip: string | null;
  nipLama: string | null;
  nama: string | null;
  kdSkpd: string | null;
  kdSatker: string | null;
  nmSkpd: string | null;
  nmSatker: string | null;
  kdStapeg: string | null;
  tmtStop: Date | null;
  kdPangkat: string | null;
  gapok: string | null;
  kotor: string | null;
  potongan: string | null;
  bersih: string | null;
  npwp: string | null;
  noKtp: string | null;
  validationStatus: 'VALID' | 'INVALID' | 'WARNING';
  validationErrors: string[];
  rawData: Prisma.InputJsonObject;
};

export type ReconciliationSummary = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  warningRows: number;
};
