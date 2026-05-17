import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const dmsDocumentInclude = {
  unitKerja: {
    select: {
      id: true,
      kode: true,
      nama: true,
    },
  },
  asn: {
    select: {
      id: true,
      nip: true,
      nama: true,
      jabatanNama: true,
      golonganNama: true,
      unitKerjaId: true,
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
  worklog: {
    select: {
      id: true,
      workDate: true,
      category: true,
      title: true,
      status: true,
      userId: true,
      unitKerjaId: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      username: true,
      name: true,
      unitKerjaId: true,
    },
  },
  submittedBy: {
    select: {
      id: true,
      username: true,
      name: true,
    },
  },
  verifiedBy: {
    select: {
      id: true,
      username: true,
      name: true,
    },
  },
} satisfies Prisma.DmsDocumentInclude;

export type DmsDocumentRecord = Prisma.DmsDocumentGetPayload<{
  include: typeof dmsDocumentInclude;
}>;

export interface NormalizedDmsDocumentFilters {
  q?: string;
  category?: Prisma.EnumDmsDocumentCategoryFilter['equals'];
  subCategory?: string;
  /** Replaced by allowedAccessLevels; kept for compatibility but not used in buildWhere. */
  accessLevel?: string;
  /** Computed list of access levels the requesting user may see. Enforced as IN filter. */
  allowedAccessLevels?: string[];
  status?: Prisma.EnumDmsDocumentStatusFilter['equals'];
  unitKerjaId?: string;
  asnId?: string;
  caseId?: string;
  worklogId?: string;
  periodYear?: number;
  periodMonth?: number;
  periodQuarter?: number;
  createdById?: string;
  page: number;
  limit: number;
}

@Injectable()
export class DmsRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.DmsDocumentUncheckedCreateInput,
  ): Promise<DmsDocumentRecord> {
    return this.prisma.dmsDocument.create({
      data,
      include: dmsDocumentInclude,
    });
  }

  async findMany(filters: NormalizedDmsDocumentFilters): Promise<{
    items: DmsDocumentRecord[];
    total: number;
  }> {
    const where = this.buildWhere(filters);
    const skip = (filters.page - 1) * filters.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.dmsDocument.findMany({
        where,
        include: dmsDocumentInclude,
        orderBy: [{ createdAt: 'desc' }, { title: 'asc' }],
        skip,
        take: filters.limit,
      }),
      this.prisma.dmsDocument.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string): Promise<DmsDocumentRecord | null> {
    return this.prisma.dmsDocument.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: dmsDocumentInclude,
    });
  }

  async update(
    id: string,
    data: Prisma.DmsDocumentUncheckedUpdateInput,
  ): Promise<DmsDocumentRecord> {
    return this.prisma.dmsDocument.update({
      where: { id },
      data,
      include: dmsDocumentInclude,
    });
  }

  async softDelete(id: string, userId: string): Promise<DmsDocumentRecord> {
    return this.prisma.dmsDocument.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedById: userId,
      },
      include: dmsDocumentInclude,
    });
  }

  async unitKerjaExists(id: string): Promise<boolean> {
    const count = await this.prisma.unitKerja.count({
      where: {
        id,
        deletedAt: null,
      },
    });

    return count > 0;
  }

  async asnExists(id: string): Promise<boolean> {
    const count = await this.prisma.asn.count({
      where: {
        id,
        deletedAt: null,
      },
    });

    return count > 0;
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

  async worklogExists(id: string): Promise<boolean> {
    const count = await this.prisma.siapWorklog.count({
      where: {
        id,
        deletedAt: null,
      },
    });

    return count > 0;
  }

  private buildWhere(
    filters: NormalizedDmsDocumentFilters,
  ): Prisma.DmsDocumentWhereInput {
    const where: Prisma.DmsDocumentWhereInput = {
      deletedAt: null,
    };

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.subCategory) {
      where.subCategory = filters.subCategory;
    }

    if (filters.allowedAccessLevels !== undefined) {
      // Empty list means the user has no access at all — match nothing
      where.accessLevel = { in: filters.allowedAccessLevels };
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.unitKerjaId) {
      where.unitKerjaId = filters.unitKerjaId;
    }

    if (filters.asnId) {
      where.asnId = filters.asnId;
    }

    if (filters.caseId) {
      where.caseId = filters.caseId;
    }

    if (filters.worklogId) {
      where.worklogId = filters.worklogId;
    }

    if (filters.periodYear) {
      where.periodYear = filters.periodYear;
    }

    if (filters.periodMonth) {
      where.periodMonth = filters.periodMonth;
    }

    if (filters.periodQuarter) {
      where.periodQuarter = filters.periodQuarter;
    }

    if (filters.createdById) {
      where.createdById = filters.createdById;
    }

    if (filters.q) {
      where.OR = [
        { title: { contains: filters.q } },
        { description: { contains: filters.q } },
        { subCategory: { contains: filters.q } },
        { fileName: { contains: filters.q } },
        { originalFileName: { contains: filters.q } },
        { asn: { nama: { contains: filters.q } } },
        { asn: { nip: { contains: filters.q } } },
        { unitKerja: { nama: { contains: filters.q } } },
        { case: { caseNumber: { contains: filters.q } } },
        { case: { title: { contains: filters.q } } },
        { worklog: { title: { contains: filters.q } } },
      ];
    }

    return where;
  }
}
