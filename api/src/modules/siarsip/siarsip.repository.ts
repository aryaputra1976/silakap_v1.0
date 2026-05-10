import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NormalizedDocumentFilters } from './siarsip.types';

const documentInclude = {
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
} satisfies Prisma.DocumentInclude;

const caseChecklistInclude = {
  documents: {
    where: {
      deletedAt: null,
    },
    orderBy: [{ uploadedAt: 'desc' }],
  },
  sipensiunCase: {
    select: {
      id: true,
      jenisPensiun: true,
    },
  },
} satisfies Prisma.SiapCaseInclude;

export type DocumentRecord = Prisma.DocumentGetPayload<{
  include: typeof documentInclude;
}>;

export type ChecklistCaseRecord = Prisma.SiapCaseGetPayload<{
  include: typeof caseChecklistInclude;
}>;

@Injectable()
export class SiarsipRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findDocuments(filters: NormalizedDocumentFilters): Promise<{
    items: DocumentRecord[];
    total: number;
  }> {
    const where = this.buildWhere(filters);
    const skip = (filters.page - 1) * filters.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.document.findMany({
        where,
        include: documentInclude,
        orderBy: [{ uploadedAt: 'desc' }],
        skip,
        take: filters.limit,
      }),
      this.prisma.document.count({ where }),
    ]);

    return { items, total };
  }

  async findDocumentById(id: string): Promise<DocumentRecord | null> {
    return this.prisma.document.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: documentInclude,
    });
  }

  async findDocumentsByCaseId(caseId: string): Promise<DocumentRecord[]> {
    return this.prisma.document.findMany({
      where: {
        caseId,
        deletedAt: null,
      },
      include: documentInclude,
      orderBy: [{ uploadedAt: 'desc' }],
    });
  }

  async createDocument(
    data: Prisma.DocumentUncheckedCreateInput,
  ): Promise<DocumentRecord> {
    return this.prisma.document.create({
      data,
      include: documentInclude,
    });
  }

  async countDocumentsByCaseId(caseId: string): Promise<number> {
    return this.prisma.document.count({
      where: {
        caseId,
        deletedAt: null,
      },
    });
  }

  async findCaseForChecklist(
    caseId: string,
  ): Promise<ChecklistCaseRecord | null> {
    return this.prisma.siapCase.findFirst({
      where: {
        id: caseId,
        deletedAt: null,
      },
      include: caseChecklistInclude,
    });
  }

  private buildWhere(
    filters: NormalizedDocumentFilters,
  ): Prisma.DocumentWhereInput {
    const where: Prisma.DocumentWhereInput = {
      deletedAt: null,
    };

    if (filters.caseId) {
      where.caseId = filters.caseId;
    }

    if (filters.documentType) {
      where.documentType = filters.documentType;
    }

    if (filters.q) {
      where.OR = [
        { documentType: { contains: filters.q } },
        { fileName: { contains: filters.q } },
        { originalFileName: { contains: filters.q } },
        { storagePath: { contains: filters.q } },
      ];
    }

    return where;
  }
}
