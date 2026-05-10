import { Inject, Injectable } from '@nestjs/common';
import { CaseStatus, SlaStatus, TaskStatus } from '@prisma/client';
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
            TaskStatus.CREATED,
            TaskStatus.ASSIGNED,
            TaskStatus.IN_PROGRESS,
            TaskStatus.WAITING,
            TaskStatus.RETURNED,
            TaskStatus.OVERDUE,
          ],
        },
      },
    });
  }

  async countCompletedTasks(): Promise<number> {
    return this.prisma.siapTask.count({
      where: {
        deletedAt: null,
        status: TaskStatus.COMPLETED,
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
        status: SlaStatus.OVERDUE,
      },
    });
  }

  async groupCasesByState(): Promise<GroupCount[]> {
    const rows = await this.prisma.siapCase.groupBy({
      by: ['currentState'],
      where: {
        deletedAt: null,
      },
      _count: {
        _all: true,
      },
      orderBy: {
        currentState: 'asc',
      },
    });

    return rows.map((row) => ({
      key: row.currentState,
      total: row._count._all,
    }));
  }

  async groupCasesByServiceType(): Promise<GroupCount[]> {
    const rows = await this.prisma.siapCase.groupBy({
      by: ['serviceType'],
      where: {
        deletedAt: null,
      },
      _count: {
        _all: true,
      },
      orderBy: {
        serviceType: 'asc',
      },
    });

    return rows.map((row) => ({
      key: row.serviceType,
      total: row._count._all,
    }));
  }

  async groupTasksByStatus(): Promise<GroupCount[]> {
    const rows = await this.prisma.siapTask.groupBy({
      by: ['status'],
      where: {
        deletedAt: null,
      },
      _count: {
        _all: true,
      },
      orderBy: {
        status: 'asc',
      },
    });

    return rows.map((row) => ({
      key: row.status,
      total: row._count._all,
    }));
  }

  async groupDocumentsByType(): Promise<GroupCount[]> {
    const rows = await this.prisma.document.groupBy({
      by: ['documentType'],
      where: {
        deletedAt: null,
      },
      _count: {
        _all: true,
      },
      orderBy: {
        documentType: 'asc',
      },
    });

    return rows.map((row) => ({
      key: row.documentType,
      total: row._count._all,
    }));
  }

  async groupSlaByStatus(): Promise<GroupCount[]> {
    const rows = await this.prisma.slaTracking.groupBy({
      by: ['status'],
      _count: {
        _all: true,
      },
      orderBy: {
        status: 'asc',
      },
    });

    return rows.map((row) => ({
      key: row.status,
      total: row._count._all,
    }));
  }

  async groupSipensiunByJenis(): Promise<GroupCount[]> {
    const rows = await this.prisma.sipensiunCase.groupBy({
      by: ['jenisPensiun'],
      where: {
        deletedAt: null,
      },
      _count: {
        _all: true,
      },
      orderBy: {
        jenisPensiun: 'asc',
      },
    });

    return rows.map((row) => ({
      key: row.jenisPensiun,
      total: row._count._all,
    }));
  }

  async countActiveCases(): Promise<ActiveCasesSummary> {
    const [totalActive, draft, submitted] = await Promise.all([
      this.prisma.siapCase.count({
        where: {
          deletedAt: null,
          status: CaseStatus.ACTIVE,
        },
      }),
      this.prisma.siapCase.count({
        where: {
          deletedAt: null,
          status: CaseStatus.DRAFT,
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
    const rows = await this.prisma.timelineEntry.findMany({
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

    return rows.map((row) => ({
      id: row.id,
      caseId: row.caseId,
      eventType: row.eventType,
      title: row.title,
      description: row.description,
      createdAt: row.createdAt,
      actor: row.user,
      case: {
        ...row.case,
        status: row.case.status,
      },
    }));
  }
}