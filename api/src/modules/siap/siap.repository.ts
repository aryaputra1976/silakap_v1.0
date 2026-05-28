import { Inject, Injectable } from '@nestjs/common';
import { AccountStatus, Prisma, SlaStatus, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NormalizedCaseFilters, NormalizedTaskFilters } from './siap.types';

export type SiapDbClient = PrismaService | Prisma.TransactionClient;

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

const assignableUserSelect = {
  id: true,
  username: true,
  name: true,
  nip: true,
  unitKerja: {
    select: {
      id: true,
      kode: true,
      nama: true,
    },
  },
  userRoles: {
    select: {
      role: {
        select: {
          code: true,
          name: true,
        },
      },
    },
    orderBy: {
      role: {
        code: 'asc',
      },
    },
  },
} satisfies Prisma.UserSelect;

export type SiapCaseListRecord = Prisma.SiapCaseGetPayload<{
  include: typeof caseListInclude;
}>;

export type SiapCaseDetailRecord = Prisma.SiapCaseGetPayload<{
  include: typeof caseDetailInclude;
}>;

export type SiapTaskRecord = Prisma.SiapTaskGetPayload<{
  include: typeof taskInclude;
}>;

export type SiapAssignableUserRecord = Prisma.UserGetPayload<{
  select: typeof assignableUserSelect;
}>;

const overdueSlaInclude = {
  case: {
    select: {
      id: true,
      caseNumber: true,
      serviceType: true,
      title: true,
      currentState: true,
      status: true,
    },
  },
  task: {
    include: taskInclude,
  },
} satisfies Prisma.SlaTrackingInclude;

export type OverdueSlaRecord = Prisma.SlaTrackingGetPayload<{
  include: typeof overdueSlaInclude;
}>;

