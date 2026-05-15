import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { NormalizedGenericReferenceFilters, NormalizedJabatanFilters } from './sidata-reference.types';

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

export type GenericRefRow = {
  id: string;
  kode: string | null;
  nama: string;
  isActive: boolean;
};

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

  async findGenericReferences(filters: NormalizedGenericReferenceFilters): Promise<GenericRefRow[]> {
    const select = { id: true, kode: true, nama: true, isActive: true } as const;
    const orderBy = { nama: 'asc' as const };

    switch (filters.type) {
      case 'GOLONGAN': {
        const where: Prisma.RefGolonganWhereInput = { deletedAt: null };
        if (filters.isActive !== undefined) where.isActive = filters.isActive;
        if (filters.q) where.OR = [{ kode: { contains: filters.q } }, { nama: { contains: filters.q } }];
        return this.prisma.refGolongan.findMany({ where, select, orderBy });
      }
      case 'PANGKAT': {
        const where: Prisma.RefPangkatWhereInput = { deletedAt: null };
        if (filters.isActive !== undefined) where.isActive = filters.isActive;
        if (filters.q) where.OR = [{ kode: { contains: filters.q } }, { nama: { contains: filters.q } }];
        return this.prisma.refPangkat.findMany({ where, select, orderBy });
      }
      case 'PENDIDIKAN': {
        const where: Prisma.RefPendidikanWhereInput = { deletedAt: null };
        if (filters.isActive !== undefined) where.isActive = filters.isActive;
        if (filters.q) where.OR = [{ kode: { contains: filters.q } }, { nama: { contains: filters.q } }];
        return this.prisma.refPendidikan.findMany({ where, select, orderBy });
      }
      case 'AGAMA': {
        const where: Prisma.RefAgamaWhereInput = { deletedAt: null };
        if (filters.isActive !== undefined) where.isActive = filters.isActive;
        if (filters.q) where.OR = [{ kode: { contains: filters.q } }, { nama: { contains: filters.q } }];
        return this.prisma.refAgama.findMany({ where, select, orderBy });
      }
      case 'JENIS_KELAMIN': {
        const where: Prisma.RefJenisKelaminWhereInput = { deletedAt: null };
        if (filters.isActive !== undefined) where.isActive = filters.isActive;
        if (filters.q) where.OR = [{ kode: { contains: filters.q } }, { nama: { contains: filters.q } }];
        return this.prisma.refJenisKelamin.findMany({ where, select, orderBy });
      }
      case 'STATUS_KAWIN': {
        const where: Prisma.RefStatusKawinWhereInput = { deletedAt: null };
        if (filters.isActive !== undefined) where.isActive = filters.isActive;
        if (filters.q) where.OR = [{ kode: { contains: filters.q } }, { nama: { contains: filters.q } }];
        return this.prisma.refStatusKawin.findMany({ where, select, orderBy });
      }
      case 'KEDUDUKAN_HUKUM': {
        const where: Prisma.RefKedudukanHukumWhereInput = { deletedAt: null };
        if (filters.isActive !== undefined) where.isActive = filters.isActive;
        if (filters.q) where.OR = [{ kode: { contains: filters.q } }, { nama: { contains: filters.q } }];
        return this.prisma.refKedudukanHukum.findMany({ where, select, orderBy });
      }
      case 'JENIS_ASN': {
        const where: Prisma.RefJenisAsnWhereInput = { deletedAt: null };
        if (filters.isActive !== undefined) where.isActive = filters.isActive;
        if (filters.q) where.OR = [{ kode: { contains: filters.q } }, { nama: { contains: filters.q } }];
        return this.prisma.refJenisAsn.findMany({ where, select, orderBy });
      }
      default: {
        const _exhaustive: never = filters.type;
        throw new Error(`Unsupported reference type: ${String(_exhaustive)}`);
      }
    }
  }

  async upsertGenericReference(params: {
    type: NormalizedGenericReferenceFilters['type'];
    id?: string;
    kode: string | null;
    nama: string;
    isActive: boolean;
  }): Promise<GenericRefRow> {
    const data = {
      kode: params.kode,
      nama: params.nama,
      isActive: params.isActive,
      deletedAt: null,
    };
    const create = { id: randomUUID(), ...data };
    const select = { id: true, kode: true, nama: true, isActive: true } as const;
    const where = { id: params.id ?? '' };

    switch (params.type) {
      case 'GOLONGAN': return params.id ? this.prisma.refGolongan.update({ where, data, select }) : this.prisma.refGolongan.create({ data: create, select });
      case 'PANGKAT': return params.id ? this.prisma.refPangkat.update({ where, data, select }) : this.prisma.refPangkat.create({ data: create, select });
      case 'PENDIDIKAN': return params.id ? this.prisma.refPendidikan.update({ where, data, select }) : this.prisma.refPendidikan.create({ data: create, select });
      case 'AGAMA': return params.id ? this.prisma.refAgama.update({ where, data, select }) : this.prisma.refAgama.create({ data: create, select });
      case 'JENIS_KELAMIN': return params.id ? this.prisma.refJenisKelamin.update({ where, data, select }) : this.prisma.refJenisKelamin.create({ data: create, select });
      case 'STATUS_KAWIN': return params.id ? this.prisma.refStatusKawin.update({ where, data, select }) : this.prisma.refStatusKawin.create({ data: create, select });
      case 'KEDUDUKAN_HUKUM': return params.id ? this.prisma.refKedudukanHukum.update({ where, data, select }) : this.prisma.refKedudukanHukum.create({ data: create, select });
      case 'JENIS_ASN': return params.id ? this.prisma.refJenisAsn.update({ where, data, select }) : this.prisma.refJenisAsn.create({ data: create, select });
      default: throw new Error(`Unsupported reference type: ${String(params.type)}`);
    }
  }

  async deactivateGenericReference(type: NormalizedGenericReferenceFilters['type'], id: string): Promise<GenericRefRow> {
    return this.upsertGenericReference({
      type,
      id,
      kode: null,
      nama: await this.getGenericReferenceName(type, id),
      isActive: false,
    });
  }

  async upsertUnit(params: {
    id?: string;
    kode: string;
    nama: string;
    parentId: string | null;
    level: number;
    isActive: boolean;
  }): Promise<{ id: string; kode: string; nama: string; parentId: string | null; level: number; isActive: boolean }> {
    return params.id
      ? this.prisma.unitKerja.update({
          where: { id: params.id },
          data: { kode: params.kode, nama: params.nama, parentId: params.parentId, level: params.level, isActive: params.isActive, deletedAt: null },
          select: { id: true, kode: true, nama: true, parentId: true, level: true, isActive: true },
        })
      : this.prisma.unitKerja.create({
          data: { id: randomUUID(), kode: params.kode, nama: params.nama, parentId: params.parentId, level: params.level, isActive: params.isActive },
          select: { id: true, kode: true, nama: true, parentId: true, level: true, isActive: true },
        });
  }

  async deactivateUnit(id: string) {
    return this.prisma.unitKerja.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
      select: { id: true, kode: true, nama: true, parentId: true, level: true, isActive: true },
    });
  }

  async upsertJabatan(params: {
    id?: string;
    jenisJabatanId: string;
    kode: string | null;
    nama: string;
    namaNormalized: string;
    rumpun: string | null;
    jenjang: string | null;
    kelasJabatan: number | null;
    isActive: boolean;
  }): Promise<JabatanRecord> {
    const data = {
      jenisJabatanId: params.jenisJabatanId,
      kode: params.kode,
      nama: params.nama,
      namaNormalized: params.namaNormalized,
      rumpun: params.rumpun,
      jenjang: params.jenjang,
      kelasJabatan: params.kelasJabatan,
      source: 'MANUAL',
      isActive: params.isActive,
      deletedAt: null,
    };
    return params.id
      ? this.prisma.refJabatan.update({ where: { id: params.id }, data, include: jabatanInclude })
      : this.prisma.refJabatan.create({ data: { id: randomUUID(), ...data }, include: jabatanInclude });
  }

  async deactivateJabatan(id: string): Promise<JabatanRecord> {
    return this.prisma.refJabatan.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
      include: jabatanInclude,
    });
  }

  private async getGenericReferenceName(type: NormalizedGenericReferenceFilters['type'], id: string): Promise<string> {
    const select = { nama: true, kode: true } as const;
    const record = await (() => {
      switch (type) {
        case 'GOLONGAN': return this.prisma.refGolongan.findUnique({ where: { id }, select });
        case 'PANGKAT': return this.prisma.refPangkat.findUnique({ where: { id }, select });
        case 'PENDIDIKAN': return this.prisma.refPendidikan.findUnique({ where: { id }, select });
        case 'AGAMA': return this.prisma.refAgama.findUnique({ where: { id }, select });
        case 'JENIS_KELAMIN': return this.prisma.refJenisKelamin.findUnique({ where: { id }, select });
        case 'STATUS_KAWIN': return this.prisma.refStatusKawin.findUnique({ where: { id }, select });
        case 'KEDUDUKAN_HUKUM': return this.prisma.refKedudukanHukum.findUnique({ where: { id }, select });
        case 'JENIS_ASN': return this.prisma.refJenisAsn.findUnique({ where: { id }, select });
        default: return null;
      }
    })();
    if (!record) throw new Error('REFERENCE_NOT_FOUND');
    return record.nama;
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
