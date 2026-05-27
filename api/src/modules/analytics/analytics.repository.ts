import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type GroupCount = {
  key: string;
  total: number;
};

export type ActiveCasesSummary = {
  totalActive: number;
  draft: number;
  submitted: number;
};

export type DocumentCompletenessSummary = {
  totalDocuments: number;
  casesWithDocuments: number;
  casesWithoutDocuments: number;
};

export type RecentTimelineItem = {
  id: string;
  caseId: string;
  eventType: string;
  title: string;
  description: string | null;
  createdAt: Date;
  actor: {
    id: string;
    name: string;
    username: string;
  } | null;
  case: {
    id: string;
    caseNumber: string;
    serviceType: string;
    currentState: string;
    status: string;
  };
};

export type AnalyticsDashboardFilters = {
  year?: number;
  quarter?: number;
  month?: number;
  from?: Date;
  to?: Date;
};

type CurrentStateRow = {
  currentState: string;
};

type ServiceTypeRow = {
  serviceType: string;
};

type TaskStatusRow = {
  status: string;
};

type DocumentTypeRow = {
  documentType: string;
};

type SlaStatusRow = {
  status: string;
};

type JenisPensiunRow = {
  jenisPensiun: string;
};

type RecentTimelineDbRow = {
  id: string;
  caseId: string;
  eventType: string;
  title: string;
  description: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    username: string;
  } | null;
  case: {
    id: string;
    caseNumber: string;
    serviceType: string;
    currentState: string;
    status: string;
  };
};