const workflowDefinitionInclude = {
  transitions: {
    where: {
      isActive: true,
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  },
} satisfies Prisma.WorkflowDefinitionInclude;

export type WorkflowDefinitionRecord = Prisma.WorkflowDefinitionGetPayload<{
  include: typeof workflowDefinitionInclude;
}>;

export type WorkflowTransitionRecord = WorkflowDefinitionRecord['transitions'][number];

@Injectable()
export class SiapRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async withTransaction<T>(
    callback: (client: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(callback);
  }

  async countCasesByNumberPrefix(
    prefix: string,
    client: SiapDbClient = this.prisma,
  ): Promise<number> {
    return client.siapCase.count({
      where: {
        caseNumber: {
          startsWith: prefix,
        },
      },
    });
  }

  async caseNumberExists(
    caseNumber: string,
    client: SiapDbClient = this.prisma,
  ): Promise<boolean> {
    const count = await client.siapCase.count({
      where: {
        caseNumber,
      },
    });

    return count > 0;
  }

  async createCase(
    data: Prisma.SiapCaseUncheckedCreateInput,
    client: SiapDbClient = this.prisma,
  ) {
    return client.siapCase.create({
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

  async findCaseById(
    id: string,
    client: SiapDbClient = this.prisma,
  ): Promise<SiapCaseDetailRecord | null> {
    return client.siapCase.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: caseDetailInclude,
    });
  }

  async findActiveWorkflowByServiceType(
    serviceType: string,
    client: SiapDbClient = this.prisma,
  ): Promise<WorkflowDefinitionRecord | null> {
    return client.workflowDefinition.findFirst({
      where: {
        serviceType,
        isActive: true,
      },
      include: workflowDefinitionInclude,
      orderBy: [{ updatedAt: 'desc' }],
    });
  }

  async findActiveUserIdByRole(
    roleCode: string,
    client: SiapDbClient = this.prisma,
  ): Promise<string | null> {
    const userRole = await client.userRole.findFirst({
      where: {
        role: {
          code: roleCode,
          isActive: true,
        },
        user: {
          status: AccountStatus.ACTIVE,
          deletedAt: null,
        },
      },
      select: {
        userId: true,
      },
      orderBy: [{ createdAt: 'asc' }],
    });

    return userRole?.userId ?? null;
  }

  async findAssignableUsers(
    roleCodes: string[],
  ): Promise<SiapAssignableUserRecord[]> {
    return this.prisma.user.findMany({
      where: {
        deletedAt: null,
        status: AccountStatus.ACTIVE,
        userRoles: {
          some: {
            role: {
              code: {
                in: roleCodes,
              },
              isActive: true,
            },
          },
        },
      },
      select: assignableUserSelect,
      orderBy: [{ name: 'asc' }, { username: 'asc' }],
    });
  }

  async findAsnIdByIdOrNip(
    value: string,
    client: SiapDbClient = this.prisma,
  ): Promise<string | null> {
    const normalized = value.trim();

    if (!normalized) {
      return null;
    }

    const asn = await client.asn.findFirst({
      where: {
        deletedAt: null,
        OR: [{ id: normalized }, { nip: normalized }],
      },
      select: {
        id: true,
      },
    });

    return asn?.id ?? null;
  }

  async updateCaseState(
    id: string,
    data: Prisma.SiapCaseUpdateInput,
    client: SiapDbClient = this.prisma,
  ): Promise<SiapCaseDetailRecord> {
    return client.siapCase.update({
      where: { id },
      data,
      include: caseDetailInclude,
    });
  }

  async createTask(
    data: Prisma.SiapTaskUncheckedCreateInput,
    client: SiapDbClient = this.prisma,
  ): Promise<SiapTaskRecord> {
    return client.siapTask.create({
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

  async userExists(id: string, client: SiapDbClient = this.prisma) {
    const count = await client.user.count({
      where: {
        id,
        deletedAt: null,
        status: 'ACTIVE',
      },
    });

    return count > 0;
  }

  async updateTask(
    id: string,
    data: Prisma.SiapTaskUncheckedUpdateInput,
    client: SiapDbClient = this.prisma,
  ): Promise<SiapTaskRecord> {
    return client.siapTask.update({
      where: { id },
      data,
      include: taskInclude,
    });
  }

  async completeSlaForTask(
    taskId: string,
    completedAt: Date,
    client: SiapDbClient = this.prisma,
  ) {
    return client.slaTracking.updateMany({
      where: {
        taskId,
        completedAt: null,
      },
      data: {
        completedAt,
        status: SlaStatus.COMPLETED,
      },
    });
  }

  async createWorkflowLog(
    data: Prisma.WorkflowLogUncheckedCreateInput,
    client: SiapDbClient = this.prisma,
  ) {
    return client.workflowLog.create({ data });
  }

  async createTimelineEntry(
    data: Prisma.TimelineEntryUncheckedCreateInput,
    client: SiapDbClient = this.prisma,
  ) {
    return client.timelineEntry.create({ data });
  }

  async createSlaTracking(
    data: Prisma.SlaTrackingUncheckedCreateInput,
    client: SiapDbClient = this.prisma,
  ) {
    return client.slaTracking.create({ data });
  }

  async findOverdueSlaCandidates(
    now: Date,
    limit: number,
  ): Promise<OverdueSlaRecord[]> {
    return this.prisma.slaTracking.findMany({
      where: {
        status: {
          in: [SlaStatus.ON_TRACK, SlaStatus.WARNING],
        },
        completedAt: null,
        dueAt: {
          lt: now,
        },
        taskId: {
          not: null,
        },
        task: {
          deletedAt: null,
          status: {
            in: [
              TaskStatus.ASSIGNED,
              TaskStatus.IN_PROGRESS,
              TaskStatus.WAITING,
              TaskStatus.RETURNED,
            ],
          },
        },
        case: {
          deletedAt: null,
        },
      },
      include: overdueSlaInclude,
      orderBy: [{ dueAt: 'asc' }],
      take: limit,
    });
  }

  async markSlaOverdue(id: string, client: SiapDbClient = this.prisma) {
    return client.slaTracking.update({
      where: { id },
      data: {
        status: SlaStatus.OVERDUE,
      },
    });
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

    if (filters.createdBy) {
      where.createdBy = filters.createdBy;
    }

    if (filters.asnUnitKerjaId) {
      where.asn = {
        unitKerjaId: filters.asnUnitKerjaId,
      };
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

    if (filters.status && (Object.values(TaskStatus) as string[]).includes(filters.status)) {
      where.status = filters.status as TaskStatus;
    }

    if (filters.activeOnly) {
      where.status = {
        in: [
          TaskStatus.ASSIGNED,
          TaskStatus.IN_PROGRESS,
          TaskStatus.WAITING,
          TaskStatus.RETURNED,
          TaskStatus.OVERDUE,
        ],
      };
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
