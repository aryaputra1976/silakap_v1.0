import { Inject, Injectable } from '@nestjs/common';
import {
  DmsDocumentCategory,
  DmsDocumentStatus,
  Prisma,
} from '@prisma/client';
import { AuthUser } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';

export interface NormalizedDmsDashboardFilters {
  year?: number;
  month?: number;
  quarter?: number;
  unitKerjaId?: string;
  category?: DmsDocumentCategory;
  status?: DmsDocumentStatus;
}

export interface DmsDashboardStatusSummary {
  status: DmsDocumentStatus;
  total: number;
}

export interface DmsDashboardCategorySummary {
  category: DmsDocumentCategory;
  total: number;
}

export interface DmsDashboardLatestDocument {
  id: string;
  title: string;
  category: DmsDocumentCategory;
  status: DmsDocumentStatus;
  originalFileName: string | null;
  fileName: string | null;
  periodYear: number | null;
  periodMonth: number | null;
  unitKerja: {
    id: string;
    kode: string;
    nama: string;
  } | null;
  createdBy: {
    id: string;
    username: string;
    name: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DmsDashboardSummaryData {
  total: number;
  byStatus: DmsDashboardStatusSummary[];
  byCategory: DmsDashboardCategorySummary[];
  waitingVerification: number;
  withoutFile: number;
  verifiedOrArchived: number;
  rejected: number;
  latestDocuments: DmsDashboardLatestDocument[];
}

const latestDocumentSelect = {
  id: true,
  title: true,
  category: true,
  status: true,
  originalFileName: true,
  fileName: true,
  periodYear: true,
  periodMonth: true,
  unitKerja: {
    select: {
      id: true,
      kode: true,
      nama: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      username: true,
      name: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DmsDocumentSelect;

@Injectable()
export class DmsDashboardRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getSummary(
    filters: NormalizedDmsDashboardFilters,
    user: AuthUser,
  ): Promise<DmsDashboardSummaryData> {
    const where = this.buildWhere(filters, user);

    const [
      total,
      waitingVerification,
      withoutFile,
      verifiedOrArchived,
      rejected,
      latestDocuments,
      draftCount,
      uploadedCount,
      submittedCount,
      verifiedCount,
      rejectedCount,
      archivedCount,
      skpCount,
      laporanBulananCount,
      laporanTriwulanCount,
      laporanTahunanCount,
      rekonDataCount,
      dataAsnCount,
      suratDinasCount,
      notaDinasCount,
      buktiDukungCount,
      dokumenKebijakanCount,
      arsipKepegawaianCount,
      lainnyaCount,
    ] = await this.prisma.$transaction([
      this.prisma.dmsDocument.count({ where }),

      this.prisma.dmsDocument.count({
        where: {
          ...where,
          status: DmsDocumentStatus.SUBMITTED,
        },
      }),

      this.prisma.dmsDocument.count({
        where: {
          ...where,
          fileName: null,
        },
      }),

      this.prisma.dmsDocument.count({
        where: {
          ...where,
          status: {
            in: [DmsDocumentStatus.VERIFIED, DmsDocumentStatus.ARCHIVED],
          },
        },
      }),

      this.prisma.dmsDocument.count({
        where: {
          ...where,
          status: DmsDocumentStatus.REJECTED,
        },
      }),

      this.prisma.dmsDocument.findMany({
        where,
        select: latestDocumentSelect,
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      }),

      this.countByStatus(where, DmsDocumentStatus.DRAFT),
      this.countByStatus(where, DmsDocumentStatus.UPLOADED),
      this.countByStatus(where, DmsDocumentStatus.SUBMITTED),
      this.countByStatus(where, DmsDocumentStatus.VERIFIED),
      this.countByStatus(where, DmsDocumentStatus.REJECTED),
      this.countByStatus(where, DmsDocumentStatus.ARCHIVED),

      this.countByCategory(where, DmsDocumentCategory.SKP),
      this.countByCategory(where, DmsDocumentCategory.LAPORAN_BULANAN),
      this.countByCategory(where, DmsDocumentCategory.LAPORAN_TRIWULAN),
      this.countByCategory(where, DmsDocumentCategory.LAPORAN_TAHUNAN),
      this.countByCategory(where, DmsDocumentCategory.REKON_DATA),
      this.countByCategory(where, DmsDocumentCategory.DATA_ASN),
      this.countByCategory(where, DmsDocumentCategory.SURAT_DINAS),
      this.countByCategory(where, DmsDocumentCategory.NOTA_DINAS),
      this.countByCategory(where, DmsDocumentCategory.BUKTI_DUKUNG),
      this.countByCategory(where, DmsDocumentCategory.DOKUMEN_KEBIJAKAN),
      this.countByCategory(where, DmsDocumentCategory.ARSIP_KEPEGAWAIAN),
      this.countByCategory(where, DmsDocumentCategory.LAINNYA),
    ]);

    return {
      total,
      byStatus: [
        { status: DmsDocumentStatus.DRAFT, total: draftCount },
        { status: DmsDocumentStatus.UPLOADED, total: uploadedCount },
        { status: DmsDocumentStatus.SUBMITTED, total: submittedCount },
        { status: DmsDocumentStatus.VERIFIED, total: verifiedCount },
        { status: DmsDocumentStatus.REJECTED, total: rejectedCount },
        { status: DmsDocumentStatus.ARCHIVED, total: archivedCount },
      ],
      byCategory: [
        { category: DmsDocumentCategory.SKP, total: skpCount },
        {
          category: DmsDocumentCategory.LAPORAN_BULANAN,
          total: laporanBulananCount,
        },
        {
          category: DmsDocumentCategory.LAPORAN_TRIWULAN,
          total: laporanTriwulanCount,
        },
        {
          category: DmsDocumentCategory.LAPORAN_TAHUNAN,
          total: laporanTahunanCount,
        },
        { category: DmsDocumentCategory.REKON_DATA, total: rekonDataCount },
        { category: DmsDocumentCategory.DATA_ASN, total: dataAsnCount },
        { category: DmsDocumentCategory.SURAT_DINAS, total: suratDinasCount },
        { category: DmsDocumentCategory.NOTA_DINAS, total: notaDinasCount },
        {
          category: DmsDocumentCategory.BUKTI_DUKUNG,
          total: buktiDukungCount,
        },
        {
          category: DmsDocumentCategory.DOKUMEN_KEBIJAKAN,
          total: dokumenKebijakanCount,
        },
        {
          category: DmsDocumentCategory.ARSIP_KEPEGAWAIAN,
          total: arsipKepegawaianCount,
        },
        { category: DmsDocumentCategory.LAINNYA, total: lainnyaCount },
      ],
      waitingVerification,
      withoutFile,
      verifiedOrArchived,
      rejected,
      latestDocuments,
    };
  }

  private countByStatus(
    where: Prisma.DmsDocumentWhereInput,
    status: DmsDocumentStatus,
  ) {
    return this.prisma.dmsDocument.count({
      where: {
        ...where,
        status,
      },
    });
  }

  private countByCategory(
    where: Prisma.DmsDocumentWhereInput,
    category: DmsDocumentCategory,
  ) {
    return this.prisma.dmsDocument.count({
      where: {
        ...where,
        category,
      },
    });
  }

  private buildWhere(
    filters: NormalizedDmsDashboardFilters,
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

    this.applyScope(where, user);

    return where;
  }

  private applyScope(where: Prisma.DmsDocumentWhereInput, user: AuthUser) {
    if (
      this.hasAnyRole(user, ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'KEPALA_BADAN'])
    ) {
      return;
    }

    if (
      this.hasAnyRole(user, ['KABID', 'ANALIS_MADYA', 'ANALIS_MUDA']) &&
      user.unitKerjaId
    ) {
      where.unitKerjaId = user.unitKerjaId;
      return;
    }

    where.createdById = user.id;
  }

  private hasAnyRole(user: AuthUser, roles: string[]) {
    return user.roles.some((role) => roles.includes(role));
  }
}