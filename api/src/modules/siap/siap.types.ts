import { CaseStatus, TaskStatus } from '@prisma/client';

export type NormalizedCaseFilters = {
  q?: string;
  serviceType?: string;
  currentState?: string;
  status?: CaseStatus;
  page: number;
  limit: number;
};

export type NormalizedTaskFilters = {
  q?: string;
  taskType?: string;
  status?: TaskStatus;
  page: number;
  limit: number;
  assigneeId?: string;
};
