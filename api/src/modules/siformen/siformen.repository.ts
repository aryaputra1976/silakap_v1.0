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

  async addJabatanFromRef(
    refId: string,
    unitKerja: string,
    kodeJabatan: string | undefined,
    userId: string,
  ) {
    const ref = await this.prisma.siformenJabatanFungsionalRef.findUnique({ where: { id: refId } });
    if (!ref) throw new Error('Referensi jabatan tidak ditemukan');

    if (!kodeJabatan) {
      const count = await this.prisma.siformenJabatan.count({
        where: { kodeJabatan: { startsWith: 'FUN-' } },
      });
      kodeJabatan = `FUN-${String(count + 1).padStart(4, '0')}`;
      const conflict = await this.prisma.siformenJabatan.findFirst({
        where: { kodeJabatan, deletedAt: null },
      });
      if (conflict) {
        kodeJabatan = `FUN-${String(count + 1).padStart(4, '0')}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
      }
    }

    return this.prisma.siformenJabatan.create({
      data: {
        kodeJabatan,
        namaJabatan: ref.namaJabatan,
        jenisJabatan: 'FUNGSIONAL',
        unitKerja,
        jabatanFungsionalRefId: refId,
        createdBy: userId,
      },
      include: { jabatanFungsionalRef: true, unitKerjaRef: true },
    });
  }

  async syncJabatanFromAsn(
    userId: string,
  ): Promise<{ created: number; matched: number; skipped: number }> {
    const asnJabatan = await this.prisma.asn.groupBy({
      by: ['jabatanNama', 'jenisJabatanNama', 'unorNama', 'kelasJabatan'],
      where: {
        deletedAt: null,
        isActive: true,
        jabatanNama: { not: null },
        OR: [
          { jenisJabatanNama: { contains: 'Fungsional' } },
          { jenisJabatanNama: { contains: 'Pelaksana' } },
        ],
      },
      orderBy: { jabatanNama: 'asc' },
    });

    const existingJabatan = await this.prisma.siformenJabatan.findMany({
      where: { deletedAt: null },
      select: { namaJabatan: true, unitKerja: true },
    });
    const existingSet = new Set(existingJabatan.map((j) => `${j.namaJabatan}||${j.unitKerja}`));

    const refs = await this.prisma.siformenJabatanFungsionalRef.findMany({
      select: { id: true, namaJabatan: true },
    });
    const refMap = new Map(refs.map((r) => [r.namaJabatan.toLowerCase().trim(), r.id]));

    let funSeq = await this.prisma.siformenJabatan.count({
      where: { kodeJabatan: { startsWith: 'FUN-' } },
    });
    let plkSeq = await this.prisma.siformenJabatan.count({
      where: { kodeJabatan: { startsWith: 'PLK-' } },
    });

    let created = 0;
    let matched = 0;
    let skipped = 0;

    for (const row of asnJabatan) {
      const namaJabatan = row.jabatanNama?.trim();
      if (!namaJabatan) { skipped++; continue; }

      const unitKerja = row.unorNama?.trim() ?? '';
      const key = `${namaJabatan}||${unitKerja}`;
      if (existingSet.has(key)) { skipped++; continue; }

      const jenisNama = (row.jenisJabatanNama ?? '').toLowerCase();
      const jenisJabatan = jenisNama.includes('pelaksana') ? 'PELAKSANA' : 'FUNGSIONAL';
      const refId = refMap.get(namaJabatan.toLowerCase().trim()) ?? null;

      let kodeJabatan: string;
      if (jenisJabatan === 'FUNGSIONAL') {
        funSeq++;
        kodeJabatan = `FUN-${String(funSeq).padStart(4, '0')}`;
      } else {
        plkSeq++;
        kodeJabatan = `PLK-${String(plkSeq).padStart(4, '0')}`;
      }

      try {
        await this.prisma.siformenJabatan.create({
          data: {
            kodeJabatan,
            namaJabatan,
            jenisJabatan,
            unitKerja,
            kelasJabatan: row.kelasJabatan ?? null,
            jabatanFungsionalRefId: refId,
            createdBy: userId,
          },
        });
        existingSet.add(key);
        created++;
        if (refId) matched++;
      } catch {
        skipped++;
      }
    }

    return { created, matched, skipped };
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

  async generateBezettingFromJabatan(
    tahun: number,
    userId: string,
  ): Promise<{ created: number; skipped: number }> {
    const jabatanList = await this.prisma.siformenJabatan.findMany({
      where: { deletedAt: null, isActive: true, jenisJabatan: 'STRUKTURAL' },
      orderBy: [{ sortOrder: 'asc' }, { unitKerja: 'asc' }],
    });

    const existing = await this.prisma.siformenBezetting.findMany({
      where: { tahun, deletedAt: null, jabatanId: { not: null } },
      select: { jabatanId: true },
    });
    const existingIds = new Set(existing.map((b) => b.jabatanId!));

    let created = 0;
    let skipped = 0;

    await this.prisma.$transaction(
      async (tx) => {
        for (const jabatan of jabatanList) {
          if (existingIds.has(jabatan.id)) {
            skipped++;
            continue;
          }
          await tx.siformenBezetting.create({
            data: {
              jabatanId: jabatan.id,
              namaJabatan: jabatan.namaJabatan,
              unitKerja: jabatan.unitKerja,
              tahun,
              statusIsi: 'VACANT',
              createdBy: userId,
            },
          });
          created++;
        }
      },
      { timeout: 60_000 },
    );

    return { created, skipped };
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

  // ── BUP (SiformenBup table) ───────────────────────────────────────────────

  async upsertBup(jabatanId: string, tahun: number, jumlahPensiun: number, userId?: string) {
    return this.prisma.siformenBup.upsert({
      where: { jabatanId_tahun: { jabatanId, tahun } },
      create: { jabatanId, tahun, jumlahPensiun, createdBy: userId },
      update: { jumlahPensiun, updatedBy: userId },
    });
  }

  async bulkUpsertBup(items: { jabatanId: string; tahun: number; jumlahPensiun: number }[], userId?: string) {
    let upserted = 0;
    for (const item of items) {
      await this.upsertBup(item.jabatanId, item.tahun, item.jumlahPensiun, userId);
      upserted++;
    }
    return { upserted };
  }

  async getBupPerJabatan(jabatanId: string) {
    const BUP_YEARS = [2024, 2025, 2026, 2027, 2028];
    const rows = await this.prisma.siformenBup.findMany({
      where: { jabatanId },
      orderBy: { tahun: 'asc' },
    });
    return BUP_YEARS.map((thn) => ({
      tahun: thn,
      jumlahPensiun: rows.find((r) => r.tahun === thn)?.jumlahPensiun ?? 0,
    }));
  }

  async generateBupFromAsn(tahunMulai: number, tahunAkhir: number, userId?: string) {
    const BUP_YEARS: number[] = [];
    for (let y = tahunMulai; y <= tahunAkhir; y++) BUP_YEARS.push(y);

    // Get all active jabatan with their unitKerjaId
    const jabatanList = await this.prisma.siformenJabatan.findMany({
      where: { deletedAt: null, isActive: true, unitKerjaId: { not: null } },
      select: { id: true, namaJabatan: true, unitKerjaId: true },
    });

    // Get ASN pensiun grouped by unitKerjaId and year
    const asnBup = await this.prisma.asn.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        tmtPensiun: {
          gte: new Date(`${tahunMulai}-01-01`),
          lte: new Date(`${tahunAkhir}-12-31`),
        },
      },
      select: { unitKerjaId: true, tmtPensiun: true, jabatanNama: true },
    });

    // Build jabatan-name lookup per unit
    const jabatanByUnit = new Map<string, { id: string; namaJabatan: string }[]>();
    for (const j of jabatanList) {
      if (!j.unitKerjaId) continue;
      if (!jabatanByUnit.has(j.unitKerjaId)) jabatanByUnit.set(j.unitKerjaId, []);
      jabatanByUnit.get(j.unitKerjaId)!.push({ id: j.id, namaJabatan: j.namaJabatan });
    }

    // Map ASN to jabatan by name match, fallback to unit total distributed evenly
    const bupCountMap = new Map<string, Map<number, number>>(); // jabatanId -> tahun -> count
    for (const asn of asnBup) {
      if (!asn.unitKerjaId || !asn.tmtPensiun) continue;
      const thn = asn.tmtPensiun.getFullYear();
      const jabatanInUnit = jabatanByUnit.get(asn.unitKerjaId) ?? [];
      const match = asn.jabatanNama
        ? jabatanInUnit.find((j) => j.namaJabatan.toLowerCase().includes((asn.jabatanNama as string).toLowerCase().slice(0, 15)))
        : null;
      const jabatanId = match?.id ?? jabatanInUnit[0]?.id;
      if (!jabatanId) continue;
      if (!bupCountMap.has(jabatanId)) bupCountMap.set(jabatanId, new Map());
      const ym = bupCountMap.get(jabatanId)!;
      ym.set(thn, (ym.get(thn) ?? 0) + 1);
    }

    // Upsert all
    let created = 0;
    for (const [jabatanId, yearMap] of bupCountMap) {
      for (const [tahun, jumlahPensiun] of yearMap) {
        await this.upsertBup(jabatanId, tahun, jumlahPensiun, userId);
        created++;
      }
    }
    return { created };
  }

  // ── Proyeksi ──────────────────────────────────────────────────────────────

  async getProyeksiSummary() {
    const BUP_YEARS = [2024, 2025, 2026, 2027, 2028];

    const [totalAsnAktif, abkAgg, bupGroups] = await Promise.all([
      this.prisma.asn.count({ where: { deletedAt: null, isActive: true } }),
      this.prisma.siformenAbk.aggregate({ _sum: { kebutuhanPegawai: true } }),
      // BUP dari SiformenBup table (input manual / generate-from-asn)
      this.prisma.siformenBup.groupBy({
        by: ['tahun'],
        where: { tahun: { in: BUP_YEARS } },
        _sum: { jumlahPensiun: true },
      }),
    ]);

    const totalAbk = Math.round(abkAgg._sum.kebutuhanPegawai ?? 0);
    const kekurangan = Math.max(0, totalAbk - totalAsnAktif);
    const bupPerTahun = BUP_YEARS.map((thn) => ({
      tahun: thn,
      jumlah: bupGroups.find((g) => g.tahun === thn)?._sum.jumlahPensiun ?? 0,
    }));
    const totalBup5Thn = bupPerTahun.reduce((s, b) => s + b.jumlah, 0);
    const totalKebutuhan = kekurangan + totalBup5Thn;

    return {
      stats: { totalBezetting: totalAsnAktif, totalAbk, kekurangan, totalBup5Thn, totalKebutuhan },
      bupPerTahun,
    };
  }

  async getProyeksiPerUnitKerja(tahunBezetting: number, filter: {
    q?: string;
    unitKerjaId?: string;
    jenisJabatan?: string;
  }) {
    const BUP_YEARS = [2024, 2025, 2026, 2027, 2028];

    const jabatanWhere: Prisma.SiformenJabatanWhereInput = { deletedAt: null, isActive: true };
    if (filter.q) jabatanWhere.namaJabatan = { contains: filter.q };
    if (filter.jenisJabatan) jabatanWhere.jenisJabatan = filter.jenisJabatan;
    if (filter.unitKerjaId) jabatanWhere.unitKerjaId = filter.unitKerjaId;

    const jabatanList = await this.prisma.siformenJabatan.findMany({
      where: jabatanWhere,
      include: { unitKerjaRef: { select: { id: true, nama: true, kode: true } } },
      orderBy: [{ unitKerja: 'asc' }, { sortOrder: 'asc' }, { namaJabatan: 'asc' }],
    });

    if (jabatanList.length === 0) return [];

    const jabatanIds = jabatanList.map((j) => j.id);

    const [bezettingGroups, abkRows] = await Promise.all([
      this.prisma.siformenBezetting.groupBy({
        by: ['jabatanId'],
        where: { jabatanId: { in: jabatanIds }, tahun: tahunBezetting, deletedAt: null, statusIsi: 'FILLED' },
        _count: { _all: true },
      }),
      this.prisma.siformenAbk.findMany({
        where: { jabatanId: { in: jabatanIds } },
        orderBy: { tahun: 'desc' },
        select: { jabatanId: true, kebutuhanPegawai: true },
      }),
    ]);

    const bezettingMap = new Map(bezettingGroups.map((r) => [r.jabatanId!, r._count._all]));
    const abkMap = new Map<string, number>();
    for (const abk of abkRows) {
      if (abk.jabatanId && !abkMap.has(abk.jabatanId)) {
        abkMap.set(abk.jabatanId, Math.round(abk.kebutuhanPegawai));
      }
    }

    // BUP per jabatan dari SiformenBup table
    const bupPerJabatan = await this.prisma.siformenBup.findMany({
      where: { jabatanId: { in: jabatanIds }, tahun: { in: BUP_YEARS } },
      select: { jabatanId: true, tahun: true, jumlahPensiun: true },
    });
    const bupMapByJabatan = new Map<string, Map<number, number>>();
    for (const b of bupPerJabatan) {
      if (!bupMapByJabatan.has(b.jabatanId)) bupMapByJabatan.set(b.jabatanId, new Map());
      bupMapByJabatan.get(b.jabatanId)!.set(b.tahun, b.jumlahPensiun);
    }

    type JabatanRow = {
      id: string; kodeJabatan: string; namaJabatan: string; jenisJabatan: string;
      eselonLevel: string | null; kelasJabatan: number | null; levelKesetaraan: number | null;
      statusPosisi: string; flagDelayering: boolean;
      bezetting: number; abk: number; gap: number;
      bupPerTahun: { tahun: number; jumlahPensiun: number }[];
    };

    const unitMap = new Map<string, {
      unitKerja: string; unitKerjaId: string | null; flagDelayering: boolean; tipe: string | null;
      subGrupA: JabatanRow[]; subGrupB: JabatanRow[]; subGrupC: JabatanRow[];
      bupPerTahun: { tahun: number; jumlah: number }[];
      totalBezetting: number; totalAbk: number; totalGap: number; totalBup5Thn: number;
    }>();

    for (const j of jabatanList) {
      const ukKey = j.unitKerjaId ?? j.unitKerja;
      if (!unitMap.has(ukKey)) {
        unitMap.set(ukKey, {
          unitKerja: j.unitKerjaRef?.nama ?? j.unitKerja,
          unitKerjaId: j.unitKerjaId,
          flagDelayering: (j.unitKerjaRef as any)?.flagDelayering ?? false,
          tipe: (j.unitKerjaRef as any)?.tipe ?? null,
          subGrupA: [], subGrupB: [], subGrupC: [],
          bupPerTahun: BUP_YEARS.map((thn) => ({ tahun: thn, jumlah: 0 })),
          totalBezetting: 0, totalAbk: 0, totalGap: 0, totalBup5Thn: 0,
        });
      }
      const bezetting = bezettingMap.get(j.id) ?? 0;
      const abk = abkMap.get(j.id) ?? 0;
      const gap = abk - bezetting; // bisa negatif
      const bupMap = bupMapByJabatan.get(j.id);
      const jabBup = BUP_YEARS.map((thn) => ({ tahun: thn, jumlahPensiun: bupMap?.get(thn) ?? 0 }));
      const totalJabBup = jabBup.reduce((s, b) => s + b.jumlahPensiun, 0);

      const row: JabatanRow = {
        id: j.id, kodeJabatan: j.kodeJabatan, namaJabatan: j.namaJabatan, jenisJabatan: j.jenisJabatan,
        eselonLevel: j.eselonLevel, kelasJabatan: j.kelasJabatan,
        levelKesetaraan: (j as any).levelKesetaraan ?? null,
        statusPosisi: (j as any).statusPosisi ?? 'aktif',
        flagDelayering: (j as any).flagDelayering ?? false,
        bezetting, abk, gap, bupPerTahun: jabBup,
      };

      const unit = unitMap.get(ukKey)!;
      // Sub-grup: A = struktural_jpt/STRUKTURAL, B = fungsional/FUNGSIONAL, C = pelaksana/PELAKSANA
      const jenis = j.jenisJabatan.toLowerCase();
      if (jenis.includes('jpt') || jenis === 'struktural_jpt') unit.subGrupA.push(row);
      else if (jenis.includes('fungsional')) unit.subGrupB.push(row);
      else unit.subGrupC.push(row);

      // Accumulate totals
      unit.totalBezetting += bezetting;
      unit.totalAbk += abk;
      unit.totalGap += gap;
      unit.totalBup5Thn += totalJabBup;
      for (const b of jabBup) {
        const found = unit.bupPerTahun.find((t) => t.tahun === b.tahun);
        if (found) found.jumlah += b.jumlahPensiun;
      }
    }

    return Array.from(unitMap.values());
  }

  async getBupList(query: { tahun?: string; unitKerjaId?: string; q?: string; page?: string; limit?: string }) {
    const page = parsePage(query.page);
    const limit = parseLimit(query.limit);
    const BUP_YEARS = [2024, 2025, 2026, 2027, 2028];

    const where: Prisma.AsnWhereInput = {
      deletedAt: null,
      isActive: true,
      tmtPensiun: query.tahun
        ? { gte: new Date(`${query.tahun}-01-01`), lte: new Date(`${query.tahun}-12-31`) }
        : { gte: new Date(`${BUP_YEARS[0]}-01-01`), lte: new Date(`${BUP_YEARS[BUP_YEARS.length - 1]}-12-31`) },
    };
    if (query.unitKerjaId) where.unitKerjaId = query.unitKerjaId;
    if (query.q) where.OR = [{ nama: { contains: query.q } }, { nip: { contains: query.q } }, { jabatanNama: { contains: query.q } }];

    const [items, total] = await Promise.all([
      this.prisma.asn.findMany({
        where,
        select: {
          id: true, nip: true, nama: true, jabatanNama: true, jenisJabatanNama: true,
          unorNama: true, unitKerjaId: true, tmtPensiun: true, golonganNama: true, tipePegawai: true,
          unitKerja: { select: { nama: true } },
        },
        orderBy: { tmtPensiun: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.asn.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async getRekapPegawai() {
    const baseWhere: Prisma.AsnWhereInput = { deletedAt: null, isActive: true };

    const [totalAktif, byTipePegawai, byJenisJabatan] = await Promise.all([
      this.prisma.asn.count({ where: baseWhere }),
      this.prisma.asn.groupBy({
        by: ['tipePegawai'],
        where: baseWhere,
        _count: { _all: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      this.prisma.asn.groupBy({
        by: ['jenisJabatanNama'],
        where: baseWhere,
        _count: { _all: true },
        orderBy: { _count: { id: 'desc' } },
      }),
    ]);

    return {
      totalAktif,
      byTipePegawai: byTipePegawai.map((r) => ({ tipe: r.tipePegawai ?? 'Tidak Diketahui', count: r._count._all })),
      byJenisJabatan: byJenisJabatan.map((r) => ({ jenis: r.jenisJabatanNama ?? 'Tidak Diketahui', count: r._count._all })),
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
