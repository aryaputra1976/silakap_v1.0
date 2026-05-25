import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { BulkImportJabatanItemDto } from './dto/jabatan.dto';
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
    return this.prisma.$transaction(async (tx) => {
      let created = 0;
      let skipped = 0;

      for (const item of items) {
        const existing = await tx.siformenJabatanFungsionalRef.findFirst({
          where: { namaJabatan: item.namaJabatan as string, jenjang: item.jenjang as string },
          select: { id: true },
        });

        if (existing) {
          await tx.siformenJabatanFungsionalRef.update({
            where: { id: existing.id },
            data: item,
          });
          skipped++;
        } else {
          await tx.siformenJabatanFungsionalRef.create({ data: item });
          created++;
        }
      }

      return { created, skipped };
    });
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
        include: { jabatanFungsionalRef: true, unitKerjaRef: true },
        orderBy: [{ sortOrder: 'asc' }, { unitKerja: 'asc' }, { namaJabatan: 'asc' }],
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
      include: { jabatanFungsionalRef: true, unitKerjaRef: true },
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

  async generateJabatanFromUnitKerja(userId: string): Promise<{ created: number; updated: number; skipped: number }> {
    const SKIP_PATTERNS = [
      /^SD\s/i, /^SMP\s/i, /^SMA\s/i, /^SMK\s/i,
      /^TK\s/i, /^PAUD\s/i,
      /puskesmas\s+pembantu/i,
      /^poskesdes/i,
      /^korwil\s/i,
      /^SD\s+SMP\s/i,
      /satuan\s+pendidikan\s+non\s+formal\s+sanggar/i,
    ];

    const allUnits = await this.prisma.unitKerja.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    const byId = new Map(allUnits.map((u) => [u.id, u]));

    function getSkpdNama(unitId: string | null): string {
      if (!unitId) return '';
      const unit = byId.get(unitId);
      if (!unit) return '';
      if (unit.level === 1) return unit.nama;
      return getSkpdNama(unit.parentId);
    }

    function toNamaJabatan(nama: string, level: number): string {
      if (level === 1) {
        if (nama === 'Sekretariat Daerah') return 'Sekretaris Daerah';
        if (/^Inspektorat/i.test(nama)) return 'Inspektur Daerah';
        if (/^Sekretariat DPRD/i.test(nama)) return 'Sekretaris DPRD';
        if (/^Rumah Sakit/i.test(nama)) return 'Direktur ' + nama;
        if (/^Kecamatan\s/i.test(nama)) return 'Camat';
        if (/^Kelurahan\s/i.test(nama)) return 'Lurah';
        return 'Kepala ' + nama;
      }
      if (level === 2) {
        if (/^Sekretariat$/i.test(nama)) return 'Sekretaris';
        if (/^(Staf Ahli|Asisten|Inspektur Pembantu)/i.test(nama)) return nama;
        return 'Kepala ' + nama;
      }
      return 'Kepala ' + nama;
    }

    function toEselon(level: number, nama: string): string {
      if (level === 1) {
        if (nama === 'Sekretariat Daerah') return 'II.a';
        if (/^Kecamatan\s/i.test(nama)) return 'III.a';
        if (/^Kelurahan\s/i.test(nama)) return 'IV.a';
        return 'II.b';
      }
      if (level === 2) return 'III.a';
      if (level === 3) return 'IV.a';
      if (level === 4) return 'IV.b';
      return '';
    }

    const toProcess = allUnits.filter((u) => {
      if (u.level === 0) return false;
      return !SKIP_PATTERNS.some((p) => p.test(u.nama));
    });

    return this.prisma.$transaction(
      async (tx) => {
        let created = 0;
        let updated = 0;
        let skipped = 0;

        for (const unit of toProcess) {
          const namaJabatan = toNamaJabatan(unit.nama, unit.level);
          const eselonLevel = toEselon(unit.level, unit.nama);
          const unitKerja = unit.level === 1 ? unit.nama : getSkpdNama(unit.parentId);
          const kodeJabatan = `STR-${String(unit.sortOrder).padStart(4, '0')}`;

          const existing = await tx.siformenJabatan.findFirst({
            where: { unitKerjaId: unit.id, deletedAt: null },
            select: { id: true },
          });

          if (existing) {
            await tx.siformenJabatan.update({
              where: { id: existing.id },
              data: { namaJabatan, eselonLevel, unitKerja, sortOrder: unit.sortOrder, updatedBy: userId },
            });
            updated++;
          } else {
            const kodeConflict = await tx.siformenJabatan.findFirst({
              where: { kodeJabatan, deletedAt: null },
              select: { id: true },
            });
            const finalKode = kodeConflict
              ? `STR-${String(unit.sortOrder).padStart(4, '0')}-${unit.id.slice(0, 4)}`
              : kodeJabatan;

            await tx.siformenJabatan.create({
              data: {
                kodeJabatan: finalKode,
                namaJabatan,
                jenisJabatan: 'STRUKTURAL',
                eselonLevel: eselonLevel || null,
                unitKerja,
                unitKerjaId: unit.id,
                sortOrder: unit.sortOrder,
                createdBy: userId,
                updatedBy: userId,
              },
            });
            created++;
          }
        }

        return { created, updated, skipped };
      },
      { timeout: 120_000 },
    );
  }

  async bulkImportJabatan(
    items: BulkImportJabatanItemDto[],
    userId: string,
  ): Promise<{ created: number; updated: number }> {
    return this.prisma.$transaction(
      async (tx) => {
        let created = 0;
        let updated = 0;

        for (const item of items) {
          const existing = await tx.siformenJabatan.findFirst({
            where: { kodeJabatan: item.kodeJabatan, deletedAt: null },
            select: { id: true },
          });

          if (existing) {
            await tx.siformenJabatan.update({
              where: { id: existing.id },
              data: {
                namaJabatan: item.namaJabatan,
                jenisJabatan: item.jenisJabatan,
                eselonLevel: item.eselonLevel ?? null,
                unitKerja: item.unitKerja,
                sortOrder: item.sortOrder ?? null,
                updatedBy: userId,
              },
            });
            updated++;
          } else {
            await tx.siformenJabatan.create({
              data: {
                kodeJabatan: item.kodeJabatan,
                namaJabatan: item.namaJabatan,
                jenisJabatan: item.jenisJabatan,
                eselonLevel: item.eselonLevel ?? null,
                unitKerja: item.unitKerja,
                sortOrder: item.sortOrder ?? null,
                createdBy: userId,
                updatedBy: userId,
              },
            });
            created++;
          }
        }

        return { created, updated };
      },
      { timeout: 120_000 },
    );
  }

  async countActiveReferencesByJabatan(jabatanId: string): Promise<number> {
    const [bezetting, formasi, abk] = await Promise.all([
      this.prisma.siformenBezetting.count({ where: { jabatanId } }),
      this.prisma.siformenFormasi.count({ where: { jabatanId, deletedAt: null } }),
      this.prisma.siformenAbk.count({ where: { jabatanId } }),
    ]);
    return bezetting + formasi + abk;
  }

  // ── Bezetting ────────────────────────────────────────────────────────────

  async findManyBezetting(query: BezettingQueryDto) {
    const page = parsePage(query.page);
    const limit = parseLimit(query.limit);
    const where: Prisma.SiformenBezettingWhereInput = { deletedAt: null };

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
    return this.prisma.siformenBezetting.findFirst({
      where: { id, deletedAt: null },
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
    return this.prisma.siformenBezetting.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
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

  /** Atomic: update hanya jika status saat ini sesuai. Return null jika status sudah berubah. */
  async updateFormasiConditional(
    id: string,
    expectedStatus: string,
    data: Prisma.SiformenFormasiUpdateInput,
  ) {
    const result = await this.prisma.siformenFormasi.updateMany({
      where: { id, status: expectedStatus, deletedAt: null },
      data,
    });
    if (result.count === 0) return null;
    return this.prisma.siformenFormasi.findFirst({
      where: { id, deletedAt: null },
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
      deletedAt: null,
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
      this.prisma.siformenBezetting.count({ where: { tahun, deletedAt: null } }),
      this.prisma.siformenBezetting.groupBy({
        by: ['statusIsi'],
        where: { tahun, deletedAt: null },
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

    const filled = bezettingByStatus.find((b) => b.statusIsi === 'FILLED')?._count?._all ?? 0;
    const vacant = bezettingByStatus.find((b) => b.statusIsi === 'VACANT')?._count?._all ?? 0;
    const acting = bezettingByStatus.find((b) => b.statusIsi === 'ACTING')?._count?._all ?? 0;

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
