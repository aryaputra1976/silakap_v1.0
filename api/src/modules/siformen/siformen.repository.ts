import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  AbkQueryDto,
  BezettingQueryDto,
  FormasiQueryDto,
  JabatanFungsionalRefQueryDto,
  JabatanQueryDto,
} from './dto/query.dto';

@Injectable()
export class SiformenRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  // ── Jabatan Fungsional Ref ───────────────────────────────────────────────

  async findManyJabatanFungsionalRef(query: JabatanFungsionalRefQueryDto) {
    const page = parsePage(query.page);
    const limit = parseLimit(query.limit);
    const where: Prisma.SiformenJabatanFungsionalRefWhereInput = {};

    if (query.q) {
      where.OR = [
        { namaJabatan: { contains: query.q } },
        { rumpunJabatan: { contains: query.q } },
        { instansiPembina: { contains: query.q } },
      ];
    }
    if (query.kategori) where.kategori = query.kategori;
    if (query.rumpunJabatan) where.rumpunJabatan = { contains: query.rumpunJabatan };
    if (query.instansiPembina) where.instansiPembina = { contains: query.instansiPembina };

    const [items, total] = await Promise.all([
      this.prisma.siformenJabatanFungsionalRef.findMany({
        where,
        orderBy: [{ namaJabatan: 'asc' }, { jenjang: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.siformenJabatanFungsionalRef.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findJabatanFungsionalRefById(id: string) {
    return this.prisma.siformenJabatanFungsionalRef.findUnique({ where: { id } });
  }

  async createJabatanFungsionalRef(data: Prisma.SiformenJabatanFungsionalRefCreateInput) {
    return this.prisma.siformenJabatanFungsionalRef.create({ data });
  }

  async bulkUpsertJabatanFungsionalRef(
    items: Prisma.SiformenJabatanFungsionalRefCreateInput[],
  ): Promise<{ created: number; skipped: number }> {
    let created = 0;
    let skipped = 0;

    for (const item of items) {
      const existing = await this.prisma.siformenJabatanFungsionalRef.findFirst({
        where: { namaJabatan: item.namaJabatan as string, jenjang: item.jenjang as string },
        select: { id: true },
      });

      if (existing) {
        await this.prisma.siformenJabatanFungsionalRef.update({
          where: { id: existing.id },
          data: item,
        });
        skipped++;
      } else {
        await this.prisma.siformenJabatanFungsionalRef.create({ data: item });
        created++;
      }
    }

    return { created, skipped };
  }

  async updateJabatanFungsionalRef(
    id: string,
    data: Prisma.SiformenJabatanFungsionalRefUpdateInput,
  ) {
    return this.prisma.siformenJabatanFungsionalRef.update({ where: { id }, data });
  }

  async deleteJabatanFungsionalRef(id: string) {
    return this.prisma.siformenJabatanFungsionalRef.delete({ where: { id } });
  }

  async listRumpunJabatan(): Promise<string[]> {
    const rows = await this.prisma.siformenJabatanFungsionalRef.findMany({
      where: { rumpunJabatan: { not: null } },
      select: { rumpunJabatan: true },
      distinct: ['rumpunJabatan'],
      orderBy: { rumpunJabatan: 'asc' },
    });
    return rows.map((r) => r.rumpunJabatan as string);
  }

  async listInstansiPembina(): Promise<string[]> {
    const rows = await this.prisma.siformenJabatanFungsionalRef.findMany({
      where: { instansiPembina: { not: null } },
      select: { instansiPembina: true },
      distinct: ['instansiPembina'],
      orderBy: { instansiPembina: 'asc' },
    });
    return rows.map((r) => r.instansiPembina as string);
  }

  // ── Jabatan ──────────────────────────────────────────────────────────────

  async findManyJabatan(query: JabatanQueryDto) {
    const page = parsePage(query.page);
    const limit = parseLimit(query.limit);
    const where: Prisma.SiformenJabatanWhereInput = { deletedAt: null };

    if (query.q) {
      where.OR = [
        { namaJabatan: { contains: query.q } },
        { kodeJabatan: { contains: query.q } },
        { unitKerja: { contains: query.q } },
      ];
    }
    if (query.jenisJabatan) where.jenisJabatan = query.jenisJabatan;
    if (query.unitKerja) where.unitKerja = { contains: query.unitKerja };
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';

    const [items, total] = await Promise.all([
      this.prisma.siformenJabatan.findMany({
        where,
        include: { jabatanFungsionalRef: true },
        orderBy: [{ unitKerja: 'asc' }, { namaJabatan: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.siformenJabatan.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findJabatanById(id: string) {
    return this.prisma.siformenJabatan.findFirst({
      where: { id, deletedAt: null },
      include: { jabatanFungsionalRef: true },
    });
  }

  async findJabatanByKode(kodeJabatan: string) {
    return this.prisma.siformenJabatan.findFirst({ where: { kodeJabatan, deletedAt: null } });
  }

  async createJabatan(data: Prisma.SiformenJabatanCreateInput) {
    return this.prisma.siformenJabatan.create({ data });
  }

  async updateJabatan(id: string, data: Prisma.SiformenJabatanUpdateInput) {
    return this.prisma.siformenJabatan.update({ where: { id }, data });
  }

  async softDeleteJabatan(id: string) {
    return this.prisma.siformenJabatan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ── Bezetting ────────────────────────────────────────────────────────────

  async findManyBezetting(query: BezettingQueryDto) {
    const page = parsePage(query.page);
    const limit = parseLimit(query.limit);
    const where: Prisma.SiformenBezettingWhereInput = {};

    if (query.tahun) where.tahun = parseInt(query.tahun, 10);
    if (query.unitKerja) where.unitKerja = { contains: query.unitKerja };
    if (query.statusIsi) where.statusIsi = query.statusIsi;

    const [items, total] = await Promise.all([
      this.prisma.siformenBezetting.findMany({
        where,
        include: { jabatan: true },
        orderBy: [{ unitKerja: 'asc' }, { namaJabatan: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.siformenBezetting.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findBezettingById(id: string) {
    return this.prisma.siformenBezetting.findUnique({
      where: { id },
      include: { jabatan: true },
    });
  }

  async createBezetting(data: Prisma.SiformenBezettingCreateInput) {
    return this.prisma.siformenBezetting.create({
      data,
      include: { jabatan: true },
    });
  }

  async updateBezetting(id: string, data: Prisma.SiformenBezettingUpdateInput) {
    return this.prisma.siformenBezetting.update({
      where: { id },
      data,
      include: { jabatan: true },
    });
  }

  async deleteBezetting(id: string) {
    return this.prisma.siformenBezetting.delete({ where: { id } });
  }

  // ── Formasi ──────────────────────────────────────────────────────────────

  async findManyFormasi(query: FormasiQueryDto) {
    const page = parsePage(query.page);
    const limit = parseLimit(query.limit);
    const where: Prisma.SiformenFormasiWhereInput = { deletedAt: null };

    if (query.tahun) where.tahun = parseInt(query.tahun, 10);
    if (query.unitKerja) where.unitKerja = { contains: query.unitKerja };
    if (query.jenisFormasi) where.jenisFormasi = query.jenisFormasi;
    if (query.status) where.status = query.status;

    const [items, total] = await Promise.all([
      this.prisma.siformenFormasi.findMany({
        where,
        include: { jabatan: true },
        orderBy: [{ tahun: 'desc' }, { unitKerja: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.siformenFormasi.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findFormasiById(id: string) {
    return this.prisma.siformenFormasi.findFirst({
      where: { id, deletedAt: null },
      include: { jabatan: true },
    });
  }

  async createFormasi(data: Prisma.SiformenFormasiCreateInput) {
    return this.prisma.siformenFormasi.create({
      data,
      include: { jabatan: true },
    });
  }

  async updateFormasi(id: string, data: Prisma.SiformenFormasiUpdateInput) {
    return this.prisma.siformenFormasi.update({
      where: { id },
      data,
      include: { jabatan: true },
    });
  }

  async softDeleteFormasi(id: string) {
    return this.prisma.siformenFormasi.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ── ABK ──────────────────────────────────────────────────────────────────

  async findManyAbk(query: AbkQueryDto) {
    const page = parsePage(query.page);
    const limit = parseLimit(query.limit);
    const where: Prisma.SiformenAbkWhereInput = {};

    if (query.tahun) where.tahun = parseInt(query.tahun, 10);
    if (query.unitKerja) where.unitKerja = { contains: query.unitKerja };

    const [items, total] = await Promise.all([
      this.prisma.siformenAbk.findMany({
        where,
        include: { jabatan: true },
        orderBy: [{ tahun: 'desc' }, { unitKerja: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.siformenAbk.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findAbkById(id: string) {
    return this.prisma.siformenAbk.findUnique({
      where: { id },
      include: { jabatan: true },
    });
  }

  async createAbk(data: Prisma.SiformenAbkCreateInput) {
    return this.prisma.siformenAbk.create({
      data,
      include: { jabatan: true },
    });
  }

  async updateAbk(id: string, data: Prisma.SiformenAbkUpdateInput) {
    return this.prisma.siformenAbk.update({
      where: { id },
      data,
      include: { jabatan: true },
    });
  }

  async deleteAbk(id: string) {
    return this.prisma.siformenAbk.delete({ where: { id } });
  }

  async countFilledBezetting(params: {
    jabatanId: string | null;
    namaJabatan: string;
    tahun: number;
  }): Promise<number> {
    const where: Prisma.SiformenBezettingWhereInput = {
      tahun: params.tahun,
      statusIsi: 'FILLED',
    };

    if (params.jabatanId) {
      where.jabatanId = params.jabatanId;
    } else {
      where.namaJabatan = params.namaJabatan;
    }

    return this.prisma.siformenBezetting.count({ where });
  }

  // ── Dashboard ────────────────────────────────────────────────────────────

  async getDashboardSummary(tahun: number) {
    const [
      totalJabatan,
      totalBezetting,
      bezettingByStatus,
      totalFormasi,
      formasiByStatus,
      formasiByJenis,
      totalAbk,
    ] = await Promise.all([
      this.prisma.siformenJabatan.count({ where: { deletedAt: null, isActive: true } }),
      this.prisma.siformenBezetting.count({ where: { tahun } }),
      this.prisma.siformenBezetting.groupBy({
        by: ['statusIsi'],
        where: { tahun },
        _count: { _all: true },
      }),
      this.prisma.siformenFormasi.count({ where: { tahun, deletedAt: null } }),
      this.prisma.siformenFormasi.groupBy({
        by: ['status'],
        where: { tahun, deletedAt: null },
        _count: { _all: true },
        _sum: { jumlahUsulan: true },
      }),
      this.prisma.siformenFormasi.groupBy({
        by: ['jenisFormasi'],
        where: { tahun, deletedAt: null },
        _count: { _all: true },
        _sum: { jumlahUsulan: true },
      }),
      this.prisma.siformenAbk.count({ where: { tahun } }),
    ]);

    const filled = bezettingByStatus.find((b) => b.statusIsi === 'FILLED')?._count._all ?? 0;
    const vacant = bezettingByStatus.find((b) => b.statusIsi === 'VACANT')?._count._all ?? 0;
    const acting = bezettingByStatus.find((b) => b.statusIsi === 'ACTING')?._count._all ?? 0;

    return {
      tahun,
      jabatan: { total: totalJabatan },
      bezetting: {
        total: totalBezetting,
        filled,
        vacant,
        acting,
        fillRate: totalBezetting > 0 ? Math.round((filled / totalBezetting) * 100) : 0,
      },
      formasi: {
        total: totalFormasi,
        byStatus: formasiByStatus.map((s) => ({
          status: s.status,
          count: s._count._all,
          totalUsulan: s._sum.jumlahUsulan ?? 0,
        })),
        byJenis: formasiByJenis.map((j) => ({
          jenisFormasi: j.jenisFormasi,
          count: j._count._all,
          totalUsulan: j._sum.jumlahUsulan ?? 0,
        })),
      },
      abk: { total: totalAbk },
    };
  }
}

function parsePage(val: string | undefined): number {
  const n = parseInt(val ?? '1', 10);
  return Number.isFinite(n) && n >= 1 ? Math.min(n, 100_000) : 1;
}

function parseLimit(val: string | undefined): number {
  const n = parseInt(val ?? '20', 10);
  return Number.isFinite(n) ? Math.min(Math.max(n, 1), 100) : 20;
}
