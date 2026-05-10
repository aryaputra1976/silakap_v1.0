import { Inject, Injectable } from '@nestjs/common';
import { CaseStatus, JenisPensiun, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SiapDbClient } from '../siap/siap.repository';
import { NormalizedSipensiunCaseFilters } from './sipensiun.types';

const sipensiunListInclude = {
  asn: {
    select: {
      id: true,
      nip: true,
      nama: true,
      golonganNama: true,
      unitKerja: {
        select: {
          id: true,
          kode: true,
          nama: true,
        },
      },
    },
  },
  siapCase: {
    select: {
      id: true,
      caseNumber: true,
      serviceType: true,
      title: true,
      currentState: true,
      status: true,
      priority: true,
      submittedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} satisfies Prisma.SipensiunCaseInclude;

const sipensiunDetailInclude = {
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
  siapCase: {
    include: {
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
    },
  },
} satisfies Prisma.SipensiunCaseInclude;

const sipensiunLetterPreviewInclude = {
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
  siapCase: {
    include: {
      documents: {
        where: {
          deletedAt: null,
        },
        select: {
          documentType: true,
        },
      },
    },
  },
} satisfies Prisma.SipensiunCaseInclude;

export type SipensiunCaseListRecord = Prisma.SipensiunCaseGetPayload<{
  include: typeof sipensiunListInclude;
}>;

export type SipensiunCaseDetailRecord = Prisma.SipensiunCaseGetPayload<{
  include: typeof sipensiunDetailInclude;
}>;

export type SipensiunLetterPreviewRecord = Prisma.SipensiunCaseGetPayload<{
  include: typeof sipensiunLetterPreviewInclude;
}>;

@Injectable()
export class SipensiunRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findAsnById(id: string) {
    return this.prisma.asn.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        unitKerja: {
          select: {
            id: true,
            kode: true,
            nama: true,
          },
        },
      },
    });
  }

  async createSipensiunCase(
    data: Prisma.SipensiunCaseUncheckedCreateInput,
    client: SiapDbClient = this.prisma,
  ): Promise<SipensiunCaseDetailRecord> {
    return client.sipensiunCase.create({
      data,
      include: sipensiunDetailInclude,
    });
  }

  async findActiveCaseByAsnAndJenis(
    asnId: string,
    jenisPensiun: JenisPensiun,
  ): Promise<SipensiunCaseDetailRecord | null> {
    return this.prisma.sipensiunCase.findFirst({
      where: {
        asnId,
        jenisPensiun,
        deletedAt: null,
        siapCase: {
          status: {
            in: [CaseStatus.DRAFT, CaseStatus.ACTIVE],
          },
          deletedAt: null,
        },
      },
      include: sipensiunDetailInclude,
    });
  }

  async findCases(
    filters: NormalizedSipensiunCaseFilters,
  ): Promise<{ items: SipensiunCaseListRecord[]; total: number }> {
    const where = this.buildWhere(filters);
    const skip = (filters.page - 1) * filters.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.sipensiunCase.findMany({
        where,
        include: sipensiunListInclude,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: filters.limit,
      }),
      this.prisma.sipensiunCase.count({ where }),
    ]);

    return { items, total };
  }

  async findCaseById(id: string): Promise<SipensiunCaseDetailRecord | null> {
    return this.prisma.sipensiunCase.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: sipensiunDetailInclude,
    });
  }

  async findBySiapCaseId(
    siapCaseId: string,
  ): Promise<SipensiunCaseDetailRecord | null> {
    return this.prisma.sipensiunCase.findFirst({
      where: {
        siapCaseId,
        deletedAt: null,
      },
      include: sipensiunDetailInclude,
    });
  }

  async findLetterPreviewSourceById(
    id: string,
  ): Promise<SipensiunLetterPreviewRecord | null> {
    return this.prisma.sipensiunCase.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: sipensiunLetterPreviewInclude,
    });
  }

  private buildWhere(
    filters: NormalizedSipensiunCaseFilters,
  ): Prisma.SipensiunCaseWhereInput {
    const where: Prisma.SipensiunCaseWhereInput = {
      deletedAt: null,
    };

    const siapCaseWhere: Prisma.SiapCaseWhereInput = {};

    if (filters.jenisPensiun) {
      where.jenisPensiun = filters.jenisPensiun;
    }

    if (filters.asnId) {
      where.asnId = filters.asnId;
    }

    if (filters.currentState) {
      siapCaseWhere.currentState = filters.currentState;
    }

    if (filters.status) {
      siapCaseWhere.status = filters.status;
    }

    if (filters.q) {
      where.OR = [
        { catatan: { contains: filters.q } },
        { asn: { nama: { contains: filters.q } } },
        { asn: { nip: { contains: filters.q } } },
        { siapCase: { caseNumber: { contains: filters.q } } },
        { siapCase: { title: { contains: filters.q } } },
      ];
    }

    if (Object.keys(siapCaseWhere).length > 0) {
      where.siapCase = siapCaseWhere;
    }

    return where;
  }
}