import { Inject, Injectable } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type GroupCount = {
  key: string;
  total: number;
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
}
