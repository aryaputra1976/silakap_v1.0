import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NormalizedAsnFilters, UnitTreeNode } from './sidata.types';

const unitSelect = {
  id: true,
  kode: true,
  nama: true,
  parentId: true,
  level: true,
  sortOrder: true,
  isActive: true,
} satisfies Prisma.UnitKerjaSelect;

const asnInclude = {
  unitKerja: {
    select: {
      id: true,
      kode: true,
      nama: true,
    },
  },
  siasnProfile: {
    select: {
      email: true,
      emailGov: true,
      phone: true,
      tempatLahirNama: true,
      tanggalLahir: true,
      jenisKelaminNama: true,
      agamaNama: true,
      statusKawinNama: true,
      tmtPns: true,
      tmtPensiun: true,
    },
  },
} satisfies Prisma.AsnInclude;

const asnAssignmentHistorySelect = {
  id: true,
  asnId: true,
  sourceBatchId: true,
  unitKerjaId: true,
  siasnUnorId: true,
  unorNama: true,
  jabatanRefId: true,
  siasnJabatanId: true,
  jabatanNama: true,
  jenisJabatanNama: true,
  tmtJabatan: true,
  effectiveDate: true,
  syncedAt: true,
  createdAt: true,
  unitKerja: {
    select: {
      id: true,
      kode: true,
      nama: true,
    },
  },
  sourceBatch: {
    select: {
      id: true,
      fileName: true,
      importType: true,
      createdAt: true,
    },
  },
} satisfies Prisma.AsnAssignmentHistorySelect;

const asnGolonganHistorySelect = {
  id: true,
  asnId: true,
  sourceBatchId: true,
  golonganRefId: true,
  siasnGolonganId: true,
  golonganNama: true,
  pangkatNama: true,
  ruangNama: true,
  tmtGolongan: true,
  effectiveDate: true,
  syncedAt: true,
  createdAt: true,
  sourceBatch: {
    select: {
      id: true,
      fileName: true,
      importType: true,
      createdAt: true,
    },
  },
} satisfies Prisma.AsnGolonganHistorySelect;

const asnDocumentSelect = {
  id: true,
  asnId: true,
  documentType: true,
  fileName: true,
  originalFileName: true,
  storagePath: true,
  mimeType: true,
  fileSize: true,
  checksum: true,
  version: true,
  uploadedBy: true,
  uploadedAt: true,
  createdAt: true,
} satisfies Prisma.DocumentSelect;

export type UnitKerjaRecord = Prisma.UnitKerjaGetPayload<{
  select: typeof unitSelect;
}>;

export type AsnRecord = Prisma.AsnGetPayload<{
  include: typeof asnInclude;
}>;

export type AsnAssignmentHistoryRecord =
  Prisma.AsnAssignmentHistoryGetPayload<{
    select: typeof asnAssignmentHistorySelect;
  }>;

export type AsnGolonganHistoryRecord = Prisma.AsnGolonganHistoryGetPayload<{
  select: typeof asnGolonganHistorySelect;
}>;

export type AsnDocumentRecord = Prisma.DocumentGetPayload<{
  select: typeof asnDocumentSelect;
}>;

