import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NormalizedCaseFilters, NormalizedTaskFilters } from './siap.types';

const caseListInclude = {
  asn: {
    select: {
      id: true,
      nip: true,
      nama: true,
      unitKerja: {
        select: {
          id: true,
          kode: true,
          nama: true,
        },
      },
    },
  },
} satisfies Prisma.SiapCaseInclude;

const caseDetailInclude = {
  asn: {
    include: {
      unitKerja: {
        select: {
          id: true,
          kode: true,
          nama: true,
        },
      },
    },
  },
  tasks: {
    orderBy: [{ createdAt: 'asc' }],
  },
  workflowLogs: {
    orderBy: [{ performedAt: 'asc' }],
  },
  slaTracking: {
    orderBy: [{ dueAt: 'asc' }],
  },
  timelines: {
    orderBy: [{ createdAt: 'asc' }],
  },
} satisfies Prisma.SiapCaseInclude;

const taskInclude = {
  case: {
    include: {
      asn: {
        select: {
          id: true,
          nip: true,
          nama: true,
        },
      },
    },
  },
  assignee: {
    select: {
      id: true,
      username: true,
      name: true,
    },
  },
  assigner: {
    select: {
      id: true,
      username: true,
      name: true,
    },
  },
  slaTracking: {
    orderBy: [{ dueAt: 'asc' }],
  },
} satisfies Prisma.SiapTaskInclude;

export type SiapCaseListRecord = Prisma.SiapCaseGetPayload<{
  include: typeof caseListInclude;
}>;

export type SiapCaseDetailRecord = Prisma.SiapCaseGetPayload<{
  include: typeof caseDetailInclude;
}>;

export type SiapTaskRecord = Prisma.SiapTaskGetPayload<{
  include: typeof taskInclude;
}>;

@Injectable()
export class SiapRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async createCase(data: Prisma.SiapCaseUncheckedCreateInput) {
    return this.prisma.siapCase.create({
      data,
      include: caseListInclude,
    });
  }

  async findCases(filters: NormalizedCaseFilters): Promise<{
    items: SiapCaseListRecord[];
    total: number;
  }> {
    const where = this.buildCaseWhere(filters);
    const skip = (filters.page - 1) * filters.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.siapCase.findMany({
        where,
        include: caseListInclude,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: filters.limit,
      }),
      this.prisma.siapCase.count({ where }),
    ]);

    return { items, total };
  }

  async findCaseById(id: string): Promise<SiapCaseDetailRecord | null> {
    return this.prisma.siapCase.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: caseDetailInclude,
    });
  }

  async updateCaseState(
    id: string,
    data: Prisma.SiapCaseUpdateInput,
  ): Promise<SiapCaseDetailRecord> {
    return this.prisma.siapCase.update({
      where: { id },
      data,
      include: caseDetailInclude,
    });
  }

  async createTask(data: Prisma.SiapTaskUncheckedCreateInput): Promise<SiapTaskRecord> {
    return this.prisma.siapTask.create({
      data,
      include: taskInclude,
    });
  }

  async findTasks(filters: NormalizedTaskFilters): Promise<{
    items: SiapTaskRecord[];
    total: number;
  }> {
    const where = this.buildTaskWhere(filters);
    const skip = (filters.page - 1) * filters.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.siapTask.findMany({
        where,
        include: taskInclude,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: filters.limit,
      }),
      this.prisma.siapTask.count({ where }),
    ]);

    return { items, total };
  }

  async findTaskById(id: string): Promise<SiapTaskRecord | null> {
    return this.prisma.siapTask.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: taskInclude,
    });
  }

  async updateTask(
    id: string,
    data: Prisma.SiapTaskUpdateInput,
  ): Promise<SiapTaskRecord> {
    return this.prisma.siapTask.update({
      where: { id },
      data,
      include: taskInclude,
    });
  }

  async createWorkflowLog(data: Prisma.WorkflowLogUncheckedCreateInput) {
    return this.prisma.workflowLog.create({ data });
  }

  async createTimelineEntry(data: Prisma.TimelineEntryUncheckedCreateInput) {
    return this.prisma.timelineEntry.create({ data });
  }

  async createSlaTracking(data: Prisma.SlaTrackingUncheckedCreateInput) {
    return this.prisma.slaTracking.create({ data });
  }

  private buildCaseWhere(
    filters: NormalizedCaseFilters,
  ): Prisma.SiapCaseWhereInput {
    const where: Prisma.SiapCaseWhereInput = {
      deletedAt: null,
    };

    if (filters.serviceType) {
      where.serviceType = filters.serviceType;
    }

    if (filters.currentState) {
      where.currentState = filters.currentState;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.q) {
      where.OR = [
        { caseNumber: { contains: filters.q } },
        { title: { contains: filters.q } },
        { description: { contains: filters.q } },
        { asn: { nama: { contains: filters.q } } },
        { asn: { nip: { contains: filters.q } } },
      ];
    }

    return where;
  }

  private buildTaskWhere(
    filters: NormalizedTaskFilters,
  ): Prisma.SiapTaskWhereInput {
    const where: Prisma.SiapTaskWhereInput = {
      deletedAt: null,
    };

    if (filters.assigneeId) {
      where.assignedTo = filters.assigneeId;
    }

    if (filters.taskType) {
      where.taskType = filters.taskType;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.q) {
      where.OR = [
        { title: { contains: filters.q } },
        { description: { contains: filters.q } },
        { case: { caseNumber: { contains: filters.q } } },
        { case: { title: { contains: filters.q } } },
        { case: { asn: { nama: { contains: filters.q } } } },
        { case: { asn: { nip: { contains: filters.q } } } },
      ];
    }

    return where;
  }
}
