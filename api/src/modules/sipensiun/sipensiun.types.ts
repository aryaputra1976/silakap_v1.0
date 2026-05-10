import { CaseStatus, JenisPensiun } from '@prisma/client';

export type NormalizedSipensiunCaseFilters = {
  q?: string;
  jenisPensiun?: JenisPensiun;
  currentState?: string;
  status?: CaseStatus;
  page: number;
  limit: number;
};
