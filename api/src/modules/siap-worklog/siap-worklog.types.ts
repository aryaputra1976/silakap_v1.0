import { SiapWorklogStatus } from '@prisma/client';

export type NormalizedWorklogFilters = {
  q?: string;
  category?: string;
  status?: SiapWorklogStatus;
  userId?: string;
  unitKerjaId?: string;
  caseId?: string;
  taskId?: string;
  from?: Date;
  to?: Date;
  page: number;
  limit: number;
};
