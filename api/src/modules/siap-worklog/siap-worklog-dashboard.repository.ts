import { Inject, Injectable } from '@nestjs/common';
import { AccountStatus, Prisma, SiapWorklogStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const STAFF_ROLE_CODES = [
  'ANALIS_PERTAMA',
  'ANALIS_MUDA',
  'ANALIS_MADYA',
  'PENELAAH',
  'PPPK',
  'STAFF',
];

const dashboardWorklogInclude = {
  user: {
    select: {
      id: true,
      username: true,
      name: true,
      unitKerjaId: true,
      unitKerja: {
        select: {
          id: true,
          kode: true,
          nama: true,
        },
      },
    },
  },
  unitKerja: {
    select: {
      id: true,
      kode: true,
      nama: true,
    },
  },
  reviewer: {
    select: {
      id: true,
      username: true,
      name: true,
    },
  },
} satisfies Prisma.SiapWorklogInclude;

export type DashboardWorklogRecord = Prisma.SiapWorklogGetPayload<{
  include: typeof dashboardWorklogInclude;
}>;

const dashboardUserSelect = {
  id: true,
  username: true,
  name: true,
  unitKerjaId: true,
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
  },
} satisfies Prisma.UserSelect;

export type DashboardStaffRecord = Prisma.UserGetPayload<{
  select: typeof dashboardUserSelect;
}>;

const unitKerjaSelect = {
  id: true,
  kode: true,
  nama: true,
  parentId: true,
  level: true,
} satisfies Prisma.UnitKerjaSelect;

export type DashboardUnitRecord = Prisma.UnitKerjaGetPayload<{
  select: typeof unitKerjaSelect;
}>;

export type WorklogDashboardScope = {
  unitKerjaId?: string;
  from: Date;
  to: Date;
  todayStart: Date;
  todayEnd: Date;
};

@Injectable()
export class SiapWorklogDashboardRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findUnits() {
    return this.prisma.unitKerja.findMany({
      where: {
        deletedAt: null,
        isActive: true,
      },
      select: unitKerjaSelect,
      orderBy: [{ level: 'asc' }, { nama: 'asc' }],
    });
  }

  async findStaff(scope: Pick<WorklogDashboardScope, 'unitKerjaId'>) {
    return this.prisma.user.findMany({
      where: {
        deletedAt: null,
        status: AccountStatus.ACTIVE,
        ...(scope.unitKerjaId ? { unitKerjaId: scope.unitKerjaId } : {}),
        userRoles: {
          some: {
            role: {
              code: {
                in: STAFF_ROLE_CODES,
              },
            },
          },
        },
      },
      select: dashboardUserSelect,
      orderBy: [{ name: 'asc' }],
    });
  }

  async findPeriodWorklogs(
    scope: WorklogDashboardScope,
  ): Promise<DashboardWorklogRecord[]> {
    return this.prisma.siapWorklog.findMany({
      where: {
        deletedAt: null,
        ...(scope.unitKerjaId ? { unitKerjaId: scope.unitKerjaId } : {}),
        workDate: {
          gte: scope.from,
          lte: scope.to,
        },
      },
      include: dashboardWorklogInclude,
      orderBy: [{ workDate: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findTodayWorklogs(
    scope: WorklogDashboardScope,
  ): Promise<DashboardWorklogRecord[]> {
    return this.prisma.siapWorklog.findMany({
      where: {
        deletedAt: null,
        ...(scope.unitKerjaId ? { unitKerjaId: scope.unitKerjaId } : {}),
        workDate: {
          gte: scope.todayStart,
          lte: scope.todayEnd,
        },
      },
      include: dashboardWorklogInclude,
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async findPendingReview(
    scope: Pick<WorklogDashboardScope, 'unitKerjaId'>,
    limit = 10,
  ): Promise<DashboardWorklogRecord[]> {
    return this.prisma.siapWorklog.findMany({
      where: {
        deletedAt: null,
        ...(scope.unitKerjaId ? { unitKerjaId: scope.unitKerjaId } : {}),
        status: SiapWorklogStatus.SUBMITTED,
      },
      include: dashboardWorklogInclude,
      orderBy: [{ submittedAt: 'asc' }, { createdAt: 'asc' }],
      take: limit,
    });
  }

  async findRecentObstacles(
    scope: WorklogDashboardScope,
    limit = 10,
  ): Promise<DashboardWorklogRecord[]> {
    return this.prisma.siapWorklog.findMany({
      where: {
        deletedAt: null,
        ...(scope.unitKerjaId ? { unitKerjaId: scope.unitKerjaId } : {}),
        workDate: {
          gte: scope.from,
          lte: scope.to,
        },
        obstacle: {
          not: null,
        },
      },
      include: dashboardWorklogInclude,
      orderBy: [{ workDate: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
  }
}