@Injectable()
export class AnalyticsRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async countAsn(): Promise<number> {
    return this.prisma.asn.count({
      where: {
        deletedAt: null,
      },
    });
  }

  async countSipensiunCases(filters: AnalyticsDashboardFilters = {}): Promise<number> {
    return this.prisma.sipensiunCase.count({
      where: {
        deletedAt: null,
        ...this.createdAtWhere(filters),
      },
    });
  }

  async countSiapCases(filters: AnalyticsDashboardFilters = {}): Promise<number> {
    return this.prisma.siapCase.count({
      where: {
        deletedAt: null,
        ...this.createdAtWhere(filters),
      },
    });
  }

  async countPendingTasks(filters: AnalyticsDashboardFilters = {}): Promise<number> {
    return this.prisma.siapTask.count({
      where: {
        deletedAt: null,
        ...this.createdAtWhere(filters),
        status: {
          in: [
            'CREATED',
            'ASSIGNED',
            'IN_PROGRESS',
            'WAITING',
            'RETURNED',
            'OVERDUE',
          ],
        },
      },
    });
  }

  async countCompletedTasks(filters: AnalyticsDashboardFilters = {}): Promise<number> {
    return this.prisma.siapTask.count({
      where: {
        deletedAt: null,
        status: 'COMPLETED',
        ...this.dateFieldWhere('completedAt', filters),
      },
    });
  }

  async countDocuments(filters: AnalyticsDashboardFilters = {}): Promise<number> {
    return this.prisma.document.count({
      where: {
        deletedAt: null,
        ...this.createdAtWhere(filters),
      },
    });
  }

  async countSlaOverdue(filters: AnalyticsDashboardFilters = {}): Promise<number> {
    return this.prisma.slaTracking.count({
      where: {
        status: 'OVERDUE',
        ...this.dateFieldWhere('dueAt', filters),
      },
    });
  }

  async groupCasesByState(filters: AnalyticsDashboardFilters = {}): Promise<GroupCount[]> {
    const rows: CurrentStateRow[] = await this.prisma.siapCase.findMany({
      where: {
        deletedAt: null,
        ...this.createdAtWhere(filters),
      },
      select: {
        currentState: true,
      },
    });

    return this.countByKey(rows, (row) => row.currentState);
  }

  async groupCasesByServiceType(filters: AnalyticsDashboardFilters = {}): Promise<GroupCount[]> {
    const rows: ServiceTypeRow[] = await this.prisma.siapCase.findMany({
      where: {
        deletedAt: null,
        ...this.createdAtWhere(filters),
      },
      select: {
        serviceType: true,
      },
    });

    return this.countByKey(rows, (row) => row.serviceType);
  }

  async groupTasksByStatus(filters: AnalyticsDashboardFilters = {}): Promise<GroupCount[]> {
    const rows: TaskStatusRow[] = await this.prisma.siapTask.findMany({
      where: {
        deletedAt: null,
        ...this.createdAtWhere(filters),
      },
      select: {
        status: true,
      },
    });

    return this.countByKey(rows, (row) => String(row.status));
  }

  async groupDocumentsByType(filters: AnalyticsDashboardFilters = {}): Promise<GroupCount[]> {
    const rows: DocumentTypeRow[] = await this.prisma.document.findMany({
      where: {
        deletedAt: null,
        ...this.createdAtWhere(filters),
      },
      select: {
        documentType: true,
      },
    });

    return this.countByKey(rows, (row) => row.documentType);
  }

  async groupSlaByStatus(filters: AnalyticsDashboardFilters = {}): Promise<GroupCount[]> {
    const rows: SlaStatusRow[] = await this.prisma.slaTracking.findMany({
      where: this.dateFieldWhere('dueAt', filters),
      select: {
        status: true,
      },
    });

    return this.countByKey(rows, (row) => String(row.status));
  }

  async groupSipensiunByJenis(filters: AnalyticsDashboardFilters = {}): Promise<GroupCount[]> {
    const rows: JenisPensiunRow[] = await this.prisma.sipensiunCase.findMany({
      where: {
        deletedAt: null,
        ...this.createdAtWhere(filters),
      },
      select: {
        jenisPensiun: true,
      },
    });

    return this.countByKey(rows, (row) => String(row.jenisPensiun));
  }

  async countActiveCases(filters: AnalyticsDashboardFilters = {}): Promise<ActiveCasesSummary> {
    const [totalActive, draft, submitted] = await Promise.all([
      this.prisma.siapCase.count({
        where: {
          deletedAt: null,
          ...this.createdAtWhere(filters),
          status: 'ACTIVE',
        },
      }),
      this.prisma.siapCase.count({
        where: {
          deletedAt: null,
          ...this.createdAtWhere(filters),
          status: 'DRAFT',
        },
      }),
      this.prisma.siapCase.count({
        where: {
          deletedAt: null,
          ...this.createdAtWhere(filters),
          currentState: 'SUBMITTED',
        },
      }),
    ]);

    return {
      totalActive,
      draft,
      submitted,
    };
  }

  async getDocumentCompleteness(
    filters: AnalyticsDashboardFilters = {},
  ): Promise<DocumentCompletenessSummary> {
    const [totalDocuments, totalCases, casesWithDocumentsRows] =
      await Promise.all([
        this.countDocuments(filters),
        this.prisma.siapCase.count({
          where: {
            deletedAt: null,
            ...this.createdAtWhere(filters),
          },
        }),
        this.prisma.document.findMany({
          where: {
            deletedAt: null,
            ...this.createdAtWhere(filters),
            caseId: {
              not: null,
            },
          },
          select: {
            caseId: true,
          },
          distinct: ['caseId'],
        }),
      ]);

    const casesWithDocuments = casesWithDocumentsRows.length;

    return {
      totalDocuments,
      casesWithDocuments,
      casesWithoutDocuments: Math.max(totalCases - casesWithDocuments, 0),
    };
  }

  async getRecentTimeline(
    limit = 10,
    filters: AnalyticsDashboardFilters = {},
  ): Promise<RecentTimelineItem[]> {
    const rows: RecentTimelineDbRow[] =
      await this.prisma.timelineEntry.findMany({
        where: {
          ...this.createdAtWhere(filters),
          case: {
            deletedAt: null,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        select: {
          id: true,
          caseId: true,
          eventType: true,
          title: true,
          description: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
          case: {
            select: {
              id: true,
              caseNumber: true,
              serviceType: true,
              currentState: true,
              status: true,
            },
          },
        },
      });

    return rows.map((row: RecentTimelineDbRow) => ({
      id: row.id,
      caseId: row.caseId,
      eventType: row.eventType,
      title: row.title,
      description: row.description,
      createdAt: row.createdAt,
      actor: row.user,
      case: {
        id: row.case.id,
        caseNumber: row.case.caseNumber,
        serviceType: row.case.serviceType,
        currentState: row.case.currentState,
        status: String(row.case.status),
      },
      }));
  }

  private createdAtWhere(filters: AnalyticsDashboardFilters) {
    return this.dateFieldWhere('createdAt', filters);
  }

  private dateFieldWhere(
    field: string,
    filters: AnalyticsDashboardFilters,
  ): Record<string, Prisma.DateTimeFilter> {
    if (!filters.from && !filters.to) {
      return {};
    }

    return {
      [field]: {
        ...(filters.from ? { gte: filters.from } : {}),
        ...(filters.to ? { lt: filters.to } : {}),
      },
    };
  }

  private countByKey<T>(
    rows: T[],
    getKey: (row: T) => string,
  ): GroupCount[] {
    const counter = new Map<string, number>();

    rows.forEach((row) => {
      const key = getKey(row);
      counter.set(key, (counter.get(key) ?? 0) + 1);
    });

    return Array.from(counter.entries())
      .map(([key, total]) => ({
        key,
        total,
      }))
      .sort((left, right) => left.key.localeCompare(right.key));
  }
}
