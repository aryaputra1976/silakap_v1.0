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
      rawData: true,
    },
  },
  golonganHistory: {
    where: { deletedAt: null },
    orderBy: [
      { effectiveDate: 'desc' },
      { syncedAt: 'desc' },
      { createdAt: 'desc' },
    ],
    take: 1,
    select: {
      golonganNama: true,
      golonganAkhirNama: true,
      siasnGolonganAkhirId: true,
      pangkatNama: true,
      ruangNama: true,
      mkTahun: true,
      mkBulan: true,
      tmtGolongan: true,
    },
  },
  pendidikanHistory: {
    where: { deletedAt: null },
    orderBy: [
      { effectiveDate: 'desc' },
      { syncedAt: 'desc' },
      { createdAt: 'desc' },
    ],
    take: 1,
    select: {
      pendidikanNama: true,
      tingkatPendidikanNama: true,
      tahunLulus: true,
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
  golonganAkhirNama: true,
  siasnGolonganAkhirId: true,
  pangkatNama: true,
  ruangNama: true,
  mkTahun: true,
  mkBulan: true,
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

type OrderedAsnIdRow = {
  id: string;
};

export type SidataAsnDocumentAuditAction =
  | 'SIDATA_ASN_DOCUMENT_UPLOAD'
  | 'SIDATA_ASN_DOCUMENT_DOWNLOAD'
  | 'SIDATA_ASN_DOCUMENT_DELETE';

export type CreateSidataAsnDocumentAuditLogParams = {
  action: SidataAsnDocumentAuditAction;
  userId: string | null;
  asnId: string;
  documentId: string;
  metadata?: Prisma.InputJsonValue;
};

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
    const where = await this.buildAsnWhere(filters);
    const skip = (filters.page - 1) * filters.limit;
    const orderedIds = await this.findOrderedAsnIds(filters, skip, filters.limit);

    const [unorderedItems, total] = await Promise.all([
      orderedIds.length > 0
        ? this.prisma.asn.findMany({
            where: { id: { in: orderedIds } },
            include: asnInclude,
          })
        : Promise.resolve([] as AsnRecord[]),
      this.prisma.asn.count({ where }),
    ]);
    const itemById = new Map(unorderedItems.map((item) => [item.id, item]));
    const items = orderedIds
      .map((id) => itemById.get(id))
      .filter((item): item is AsnRecord => Boolean(item));

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
    skip?: number;
    take: number;
  }): Promise<AsnRecord[]> {
    const orderedIds = await this.findOrderedAsnIds(params.filters, params.skip ?? 0, params.take);
    if (orderedIds.length === 0) return [];

    const rows = await this.prisma.asn.findMany({
      where: { id: { in: orderedIds } },
      include: asnInclude,
    });
    const rowById = new Map(rows.map((item) => [item.id, item]));
    return orderedIds
      .map((id) => rowById.get(id))
      .filter((item): item is AsnRecord => Boolean(item));
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

  async createAsnDocumentAuditLog(
    params: CreateSidataAsnDocumentAuditLogParams,
  ): Promise<void> {
    const metadata: Prisma.InputJsonObject = {
      asnId: params.asnId,
      documentId: params.documentId,
    };

    if (
      params.metadata
      && typeof params.metadata === 'object'
      && !Array.isArray(params.metadata)
    ) {
      Object.assign(metadata, params.metadata);
    }

    await this.prisma.auditLog.create({
      data: {
        performedBy: params.userId,
        action: params.action,
        entityType: 'SIDATA_ASN_DOCUMENT',
        entityId: params.documentId,
        afterData: metadata,
      },
    });
  }

  private async buildAsnWhere(filters: NormalizedAsnFilters): Promise<Prisma.AsnWhereInput> {
    const where: Prisma.AsnWhereInput = {
      deletedAt: null,
    };

    if (filters.unitKerjaId) {
      const unitIds = await this.findUnitKerjaDescendantIds(filters.unitKerjaId);
      where.unitKerjaId = { in: unitIds.length > 0 ? unitIds : [filters.unitKerjaId] };
    }

    if (filters.statusAsn) {
      where.statusAsn = filters.statusAsn;
    }

    if (filters.jenisAsn) {
      where.tipePegawai = filters.jenisAsn;
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

  private async findOrderedAsnIds(
    filters: NormalizedAsnFilters,
    skip: number,
    take: number,
  ): Promise<string[]> {
    const whereSql = await this.buildAsnWhereSql(filters);
    const rows = await this.prisma.$queryRaw<OrderedAsnIdRow[]>(Prisma.sql`
      SELECT sorted.id
      FROM (
        SELECT
          a.id,
          a.nama,
          a.nip,
          COALESCE(
            NULLIF(gh.siasn_golongan_akhir_id, ''),
            NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$.gol_akhir_id')), ''),
            NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$.golongan_akhir_id')), ''),
            NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$."Gol Akhir ID"')), ''),
            NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$."Golongan Akhir ID"')), ''),
            NULLIF(a.siasn_golongan_id, ''),
            NULLIF(rg.kode, ''),
            '0'
          ) AS golongan_akhir_code_sort,
          COALESCE(
            NULLIF(gh.golongan_akhir_nama, ''),
            NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$.gol_akhir_nama')), ''),
            NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$.golongan_akhir_nama')), ''),
            NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$."Gol Akhir Nama"')), ''),
            NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$."Golongan Akhir Nama"')), ''),
            NULLIF(gh.golongan_nama, ''),
            NULLIF(a.golongan_nama, ''),
            rg.nama,
            ''
          ) AS golongan_akhir_sort,
          COALESCE(
            NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$.eselon_id')), ''),
            NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$.eselon')), ''),
            NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$."eselon id"')), ''),
            NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$."Eselon ID"')), ''),
            ''
          ) AS eselon_sort,
          COALESCE(rj.kelas_jabatan, 0) AS kelas_jabatan_sort,
          a.jenis_jabatan_nama,
          COALESCE(a.jabatan_nama, rj.nama, '') AS jabatan_sort,
          COALESCE(gh.mk_tahun, 0) AS mk_tahun_sort,
          COALESCE(gh.mk_bulan, 0) AS mk_bulan_sort,
          COALESCE(sp.tmt_pns, sp.tmt_cpns, a.tmt_golongan, a.tmt_jabatan, a.created_at) AS tmt_masa_kerja_sort,
          COALESCE(edu.pendidikan_rank, 0) AS pendidikan_rank,
          COALESCE(sp.tanggal_lahir, '9999-12-31') AS tanggal_lahir_sort,
          COALESCE(NULLIF(rg.kode, ''), NULLIF(a.siasn_golongan_id, ''), '0') AS golongan_kode_sort
        FROM asn a
        LEFT JOIN ref_golongan rg ON rg.id = a.golongan_ref_id
        LEFT JOIN ref_jabatan rj ON rj.id = a.jabatan_ref_id
        LEFT JOIN asn_siasn_profile sp ON sp.asn_id = a.id AND sp.deleted_at IS NULL
        LEFT JOIN asn_golongan_history gh ON gh.id = (
          SELECT gh2.id
          FROM asn_golongan_history gh2
          WHERE gh2.asn_id = a.id AND gh2.deleted_at IS NULL
          ORDER BY gh2.effective_date DESC, gh2.synced_at DESC, gh2.created_at DESC
          LIMIT 1
        )
        LEFT JOIN (
          SELECT
            ph.asn_id,
            MAX(
              CASE
                WHEN UPPER(COALESCE(rpt.nama, ph.tingkat_pendidikan_nama, ph.pendidikan_nama, '')) REGEXP 'S[ -]?3|DOKTOR' THEN 9
                WHEN UPPER(COALESCE(rpt.nama, ph.tingkat_pendidikan_nama, ph.pendidikan_nama, '')) REGEXP 'S[ -]?2|MAGISTER' THEN 8
                WHEN UPPER(COALESCE(rpt.nama, ph.tingkat_pendidikan_nama, ph.pendidikan_nama, '')) REGEXP 'S[ -]?1|D[ -]?IV|DIPLOMA IV|SARJANA' THEN 7
                WHEN UPPER(COALESCE(rpt.nama, ph.tingkat_pendidikan_nama, ph.pendidikan_nama, '')) REGEXP 'D[ -]?III|DIPLOMA III' THEN 6
                WHEN UPPER(COALESCE(rpt.nama, ph.tingkat_pendidikan_nama, ph.pendidikan_nama, '')) REGEXP 'D[ -]?II|DIPLOMA II' THEN 5
                WHEN UPPER(COALESCE(rpt.nama, ph.tingkat_pendidikan_nama, ph.pendidikan_nama, '')) REGEXP 'D[ -]?I|DIPLOMA I' THEN 4
                WHEN UPPER(COALESCE(rpt.nama, ph.tingkat_pendidikan_nama, ph.pendidikan_nama, '')) REGEXP 'SMA|SMK|SLTA|MA' THEN 3
                WHEN UPPER(COALESCE(rpt.nama, ph.tingkat_pendidikan_nama, ph.pendidikan_nama, '')) REGEXP 'SMP|SLTP|MTS' THEN 2
                WHEN UPPER(COALESCE(rpt.nama, ph.tingkat_pendidikan_nama, ph.pendidikan_nama, '')) REGEXP 'SD|MI' THEN 1
                ELSE CAST(COALESCE(NULLIF(rpt.kode, ''), NULLIF(ph.siasn_tingkat_pendidikan_id, ''), '0') AS UNSIGNED)
              END
            ) AS pendidikan_rank
          FROM asn_pendidikan_history ph
          LEFT JOIN ref_pendidikan_tingkat rpt ON rpt.id = ph.tingkat_pendidikan_ref_id
          WHERE ph.deleted_at IS NULL
          GROUP BY ph.asn_id
        ) edu ON edu.asn_id = a.id
        WHERE ${whereSql}
      ) sorted
      ORDER BY
        CASE
          WHEN sorted.golongan_akhir_code_sort = '45' THEN 17
          WHEN sorted.golongan_akhir_code_sort = '44' THEN 16
          WHEN sorted.golongan_akhir_code_sort = '43' THEN 15
          WHEN sorted.golongan_akhir_code_sort = '42' THEN 14
          WHEN sorted.golongan_akhir_code_sort = '41' THEN 13
          WHEN sorted.golongan_akhir_code_sort = '34' THEN 12
          WHEN sorted.golongan_akhir_code_sort = '33' THEN 11
          WHEN sorted.golongan_akhir_code_sort = '32' THEN 10
          WHEN sorted.golongan_akhir_code_sort = '31' THEN 9
          WHEN sorted.golongan_akhir_code_sort = '24' THEN 8
          WHEN sorted.golongan_akhir_code_sort = '23' THEN 7
          WHEN sorted.golongan_akhir_code_sort = '22' THEN 6
          WHEN sorted.golongan_akhir_code_sort = '21' THEN 5
          WHEN sorted.golongan_akhir_code_sort = '14' THEN 4
          WHEN sorted.golongan_akhir_code_sort = '13' THEN 3
          WHEN sorted.golongan_akhir_code_sort = '12' THEN 2
          WHEN sorted.golongan_akhir_code_sort = '11' THEN 1
          WHEN UPPER(sorted.golongan_akhir_sort) LIKE '%IV/E%' THEN 17
          WHEN UPPER(sorted.golongan_akhir_sort) LIKE '%IV/D%' THEN 16
          WHEN UPPER(sorted.golongan_akhir_sort) LIKE '%IV/C%' THEN 15
          WHEN UPPER(sorted.golongan_akhir_sort) LIKE '%IV/B%' THEN 14
          WHEN UPPER(sorted.golongan_akhir_sort) LIKE '%IV/A%' THEN 13
          WHEN UPPER(sorted.golongan_akhir_sort) LIKE '%III/D%' THEN 12
          WHEN UPPER(sorted.golongan_akhir_sort) LIKE '%III/C%' THEN 11
          WHEN UPPER(sorted.golongan_akhir_sort) LIKE '%III/B%' THEN 10
          WHEN UPPER(sorted.golongan_akhir_sort) LIKE '%III/A%' THEN 9
          WHEN UPPER(sorted.golongan_akhir_sort) LIKE '%II/D%' THEN 8
          WHEN UPPER(sorted.golongan_akhir_sort) LIKE '%II/C%' THEN 7
          WHEN UPPER(sorted.golongan_akhir_sort) LIKE '%II/B%' THEN 6
          WHEN UPPER(sorted.golongan_akhir_sort) LIKE '%II/A%' THEN 5
          WHEN UPPER(sorted.golongan_akhir_sort) LIKE '%I/D%' THEN 4
          WHEN UPPER(sorted.golongan_akhir_sort) LIKE '%I/C%' THEN 3
          WHEN UPPER(sorted.golongan_akhir_sort) LIKE '%I/B%' THEN 2
          WHEN UPPER(sorted.golongan_akhir_sort) LIKE '%I/A%' THEN 1
          ELSE CAST(sorted.golongan_kode_sort AS UNSIGNED)
        END DESC,
        CASE
          WHEN sorted.eselon_sort = '21' THEN 1
          WHEN sorted.eselon_sort = '22' THEN 2
          WHEN sorted.eselon_sort = '31' THEN 3
          WHEN sorted.eselon_sort = '32' THEN 4
          WHEN sorted.eselon_sort = '33' THEN 5
          WHEN sorted.eselon_sort = '41' THEN 6
          WHEN sorted.eselon_sort = '42' THEN 7
          WHEN UPPER(sorted.jabatan_sort) LIKE 'SEKRETARIS DAERAH%' THEN 1
          WHEN UPPER(sorted.jabatan_sort) LIKE 'KEPALA BADAN%' THEN 2
          WHEN UPPER(sorted.jabatan_sort) LIKE 'INSPEKTUR%' THEN 2
          WHEN UPPER(sorted.jabatan_sort) LIKE 'SEKRETARIS DPRD%' THEN 2
          WHEN UPPER(sorted.jabatan_sort) LIKE 'ASISTEN %' THEN 3
          WHEN UPPER(sorted.jabatan_sort) LIKE 'STAF AHLI%' THEN 3
          WHEN UPPER(sorted.jabatan_sort) LIKE 'SEKRETARIS BADAN%' THEN 3
          WHEN UPPER(sorted.jabatan_sort) LIKE 'SEKRETARIS DINAS%' THEN 3
          WHEN UPPER(sorted.jabatan_sort) LIKE 'KEPALA BAGIAN%' THEN 4
          WHEN UPPER(sorted.jabatan_sort) LIKE 'KEPALA BIDANG%' THEN 4
          WHEN UPPER(sorted.jabatan_sort) LIKE 'CAMAT%' THEN 4
          WHEN UPPER(sorted.jabatan_sort) LIKE 'INSPEKTUR PEMBANTU%' THEN 4
          WHEN UPPER(sorted.jabatan_sort) LIKE 'KEPALA SUB BAGIAN%' THEN 6
          WHEN UPPER(sorted.jabatan_sort) LIKE 'KEPALA SUBBAGIAN%' THEN 6
          WHEN UPPER(sorted.jabatan_sort) LIKE 'KEPALA SUB BIDANG%' THEN 6
          WHEN UPPER(sorted.jabatan_sort) LIKE 'KEPALA SUBBIDANG%' THEN 6
          WHEN UPPER(sorted.jabatan_sort) LIKE 'KEPALA SEKSI%' THEN 6
          WHEN UPPER(sorted.jabatan_sort) LIKE 'LURAH%' THEN 6
          ELSE 99
        END ASC,
        sorted.kelas_jabatan_sort DESC,
        CASE
          WHEN UPPER(COALESCE(sorted.jenis_jabatan_nama, '')) LIKE '%STRUKTURAL%' THEN 1
          WHEN UPPER(COALESCE(sorted.jenis_jabatan_nama, '')) LIKE '%FUNGSIONAL%' THEN 2
          WHEN UPPER(COALESCE(sorted.jenis_jabatan_nama, '')) LIKE '%PELAKSANA%' THEN 3
          ELSE 4
        END ASC,
        sorted.jabatan_sort ASC,
        sorted.mk_tahun_sort DESC,
        sorted.mk_bulan_sort DESC,
        sorted.tmt_masa_kerja_sort ASC,
        sorted.pendidikan_rank DESC,
        sorted.tanggal_lahir_sort ASC,
        sorted.nama ASC,
        sorted.nip ASC,
        sorted.id ASC
      LIMIT ${take}
      OFFSET ${skip}
    `);

    return rows.map((row) => row.id);
  }

  private async buildAsnWhereSql(filters: NormalizedAsnFilters): Promise<Prisma.Sql> {
    const clauses: Prisma.Sql[] = [Prisma.sql`a.deleted_at IS NULL`];

    if (filters.unitKerjaId) {
      const unitIds = await this.findUnitKerjaDescendantIds(filters.unitKerjaId);
      clauses.push(Prisma.sql`a.unit_kerja_id IN (${Prisma.join(unitIds.length > 0 ? unitIds : [filters.unitKerjaId])})`);
    }

    if (filters.statusAsn) {
      clauses.push(Prisma.sql`a.status_asn = ${filters.statusAsn}`);
    }

    if (filters.jenisAsn) {
      clauses.push(Prisma.sql`a.tipe_pegawai = ${filters.jenisAsn}`);
    }

    if (filters.q) {
      const like = `%${filters.q}%`;
      clauses.push(Prisma.sql`(
        a.nip LIKE ${like}
        OR a.nik LIKE ${like}
        OR a.nama LIKE ${like}
        OR a.jabatan_nama LIKE ${like}
        OR sp.email LIKE ${like}
        OR sp.phone LIKE ${like}
      )`);
    }

    return Prisma.join(clauses, ' AND ');
  }

  private async findUnitKerjaDescendantIds(rootId: string): Promise<string[]> {
    const units = await this.prisma.unitKerja.findMany({
      where: { deletedAt: null, isActive: true },
      select: { id: true, parentId: true },
    });
    const childrenByParent = new Map<string, string[]>();
    for (const unit of units) {
      if (!unit.parentId) continue;
      const children = childrenByParent.get(unit.parentId) ?? [];
      children.push(unit.id);
      childrenByParent.set(unit.parentId, children);
    }

    const result: string[] = [];
    const queue = [rootId];
    const seen = new Set<string>();
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (seen.has(id)) continue;
      seen.add(id);
      result.push(id);
      queue.push(...(childrenByParent.get(id) ?? []));
    }
    return result;
  }
}
