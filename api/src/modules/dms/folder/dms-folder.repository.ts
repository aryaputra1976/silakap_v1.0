import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface DmsFolderAggregateRow {
  unit_kerja_id: string | null;
  unit_kerja_kode: string | null;
  unit_kerja_nama: string | null;
  year: number | null;
  category: string;
  doc_count: bigint;
}

export interface DmsFolderWhereInput {
  unitKerjaIds?: string[];
  onlyOwnedBy?: string;
}

@Injectable()
export class DmsFolderRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async aggregateFolders(where: DmsFolderWhereInput): Promise<DmsFolderAggregateRow[]> {
    const clauses: Prisma.Sql[] = [Prisma.sql`d.deleted_at IS NULL`];

    if (where.unitKerjaIds && where.unitKerjaIds.length > 0) {
      clauses.push(
        Prisma.sql`d.unit_kerja_id IN (${Prisma.join(where.unitKerjaIds)})`,
      );
    }

    if (where.onlyOwnedBy) {
      clauses.push(Prisma.sql`d.created_by_id = ${where.onlyOwnedBy}`);
    }

    const whereSql = Prisma.join(clauses, ' AND ');

    return this.prisma.$queryRaw<DmsFolderAggregateRow[]>(Prisma.sql`
      SELECT
        uk.id   AS unit_kerja_id,
        uk.kode AS unit_kerja_kode,
        uk.nama AS unit_kerja_nama,
        d.period_year AS year,
        d.category,
        COUNT(*) AS doc_count
      FROM dms_documents d
      LEFT JOIN unit_kerja uk ON uk.id = d.unit_kerja_id
      WHERE ${whereSql}
      GROUP BY uk.id, uk.kode, uk.nama, d.period_year, d.category
      ORDER BY uk.nama ASC, d.period_year DESC, d.category ASC
    `);
  }
}
