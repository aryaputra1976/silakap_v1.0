import { CaseStatus, TaskStatus } from '@prisma/client';

export type NormalizedCaseFilters = {
  q?: string;
  serviceType?: string;
  currentState?: string;
  status?: CaseStatus;
  createdBy?: string;
  asnUnitKerjaId?: string;
  assignedTaskUserId?: string; // For restricted visibility: see only cases with tasks assigned to user
  page: number;
  limit: number;
};

export type NormalizedTaskFilters = {
  q?: string;
  taskType?: string;
  status?: TaskStatus;
  activeOnly?: boolean;
  page: number;
  limit: number;
  assigneeId?: string;
};
