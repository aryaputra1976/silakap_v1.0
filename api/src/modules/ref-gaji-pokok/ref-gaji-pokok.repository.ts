import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  GajiPokokLookupResult,
  GajiPokokMatrixItem,
  GajiPokokRow,
  ImportGajiPokokPayload,
  GOLONGAN_ORDER,
} from './ref-gaji-pokok.types';

@Injectable()
export class RefGajiPokokRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  // ─── Active periode ───────────────────────────────────────────────────────

  async getActivePeriode(): Promise<Date | null> {
    const row = await this.prisma.refGajiPokok.findFirst({
      where: { berlakuSejak: { lte: new Date() } },
      orderBy: { berlakuSejak: 'desc' },
      select: { berlakuSejak: true },
    });
    return row?.berlakuSejak ?? null;
  }

  async listPeriodes(): Promise<string[]> {
    const rows = await this.prisma.refGajiPokok.findMany({
      distinct: ['berlakuSejak'],
      orderBy: { berlakuSejak: 'desc' },
      select: { berlakuSejak: true },
    });
    return rows.map(r => r.berlakuSejak.toISOString().slice(0, 10));
  }

  private async resolvePeriode(berlakuSejak?: string | null): Promise<Date | null> {
    if (berlakuSejak) return new Date(berlakuSejak);
    return this.getActivePeriode();
  }

  // ─── List / filter ────────────────────────────────────────────────────────

  async listAll(golonganKode?: string, berlakuSejak?: string): Promise<GajiPokokRow[]> {
    const periode = await this.resolvePeriode(berlakuSejak);
    if (!periode) return [];

    const rows = await this.prisma.refGajiPokok.findMany({
      where: { berlakuSejak: periode, ...(golonganKode ? { golonganKode } : {}) },
      orderBy: [{ golonganKode: 'asc' }, { masaKerja: 'asc' }],
    });

    return rows.map(r => ({
      id: r.id,
      golonganKode: r.golonganKode,
      masaKerja: r.masaKerja,
      gajiPokok: r.gajiPokok.toString(),
      berlakuSejak: r.berlakuSejak.toISOString().slice(0, 10),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  // ─── Matrix (grouped by golongan) ─────────────────────────────────────────

  async getMatrix(berlakuSejak?: string): Promise<GajiPokokMatrixItem[]> {
    const periode = await this.resolvePeriode(berlakuSejak);
    if (!periode) return [];

    const rows = await this.prisma.refGajiPokok.findMany({
      where: { berlakuSejak: periode },
      orderBy: [{ golonganKode: 'asc' }, { masaKerja: 'asc' }],
    });

    const grouped = new Map<string, Array<{ id: number; masaKerja: number; gajiPokok: string }>>();
    for (const r of rows) {
      if (!grouped.has(r.golonganKode)) grouped.set(r.golonganKode, []);
      grouped.get(r.golonganKode)!.push({ id: r.id, masaKerja: r.masaKerja, gajiPokok: r.gajiPokok.toString() });
    }

    const periodeStr = periode.toISOString().slice(0, 10);
    return [...grouped.entries()]
      .map(([kode, items]) => ({
        golonganKode: kode,
        urutan: GOLONGAN_ORDER[kode] ?? 99,
        berlakuSejak: periodeStr,
        rows: items,
      }))
      .sort((a, b) => a.urutan - b.urutan);
  }

  // ─── Lookup single value ──────────────────────────────────────────────────

  async lookup(golonganKode: string, masaKerja: number, berlakuSejak?: string): Promise<GajiPokokLookupResult | null> {
    const periode = await this.resolvePeriode(berlakuSejak);
    if (!periode) return null;

    const row = await this.prisma.refGajiPokok.findUnique({
      where: { golonganKode_masaKerja_berlakuSejak: { golonganKode, masaKerja, berlakuSejak: periode } },
    });
    if (!row) return null;
    return {
      golonganKode: row.golonganKode,
      masaKerja: row.masaKerja,
      gajiPokok: row.gajiPokok.toString(),
      berlakuSejak: row.berlakuSejak.toISOString().slice(0, 10),
    };
  }

  // ─── Update single record by id (only gajiPokok) ─────────────────────────

  async updateById(id: number, gajiPokok: number): Promise<GajiPokokRow> {
    const row = await this.prisma.refGajiPokok.update({
      where: { id },
      data: { gajiPokok: new Prisma.Decimal(gajiPokok) },
    });
    return {
      id: row.id,
      golonganKode: row.golonganKode,
      masaKerja: row.masaKerja,
      gajiPokok: row.gajiPokok.toString(),
      berlakuSejak: row.berlakuSejak.toISOString().slice(0, 10),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  // ─── Bulk create / upsert for a new period ────────────────────────────────

  async bulkCreateForPeriode(records: ImportGajiPokokPayload[], berlakuSejak: Date): Promise<{ count: number }> {
    let count = 0;
    for (let i = 0; i < records.length; i += 100) {
      const chunk = records.slice(i, i + 100);
      await this.prisma.$transaction(
        chunk.map(r =>
          this.prisma.refGajiPokok.upsert({
            where: {
              golonganKode_masaKerja_berlakuSejak: {
                golonganKode: r.golonganKode,
                masaKerja: r.masaKerja,
                berlakuSejak,
              },
            },
            create: {
              golonganKode: r.golonganKode,
              masaKerja: r.masaKerja,
              gajiPokok: new Prisma.Decimal(r.gajiPokok),
              berlakuSejak,
            },
            update: {
              gajiPokok: new Prisma.Decimal(r.gajiPokok),
            },
          }),
        ),
      );
      count += chunk.length;
    }
    return { count };
  }

  // ─── Find by id ───────────────────────────────────────────────────────────

  async findById(id: number) {
    return this.prisma.refGajiPokok.findUnique({ where: { id } });
  }

  // ─── Summary stats ────────────────────────────────────────────────────────

  async getSummary() {
    const [total, golonganCount, periodes] = await Promise.all([
      this.prisma.refGajiPokok.count(),
      this.prisma.refGajiPokok.groupBy({ by: ['golonganKode'] }),
      this.listPeriodes(),
    ]);
    return { totalRecords: total, totalGolongan: golonganCount.length, totalPeriodes: periodes.length };
  }
}
