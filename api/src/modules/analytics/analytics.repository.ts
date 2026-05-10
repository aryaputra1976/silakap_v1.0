import { Inject, Injectable } from '@nestjs/common';
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

  async countSipensiunCases(): Promise<number> {
    return this.prisma.sipensiunCase.count({
      where: {
        deletedAt: null,
      },
    });
  }

  async countSiapCases(): Promise<number> {
    return this.prisma.siapCase.count({
      where: {
        deletedAt: null,
      },
    });
  }

  async countPendingTasks(): Promise<number> {
    return this.prisma.siapTask.count({
      where: {
        deletedAt: null,
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

  async countCompletedTasks(): Promise<number> {
    return this.prisma.siapTask.count({
      where: {
        deletedAt: null,
        status: 'COMPLETED',
      },
    });
  }

  async countDocuments(): Promise<number> {
    return this.prisma.document.count({
      where: {
        deletedAt: null,
      },
    });
  }

  async countSlaOverdue(): Promise<number> {
    return this.prisma.slaTracking.count({
      where: {
        status: 'OVERDUE',
      },
    });
  }

  async groupCasesByState(): Promise<GroupCount[]> {
    const rows: CurrentStateRow[] = await this.prisma.siapCase.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        currentState: true,
      },
    });

    return this.countByKey(rows, (row) => row.currentState);
  }

  async groupCasesByServiceType(): Promise<GroupCount[]> {
    const rows: ServiceTypeRow[] = await this.prisma.siapCase.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        serviceType: true,
      },
    });

    return this.countByKey(rows, (row) => row.serviceType);
  }

  async groupTasksByStatus(): Promise<GroupCount[]> {
    const rows: TaskStatusRow[] = await this.prisma.siapTask.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        status: true,
      },
    });

    return this.countByKey(rows, (row) => String(row.status));
  }

  async groupDocumentsByType(): Promise<GroupCount[]> {
    const rows: DocumentTypeRow[] = await this.prisma.document.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        documentType: true,
      },
    });

    return this.countByKey(rows, (row) => row.documentType);
  }

  async groupSlaByStatus(): Promise<GroupCount[]> {
    const rows: SlaStatusRow[] = await this.prisma.slaTracking.findMany({
      select: {
        status: true,
      },
    });

    return this.countByKey(rows, (row) => String(row.status));
  }

  async groupSipensiunByJenis(): Promise<GroupCount[]> {
    const rows: JenisPensiunRow[] = await this.prisma.sipensiunCase.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        jenisPensiun: true,
      },
    });

    return this.countByKey(rows, (row) => String(row.jenisPensiun));
  }

  async countActiveCases(): Promise<ActiveCasesSummary> {
    const [totalActive, draft, submitted] = await Promise.all([
      this.prisma.siapCase.count({
        where: {
          deletedAt: null,
          status: 'ACTIVE',
        },
      }),
      this.prisma.siapCase.count({
        where: {
          deletedAt: null,
          status: 'DRAFT',
        },
      }),
      this.prisma.siapCase.count({
        where: {
          deletedAt: null,
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

  async getDocumentCompleteness(): Promise<DocumentCompletenessSummary> {
    const [totalDocuments, totalCases, casesWithDocumentsRows] =
      await Promise.all([
        this.countDocuments(),
        this.prisma.siapCase.count({
          where: {
            deletedAt: null,
          },
        }),
        this.prisma.document.findMany({
          where: {
            deletedAt: null,
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

  async getRecentTimeline(limit = 10): Promise<RecentTimelineItem[]> {
    const rows: RecentTimelineDbRow[] =
      await this.prisma.timelineEntry.findMany({
        where: {
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