import { Inject, Injectable } from '@nestjs/common';
import {
  DmsDocumentCategory,
  DmsDocumentStatus,
  Prisma,
} from '@prisma/client';
import { AuthUser } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { applyDmsDocumentScope } from './constants/dms-permission.constant';

export interface NormalizedDmsReportFilters {
  year?: number;
  month?: number;
  quarter?: number;
  unitKerjaId?: string;
  category?: DmsDocumentCategory;
  status?: DmsDocumentStatus;
}

const dmsReportSelect = {
  id: true,
  title: true,
  description: true,
  category: true,
  status: true,
  periodYear: true,
  periodMonth: true,
  periodQuarter: true,
  fileName: true,
  originalFileName: true,
  mimeType: true,
  fileSize: true,
  submittedAt: true,
  verifiedAt: true,
  rejectedAt: true,
  rejectionNote: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
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
    },
  },
  case: {
    select: {
      id: true,
      caseNumber: true,
      serviceType: true,
      title: true,
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
    },
  },
  createdBy: {
    select: {
      id: true,
      username: true,
      name: true,
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
} satisfies Prisma.DmsDocumentSelect;

export type DmsReportRow = Prisma.DmsDocumentGetPayload<{
  select: typeof dmsReportSelect;
}>;

@Injectable()
export class DmsReportRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findRows(
    filters: NormalizedDmsReportFilters,
    user: AuthUser,
  ): Promise<DmsReportRow[]> {
    const where = this.buildWhere(filters, user);

    return this.prisma.dmsDocument.findMany({
      where,
      select: dmsReportSelect,
      orderBy: [
        {
          createdAt: 'desc',
        },
        {
          title: 'asc',
        },
      ],
      take: 5000,
    });
  }

  private buildWhere(
    filters: NormalizedDmsReportFilters,
    user: AuthUser,
  ): Prisma.DmsDocumentWhereInput {
    const where: Prisma.DmsDocumentWhereInput = {
      deletedAt: null,
    };

    if (filters.year) {
      where.periodYear = filters.year;
    }

    if (filters.month) {
      where.periodMonth = filters.month;
    }

    if (filters.quarter) {
      where.periodQuarter = filters.quarter;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.unitKerjaId) {
      where.unitKerjaId = filters.unitKerjaId;
    }

    return applyDmsDocumentScope(where, user);
  }
}