@Injectable()
export class SidataRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findUnits(): Promise<UnitKerjaRecord[]> {
    return this.prisma.unitKerja.findMany({
      where: {
        deletedAt: null,
        isActive: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { level: 'asc' }, { kode: 'asc' }],
      select: unitSelect,
    });
  }

  async findUnitTree(): Promise<UnitTreeNode[]> {
    const units = await this.findUnits();
    const nodes = new Map<string, UnitTreeNode>();
    const roots: UnitTreeNode[] = [];

    for (const unit of units) {
      nodes.set(unit.id, {
        ...unit,
        children: [],
      });
    }

    for (const unit of units) {
      const node = nodes.get(unit.id);

      if (!node) {
        continue;
      }

      if (unit.parentId && nodes.has(unit.parentId)) {
        nodes.get(unit.parentId)?.children.push(node);
        continue;
      }

      roots.push(node);
    }

    return roots;
  }

  async findAsnList(filters: NormalizedAsnFilters): Promise<{
    items: AsnRecord[];
    total: number;
  }> {
    const where = this.buildAsnWhere(filters);
    const skip = (filters.page - 1) * filters.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.asn.findMany({
        where,
        include: asnInclude,
        orderBy: [{ nama: 'asc' }, { nip: 'asc' }],
        skip,
        take: filters.limit,
      }),
      this.prisma.asn.count({ where }),
    ]);

    return { items, total };
  }

  async findAsnById(id: string): Promise<AsnRecord | null> {
    return this.prisma.asn.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: asnInclude,
    });
  }

  async updateAsn(
    id: string,
    data: Prisma.AsnUncheckedUpdateInput,
  ): Promise<AsnRecord> {
    return this.prisma.asn.update({
      where: { id },
      data,
      include: asnInclude,
    });
  }

  async findAsnExportPage(params: {
    filters: NormalizedAsnFilters;
    cursorId?: string;
    take: number;
  }): Promise<AsnRecord[]> {
    return this.prisma.asn.findMany({
      where: this.buildAsnWhere(params.filters),
      include: asnInclude,
      orderBy: [{ nama: 'asc' }, { nip: 'asc' }, { id: 'asc' }],
      cursor: params.cursorId ? { id: params.cursorId } : undefined,
      skip: params.cursorId ? 1 : 0,
      take: params.take,
    });
  }

  async findAsnAssignmentHistory(
    asnId: string,
  ): Promise<AsnAssignmentHistoryRecord[]> {
    return this.prisma.asnAssignmentHistory.findMany({
      where: {
        asnId,
        deletedAt: null,
      },
      orderBy: [
        { effectiveDate: 'desc' },
        { syncedAt: 'desc' },
        { createdAt: 'desc' },
      ],
      select: asnAssignmentHistorySelect,
    });
  }

  async findAsnGolonganHistory(
    asnId: string,
  ): Promise<AsnGolonganHistoryRecord[]> {
    return this.prisma.asnGolonganHistory.findMany({
      where: {
        asnId,
        deletedAt: null,
      },
      orderBy: [
        { effectiveDate: 'desc' },
        { syncedAt: 'desc' },
        { createdAt: 'desc' },
      ],
      select: asnGolonganHistorySelect,
    });
  }

  async findAsnDocuments(asnId: string): Promise<AsnDocumentRecord[]> {
    return this.prisma.document.findMany({
      where: { asnId, deletedAt: null },
      orderBy: [{ uploadedAt: 'desc' }, { createdAt: 'desc' }],
      select: asnDocumentSelect,
    });
  }

  async findAsnDocumentById(id: string): Promise<AsnDocumentRecord | null> {
    return this.prisma.document.findFirst({
      where: { id, deletedAt: null, asnId: { not: null } },
      select: asnDocumentSelect,
    });
  }

  async createAsnDocument(data: Prisma.DocumentUncheckedCreateInput): Promise<AsnDocumentRecord> {
    return this.prisma.document.create({
      data,
      select: asnDocumentSelect,
    });
  }

  async softDeleteAsnDocument(id: string): Promise<AsnDocumentRecord> {
    return this.prisma.document.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: asnDocumentSelect,
    });
  }

  private buildAsnWhere(filters: NormalizedAsnFilters): Prisma.AsnWhereInput {
    const where: Prisma.AsnWhereInput = {
      deletedAt: null,
    };

    if (filters.unitKerjaId) {
      where.unitKerjaId = filters.unitKerjaId;
    }

    if (filters.statusAsn) {
      where.statusAsn = filters.statusAsn;
    }

    if (filters.jenisAsn) {
      where.jenisAsnNama = filters.jenisAsn;
    }

    if (filters.q) {
      where.OR = [
        { nip: { contains: filters.q } },
        { nik: { contains: filters.q } },
        { nama: { contains: filters.q } },
        { siasnProfile: { email: { contains: filters.q } } },
        { siasnProfile: { phone: { contains: filters.q } } },
        { jabatanNama: { contains: filters.q } },
      ];
    }

    return where;
  }
}
