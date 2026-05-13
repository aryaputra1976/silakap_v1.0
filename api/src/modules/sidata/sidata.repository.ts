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
} satisfies Prisma.AsnInclude;

export type UnitKerjaRecord = Prisma.UnitKerjaGetPayload<{
  select: typeof unitSelect;
}>;

export type AsnRecord = Prisma.AsnGetPayload<{
  include: typeof asnInclude;
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
      orderBy: [{ level: 'asc' }, { kode: 'asc' }, { nama: 'asc' }],
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
      where.jenisAsn = filters.jenisAsn;
    }

    if (filters.q) {
      where.OR = [
        { nip: { contains: filters.q } },
        { nik: { contains: filters.q } },
        { nama: { contains: filters.q } },
        { email: { contains: filters.q } },
        { jabatanNama: { contains: filters.q } },
      ];
    }

    return where;
  }
}
