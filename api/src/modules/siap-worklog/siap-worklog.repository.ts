import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NormalizedWorklogFilters } from './siap-worklog.types';

const worklogInclude = {
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
    select: {
      id: true,
      taskType: true,
      title: true,
      status: true,
      dueDate: true,
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

export type SiapWorklogRecord = Prisma.SiapWorklogGetPayload<{
  include: typeof worklogInclude;
}>;

@Injectable()
export class SiapWorklogRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.SiapWorklogUncheckedCreateInput,
  ): Promise<SiapWorklogRecord> {
    return this.prisma.siapWorklog.create({
      data,
      include: worklogInclude,
    });
  }

  async findMany(filters: NormalizedWorklogFilters): Promise<{
    items: SiapWorklogRecord[];
    total: number;
  }> {
    const where = this.buildWhere(filters);
    const skip = (filters.page - 1) * filters.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.siapWorklog.findMany({
        where,
        include: worklogInclude,
        orderBy: [{ workDate: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: filters.limit,
      }),
      this.prisma.siapWorklog.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string): Promise<SiapWorklogRecord | null> {
    return this.prisma.siapWorklog.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: worklogInclude,
    });
  }

  async update(
    id: string,
    data: Prisma.SiapWorklogUncheckedUpdateInput,
  ): Promise<SiapWorklogRecord> {
    return this.prisma.siapWorklog.update({
      where: { id },
      data,
      include: worklogInclude,
    });
  }

  async caseExists(id: string): Promise<boolean> {
    const count = await this.prisma.siapCase.count({
      where: {
        id,
        deletedAt: null,
      },
    });

    return count > 0;
  }

  async taskExists(id: string): Promise<boolean> {
    const count = await this.prisma.siapTask.count({
      where: {
        id,
        deletedAt: null,
      },
    });

    return count > 0;
  }

  private buildWhere(
    filters: NormalizedWorklogFilters,
  ): Prisma.SiapWorklogWhereInput {
    const where: Prisma.SiapWorklogWhereInput = {
      deletedAt: null,
    };

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.unitKerjaId) {
      where.unitKerjaId = filters.unitKerjaId;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.caseId) {
      where.caseId = filters.caseId;
    }

    if (filters.taskId) {
      where.taskId = filters.taskId;
    }

    if (filters.from || filters.to) {
      where.workDate = {};

      if (filters.from) {
        where.workDate.gte = filters.from;
      }

      if (filters.to) {
        where.workDate.lte = filters.to;
      }
    }

    if (filters.q) {
      where.OR = [
        { title: { contains: filters.q } },
        { description: { contains: filters.q } },
        { output: { contains: filters.q } },
        { obstacle: { contains: filters.q } },
        { category: { contains: filters.q } },
        { user: { name: { contains: filters.q } } },
        { user: { username: { contains: filters.q } } },
        { case: { caseNumber: { contains: filters.q } } },
        { case: { title: { contains: filters.q } } },
        { task: { title: { contains: filters.q } } },
      ];
    }

    return where;
  }
}
