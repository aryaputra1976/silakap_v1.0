import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NormalizedJabatanFilters } from './sidata-reference.types';

const jenisJabatanSelect = {
  id: true,
  kode: true,
  nama: true,
  deskripsi: true,
  isActive: true,
} satisfies Prisma.RefJenisJabatanSelect;

const jabatanInclude = {
  jenisJabatan: {
    select: {
      id: true,
      kode: true,
      nama: true,
    },
  },
} satisfies Prisma.RefJabatanInclude;

export type JenisJabatanRecord = Prisma.RefJenisJabatanGetPayload<{
  select: typeof jenisJabatanSelect;
}>;

export type JabatanRecord = Prisma.RefJabatanGetPayload<{
  include: typeof jabatanInclude;
}>;

@Injectable()
export class SidataReferenceRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findJenisJabatan(): Promise<JenisJabatanRecord[]> {
    return this.prisma.refJenisJabatan.findMany({
      where: { deletedAt: null },
      orderBy: { kode: 'asc' },
      select: jenisJabatanSelect,
    });
  }

  async findJabatanList(filters: NormalizedJabatanFilters): Promise<{
    items: JabatanRecord[];
    total: number;
  }> {
    const where = this.buildJabatanWhere(filters);
    const skip = (filters.page - 1) * filters.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.refJabatan.findMany({
        where,
        include: jabatanInclude,
        orderBy: [{ jenisJabatanId: 'asc' }, { nama: 'asc' }],
        skip,
        take: filters.limit,
      }),
      this.prisma.refJabatan.count({ where }),
    ]);

    return { items, total };
  }

  async findJabatanById(id: string): Promise<JabatanRecord | null> {
    return this.prisma.refJabatan.findFirst({
      where: { id, deletedAt: null },
      include: jabatanInclude,
    });
  }

  private buildJabatanWhere(filters: NormalizedJabatanFilters): Prisma.RefJabatanWhereInput {
    const where: Prisma.RefJabatanWhereInput = { deletedAt: null };

    if (filters.jenisJabatanKode) {
      where.jenisJabatan = { kode: filters.jenisJabatanKode };
    }

    if (filters.rumpun) {
      where.rumpun = { contains: filters.rumpun };
    }

    if (filters.kelasJabatan) {
      const kelas = parseInt(filters.kelasJabatan, 10);
      if (!isNaN(kelas)) {
        where.kelasJabatan = kelas;
      }
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.q) {
      where.OR = [
        { kode: { contains: filters.q } },
        { nama: { contains: filters.q } },
        { namaNormalized: { contains: filters.q } },
        { siasnKode: { contains: filters.q } },
        { siasnNama: { contains: filters.q } },
      ];
    }

    return where;
  }
}
