import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  NormalizedAsnFilters,
  RekapAsnResponse,
  RekapFungsionalRow,
  RekapGolonganRow,
  RekapIkhtisarResponse,
  RekapJabatanAsnRow,
  RekapJenjangRow,
  RekapJKRow,
  RekapPendidikanRow,
  RekapPnsResponse,
  RekapPppkResponse,
  RekapStrukturalEselonRow,
  RekapStrukturalJabatanRow,
  RekapStrukturalPendidikanRow,
  UnitTreeNode,
} from './sidata.types';

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
  jabatanRef: {
    select: {
      bup: true,
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

const asnListSelect = {
  id: true,
  nip: true,
  nik: true,
  nama: true,
  unitKerjaId: true,
  jabatanNama: true,
  golonganNama: true,
  jenisJabatanNama: true,
  tmtJabatan: true,
  tmtGolongan: true,
  tmtPensiun: true,
  masaKerjaTahun: true,
  masaKerjaBulan: true,
  masaKerjaTotalBulan: true,
  kelasJabatan: true,
  siasnEselonId: true,
  siasnGolonganId: true,
  eselonNama: true,
  jenisPegawaiNama: true,
  jenisAsnNama: true,
  tipePegawai: true,
  detailStatusNama: true,
  pendidikanNama: true,
  pendidikanRefId: true,
  tingkatPendidikanRefId: true,
  tingkatPendidikanNama: true,
  tahunLulus: true,
  namaSekolah: true,
  statusAsn: true,
  syncStatus: true,
  lastSiasnBatchId: true,
  lastSiasnSyncedAt: true,
  localCorrectionAt: true,
  localCorrectionBy: true,
  localCorrectionReason: true,
  needsReview: true,
  reviewNote: true,
  sourceBatchId: true,
  syncedAt: true,
  unitKerja: {
    select: {
      id: true,
      kode: true,
      nama: true,
    },
  },
  jabatanRef: {
    select: {
      bup: true,
    },
  },
  siasnProfile: {
    select: {
      email: true,
      phone: true,
      tanggalLahir: true,
      tmtPns: true,
      tmtPensiun: true,
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
      mkTahun: true,
      mkBulan: true,
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
} satisfies Prisma.AsnSelect;

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

const asnChangeLogSelect = {
  id: true,
  asnId: true,
  fieldName: true,
  oldValue: true,
  newValue: true,
  changedBy: true,
  changedAt: true,
  reason: true,
  evidenceDocumentId: true,
  source: true,
  sourceBatchId: true,
  metadata: true,
} satisfies Prisma.AsnChangeLogSelect;

export type UnitKerjaRecord = Prisma.UnitKerjaGetPayload<{
  select: typeof unitSelect;
}>;

export type AsnRecord = Prisma.AsnGetPayload<{
  include: typeof asnInclude;
}>;

export type AsnListRecord = Prisma.AsnGetPayload<{
  select: typeof asnListSelect;
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

export type AsnChangeLogRecord = Prisma.AsnChangeLogGetPayload<{
  select: typeof asnChangeLogSelect;
}>;

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

type RawCountValue = number | bigint | null;

type AsnQualityAggregateSqlRow = {
  totalAsn: RawCountValue;
  activeAsn: RawCountValue;
  inactiveAsn: RawCountValue;
  pnsRows: RawCountValue;
  pppkRows: RawCountValue;
  pppkParuhWaktuRows: RawCountValue;
  withoutUnitKerjaRows: RawCountValue;
  withoutJabatanRows: RawCountValue;
  withoutGolonganRows: RawCountValue;
  withoutNikRows: RawCountValue;
  withoutTanggalLahirRows: RawCountValue;
  withoutTmtPensiunRows: RawCountValue;
  withoutSiasnProfileRows: RawCountValue;
  bupNext12MonthsRows: RawCountValue;
  bupOverdueActiveRows: RawCountValue;
  completeCoreRows: RawCountValue;
  syncedRows: RawCountValue;
  localCorrectionRows: RawCountValue;
  needReviewRows: RawCountValue;
  pendingSiasnUpdateRows: RawCountValue;
  conflictRows: RawCountValue;
};

type AsnQualityBreakdownSqlRow = {
  label: string | null;
  total: RawCountValue;
};

export type SidataAsnQualityAggregateRecord = {
  totalAsn: number;
  activeAsn: number;
  inactiveAsn: number;
  pnsRows: number;
  pppkRows: number;
  pppkParuhWaktuRows: number;
  withoutUnitKerjaRows: number;
  withoutJabatanRows: number;
  withoutGolonganRows: number;
  withoutNikRows: number;
  withoutTanggalLahirRows: number;
  withoutTmtPensiunRows: number;
  withoutSiasnProfileRows: number;
  bupNext12MonthsRows: number;
  bupOverdueActiveRows: number;
  completeCoreRows: number;
  syncedRows: number;
  localCorrectionRows: number;
  needReviewRows: number;
  pendingSiasnUpdateRows: number;
  conflictRows: number;
};

export type SidataAsnQualityBreakdownRecord = {
  label: string;
  total: number;
};

type RekapJabatanAsnSqlRow = {
  id: string;
  nip: string;
  nama: string;
  golonganNama: string | null;
  tmtGolongan: Date | null;
  jabatanNama: string | null;
  tmtJabatan: Date | null;
  opdNama: string | null;
  unitKerjaNama: string | null;
  jenisAsn: string | null;
};

export type SidataAsnQualityDashboardRecord = {
  aggregate: SidataAsnQualityAggregateRecord;
  byStatusAsn: SidataAsnQualityBreakdownRecord[];
  byJenisAsn: SidataAsnQualityBreakdownRecord[];
  bySyncStatus: SidataAsnQualityBreakdownRecord[];
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
    items: AsnListRecord[];
    total: number;
  }> {
    const where = await this.buildAsnWhere(filters);
    const skip = (filters.page - 1) * filters.limit;
    const orderedIds = await this.findOrderedAsnIds(filters, skip, filters.limit, where);

    const [unorderedItems, total] = await Promise.all([
      orderedIds.length > 0
        ? this.prisma.asn.findMany({
            where: { id: { in: orderedIds } },
            select: asnListSelect,
          })
        : Promise.resolve([] as AsnListRecord[]),
      this.prisma.asn.count({ where }),
    ]);
    const itemById = new Map(unorderedItems.map((item) => [item.id, item]));
    const items = orderedIds
      .map((id) => itemById.get(id))
      .filter((item): item is AsnListRecord => Boolean(item));

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

  async createAsnChangeLogs(
    logs: Prisma.AsnChangeLogCreateManyInput[],
  ): Promise<{ count: number }> {
    if (logs.length === 0) {
      return { count: 0 };
    }

    return this.prisma.asnChangeLog.createMany({ data: logs });
  }

  async findAsnChangeLogs(asnId: string): Promise<AsnChangeLogRecord[]> {
    return this.prisma.asnChangeLog.findMany({
      where: { asnId },
      orderBy: { changedAt: 'desc' },
      take: 100,
      select: asnChangeLogSelect,
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

  async getAsnQualityDashboard(params: {
    unitKerjaId?: string;
    today: Date;
    bupUntil: Date;
  }): Promise<SidataAsnQualityDashboardRecord> {
    const whereSql = await this.buildAsnQualityWhereSql(params.unitKerjaId);
    const inferredBupSql = Prisma.sql`
      COALESCE(
        rj.bup,
        CASE
          WHEN UPPER(COALESCE(a.jabatan_nama, rj.nama, '')) LIKE '%GURU%' THEN 60
          WHEN UPPER(COALESCE(a.jabatan_nama, rj.nama, '')) LIKE '%AHLI UTAMA%' THEN 65
          WHEN UPPER(COALESCE(a.jabatan_nama, rj.nama, '')) LIKE '%AHLI MADYA%' THEN 60
          WHEN COALESCE(a.jabatan_nama, rj.nama, '') <> '' THEN 58
          ELSE NULL
        END
      )
    `;
    const effectiveTmtPensiunSql = Prisma.sql`
      COALESCE(
        a.tmt_pensiun,
        sp.tmt_pensiun,
        CASE
          WHEN sp.tanggal_lahir IS NOT NULL AND ${inferredBupSql} IS NOT NULL
            THEN DATE_ADD(
              MAKEDATE(YEAR(sp.tanggal_lahir) + ${inferredBupSql}, 1),
              INTERVAL MONTH(sp.tanggal_lahir) MONTH
            )
          ELSE NULL
        END
      )
    `;

    const aggregateRows = await this.prisma.$queryRaw<AsnQualityAggregateSqlRow[]>(Prisma.sql`
      SELECT
        COUNT(*) AS totalAsn,

        SUM(CASE WHEN a.is_active = 1 THEN 1 ELSE 0 END) AS activeAsn,
        SUM(CASE WHEN a.is_active = 0 THEN 1 ELSE 0 END) AS inactiveAsn,

        SUM(CASE WHEN a.tipe_pegawai = 'PNS' THEN 1 ELSE 0 END) AS pnsRows,
        SUM(CASE WHEN a.tipe_pegawai = 'PPPK' THEN 1 ELSE 0 END) AS pppkRows,
        SUM(CASE WHEN a.tipe_pegawai = 'PPPK_PARUH_WAKTU' THEN 1 ELSE 0 END) AS pppkParuhWaktuRows,

        SUM(CASE
          WHEN a.unit_kerja_id IS NULL OR a.unit_kerja_id = '' THEN 1
          ELSE 0
        END) AS withoutUnitKerjaRows,

        SUM(CASE
          WHEN (a.jabatan_ref_id IS NULL OR a.jabatan_ref_id = '')
           AND (a.jabatan_nama IS NULL OR a.jabatan_nama = '') THEN 1
          ELSE 0
        END) AS withoutJabatanRows,

        SUM(CASE
          WHEN COALESCE(a.tipe_pegawai, '') <> 'PPPK_PARUH_WAKTU'
           AND (a.golongan_ref_id IS NULL OR a.golongan_ref_id = '')
           AND (a.golongan_nama IS NULL OR a.golongan_nama = '') THEN 1
          ELSE 0
        END) AS withoutGolonganRows,

        SUM(CASE
          WHEN a.nik IS NULL OR a.nik = '' THEN 1
          ELSE 0
        END) AS withoutNikRows,

        SUM(CASE
          WHEN sp.id IS NULL OR sp.tanggal_lahir IS NULL THEN 1
          ELSE 0
        END) AS withoutTanggalLahirRows,

        SUM(CASE
          WHEN ${effectiveTmtPensiunSql} IS NULL THEN 1
          ELSE 0
        END) AS withoutTmtPensiunRows,

        SUM(CASE
          WHEN sp.id IS NULL THEN 1
          ELSE 0
        END) AS withoutSiasnProfileRows,

        SUM(CASE
          WHEN a.is_active = 1
           AND ${effectiveTmtPensiunSql} >= ${params.today}
           AND ${effectiveTmtPensiunSql} <= ${params.bupUntil} THEN 1
          ELSE 0
        END) AS bupNext12MonthsRows,

        SUM(CASE
          WHEN a.is_active = 1
           AND ${effectiveTmtPensiunSql} < ${params.today} THEN 1
          ELSE 0
        END) AS bupOverdueActiveRows,

        SUM(CASE
          WHEN a.unit_kerja_id IS NOT NULL AND a.unit_kerja_id <> ''
           AND (
             (a.jabatan_ref_id IS NOT NULL AND a.jabatan_ref_id <> '')
             OR (a.jabatan_nama IS NOT NULL AND a.jabatan_nama <> '')
           )
           AND (
             COALESCE(a.tipe_pegawai, '') = 'PPPK_PARUH_WAKTU'
             OR
             (a.golongan_ref_id IS NOT NULL AND a.golongan_ref_id <> '')
             OR (a.golongan_nama IS NOT NULL AND a.golongan_nama <> '')
           )
           AND a.nik IS NOT NULL AND a.nik <> ''
           AND ${effectiveTmtPensiunSql} IS NOT NULL
           AND sp.id IS NOT NULL
           AND sp.tanggal_lahir IS NOT NULL THEN 1
          ELSE 0
        END) AS completeCoreRows,

        SUM(CASE WHEN a.sync_status = 'SYNCED' THEN 1 ELSE 0 END) AS syncedRows,
        SUM(CASE WHEN a.sync_status = 'LOCAL_CORRECTION' THEN 1 ELSE 0 END) AS localCorrectionRows,
        SUM(CASE WHEN a.sync_status = 'NEED_REVIEW' THEN 1 ELSE 0 END) AS needReviewRows,
        SUM(CASE WHEN a.sync_status = 'PENDING_SIASN_UPDATE' THEN 1 ELSE 0 END) AS pendingSiasnUpdateRows,
        SUM(CASE WHEN a.sync_status = 'CONFLICT' THEN 1 ELSE 0 END) AS conflictRows

      FROM asn a
      LEFT JOIN asn_siasn_profile sp
        ON sp.asn_id = a.id
       AND sp.deleted_at IS NULL
      LEFT JOIN ref_jabatan rj
        ON rj.id = a.jabatan_ref_id
       AND rj.deleted_at IS NULL
      WHERE ${whereSql}
    `);

    const statusRows = await this.prisma.$queryRaw<AsnQualityBreakdownSqlRow[]>(Prisma.sql`
      SELECT
        COALESCE(NULLIF(a.status_asn, ''), 'TIDAK_DIISI') AS label,
        COUNT(*) AS total
      FROM asn a
      LEFT JOIN asn_siasn_profile sp
        ON sp.asn_id = a.id
       AND sp.deleted_at IS NULL
      WHERE ${whereSql}
      GROUP BY COALESCE(NULLIF(a.status_asn, ''), 'TIDAK_DIISI')
      ORDER BY total DESC, label ASC
    `);

    const jenisRows = await this.prisma.$queryRaw<AsnQualityBreakdownSqlRow[]>(Prisma.sql`
      SELECT
        COALESCE(NULLIF(a.tipe_pegawai, ''), 'TIDAK_DIISI') AS label,
        COUNT(*) AS total
      FROM asn a
      LEFT JOIN asn_siasn_profile sp
        ON sp.asn_id = a.id
       AND sp.deleted_at IS NULL
      WHERE ${whereSql}
      GROUP BY COALESCE(NULLIF(a.tipe_pegawai, ''), 'TIDAK_DIISI')
      ORDER BY total DESC, label ASC
    `);

    const syncRows = await this.prisma.$queryRaw<AsnQualityBreakdownSqlRow[]>(Prisma.sql`
      SELECT
        COALESCE(NULLIF(a.sync_status, ''), 'NEED_REVIEW') AS label,
        COUNT(*) AS total
      FROM asn a
      LEFT JOIN asn_siasn_profile sp
        ON sp.asn_id = a.id
       AND sp.deleted_at IS NULL
      WHERE ${whereSql}
      GROUP BY COALESCE(NULLIF(a.sync_status, ''), 'NEED_REVIEW')
      ORDER BY total DESC, label ASC
    `);

    const aggregate = aggregateRows[0];

    return {
      aggregate: this.toAsnQualityAggregateRecord(aggregate),
      byStatusAsn: statusRows.map((row) => ({
        label: row.label ?? 'TIDAK_DIISI',
        total: this.toRawCountNumber(row.total),
      })),
      byJenisAsn: jenisRows.map((row) => ({
        label: row.label ?? 'TIDAK_DIISI',
        total: this.toRawCountNumber(row.total),
      })),
      bySyncStatus: syncRows.map((row) => ({
        label: row.label ?? 'NEED_REVIEW',
        total: this.toRawCountNumber(row.total),
      })),
    };
  }

  private async buildAsnQualityWhereSql(unitKerjaId?: string): Promise<Prisma.Sql> {
    const clauses: Prisma.Sql[] = [Prisma.sql`a.deleted_at IS NULL`];

    if (unitKerjaId) {
      const unitIds = await this.findUnitKerjaDescendantIds(unitKerjaId);
      clauses.push(
        Prisma.sql`a.unit_kerja_id IN (${Prisma.join(
          unitIds.length > 0 ? unitIds : [unitKerjaId],
        )})`,
      );
    }

    return Prisma.join(clauses, ' AND ');
  }

  private toAsnQualityAggregateRecord(
    row: AsnQualityAggregateSqlRow | undefined,
  ): SidataAsnQualityAggregateRecord {
    return {
      totalAsn: this.toRawCountNumber(row?.totalAsn),
      activeAsn: this.toRawCountNumber(row?.activeAsn),
      inactiveAsn: this.toRawCountNumber(row?.inactiveAsn),
      pnsRows: this.toRawCountNumber(row?.pnsRows),
      pppkRows: this.toRawCountNumber(row?.pppkRows),
      pppkParuhWaktuRows: this.toRawCountNumber(row?.pppkParuhWaktuRows),
      withoutUnitKerjaRows: this.toRawCountNumber(row?.withoutUnitKerjaRows),
      withoutJabatanRows: this.toRawCountNumber(row?.withoutJabatanRows),
      withoutGolonganRows: this.toRawCountNumber(row?.withoutGolonganRows),
      withoutNikRows: this.toRawCountNumber(row?.withoutNikRows),
      withoutTanggalLahirRows: this.toRawCountNumber(row?.withoutTanggalLahirRows),
      withoutTmtPensiunRows: this.toRawCountNumber(row?.withoutTmtPensiunRows),
      withoutSiasnProfileRows: this.toRawCountNumber(row?.withoutSiasnProfileRows),
      bupNext12MonthsRows: this.toRawCountNumber(row?.bupNext12MonthsRows),
      bupOverdueActiveRows: this.toRawCountNumber(row?.bupOverdueActiveRows),
      completeCoreRows: this.toRawCountNumber(row?.completeCoreRows),
      syncedRows: this.toRawCountNumber(row?.syncedRows),
      localCorrectionRows: this.toRawCountNumber(row?.localCorrectionRows),
      needReviewRows: this.toRawCountNumber(row?.needReviewRows),
      pendingSiasnUpdateRows: this.toRawCountNumber(row?.pendingSiasnUpdateRows),
      conflictRows: this.toRawCountNumber(row?.conflictRows),
    };
  }

  private toRawCountNumber(value: RawCountValue | undefined): number {
    if (typeof value === 'bigint') return Number(value);
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    return 0;
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

    if (filters.syncStatus) {
      where.syncStatus = filters.syncStatus;
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
    whereInput?: Prisma.AsnWhereInput,
  ): Promise<string[]> {
    const rows = await this.prisma.asn.findMany({
      where: whereInput ?? await this.buildAsnWhere(filters),
      select: { id: true },
      orderBy: [
        { tipePegawai: 'asc' },
        { nama: 'asc' },
        { nip: 'asc' },
        { id: 'asc' },
      ],
      skip,
      take,
    });

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

    if (filters.syncStatus) {
      clauses.push(Prisma.sql`a.sync_status = ${filters.syncStatus}`);
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

  async findRekapAsnByJabatanName(params: {
    jabatanNama: string;
    unitKerjaId?: string;
  }): Promise<RekapJabatanAsnRow[]> {
    const whereSql = await this.buildRekapWhereSql(params.unitKerjaId);
    const rows = await this.prisma.$queryRaw<RekapJabatanAsnSqlRow[]>(Prisma.sql`
      SELECT
        a.id,
        a.nip,
        a.nama,
        a.golongan_nama AS golonganNama,
        a.tmt_golongan AS tmtGolongan,
        COALESCE(NULLIF(a.jabatan_nama, ''), rj.nama) AS jabatanNama,
        a.tmt_jabatan AS tmtJabatan,
        COALESCE(
          CASE WHEN uk.level = 1 THEN NULLIF(uk.nama, '') END,
          CASE WHEN uk1.level = 1 THEN NULLIF(uk1.nama, '') END,
          CASE WHEN uk2.level = 1 THEN NULLIF(uk2.nama, '') END,
          CASE WHEN uk3.level = 1 THEN NULLIF(uk3.nama, '') END,
          CASE WHEN uk4.level = 1 THEN NULLIF(uk4.nama, '') END,
          NULLIF(uk2.nama, ''),
          NULLIF(uk1.nama, ''),
          NULLIF(uk.nama, '')
        ) AS opdNama,
        uk.nama AS unitKerjaNama,
        COALESCE(NULLIF(a.tipe_pegawai, ''), NULLIF(a.jenis_pegawai_nama, ''), NULLIF(a.jenis_asn_nama, '')) AS jenisAsn
      FROM asn a
      LEFT JOIN ref_jabatan rj ON rj.id = a.jabatan_ref_id
      LEFT JOIN unit_kerja uk ON uk.id = a.unit_kerja_id
      LEFT JOIN unit_kerja uk1 ON uk1.id = uk.parent_id
      LEFT JOIN unit_kerja uk2 ON uk2.id = uk1.parent_id
      LEFT JOIN unit_kerja uk3 ON uk3.id = uk2.parent_id
      LEFT JOIN unit_kerja uk4 ON uk4.id = uk3.parent_id
      WHERE ${whereSql}
        AND TRIM(UPPER(COALESCE(NULLIF(a.jabatan_nama, ''), rj.nama, 'TIDAK_DIISI'))) = TRIM(UPPER(${params.jabatanNama}))
      ORDER BY
        CASE
          WHEN a.tipe_pegawai = 'PNS' THEN 1
          WHEN a.tipe_pegawai = 'PPPK' THEN 2
          WHEN a.tipe_pegawai = 'PPPK_PARUH_WAKTU' THEN 3
          ELSE 4
        END,
        a.nama ASC,
        a.nip ASC
    `);

    return rows.map((row) => ({
      id: row.id,
      nip: row.nip,
      nama: row.nama,
      golonganNama: row.golonganNama,
      tmtGolongan: row.tmtGolongan instanceof Date
        ? row.tmtGolongan.toISOString()
        : row.tmtGolongan ? String(row.tmtGolongan) : null,
      jabatanNama: row.jabatanNama,
      tmtJabatan: row.tmtJabatan instanceof Date
        ? row.tmtJabatan.toISOString()
        : row.tmtJabatan ? String(row.tmtJabatan) : null,
      opdNama: row.opdNama ?? row.unitKerjaNama,
      unitKerjaNama: row.unitKerjaNama,
      jenisAsn: row.jenisAsn,
    }));
  }

  async findRekapAsnByEselon(params: {
    eselon: string;
    unitKerjaId?: string;
  }): Promise<RekapJabatanAsnRow[]> {
    const whereSql = await this.buildRekapWhereSql(params.unitKerjaId);
    const h = this.rekapHelpers();
    const rows = await this.prisma.$queryRaw<RekapJabatanAsnSqlRow[]>(Prisma.sql`
      SELECT
        a.id,
        a.nip,
        a.nama,
        a.golongan_nama AS golonganNama,
        a.tmt_golongan AS tmtGolongan,
        COALESCE(NULLIF(a.jabatan_nama, ''), rj.nama) AS jabatanNama,
        a.tmt_jabatan AS tmtJabatan,
        COALESCE(
          CASE WHEN uk.level = 1 THEN NULLIF(uk.nama, '') END,
          CASE WHEN uk1.level = 1 THEN NULLIF(uk1.nama, '') END,
          CASE WHEN uk2.level = 1 THEN NULLIF(uk2.nama, '') END,
          CASE WHEN uk3.level = 1 THEN NULLIF(uk3.nama, '') END,
          CASE WHEN uk4.level = 1 THEN NULLIF(uk4.nama, '') END,
          NULLIF(uk2.nama, ''),
          NULLIF(uk1.nama, ''),
          NULLIF(uk.nama, '')
        ) AS opdNama,
        uk.nama AS unitKerjaNama,
        COALESCE(NULLIF(a.tipe_pegawai, ''), NULLIF(a.jenis_pegawai_nama, ''), NULLIF(a.jenis_asn_nama, '')) AS jenisAsn
      FROM asn a
      LEFT JOIN ref_jabatan rj ON rj.id = a.jabatan_ref_id
      LEFT JOIN asn_siasn_profile sp ON sp.asn_id = a.id AND sp.deleted_at IS NULL
      LEFT JOIN unit_kerja uk ON uk.id = a.unit_kerja_id
      LEFT JOIN unit_kerja uk1 ON uk1.id = uk.parent_id
      LEFT JOIN unit_kerja uk2 ON uk2.id = uk1.parent_id
      LEFT JOIN unit_kerja uk3 ON uk3.id = uk2.parent_id
      LEFT JOIN unit_kerja uk4 ON uk4.id = uk3.parent_id
      WHERE ${whereSql}
        AND a.tipe_pegawai = 'PNS'
        AND UPPER(COALESCE(a.jenis_jabatan_nama,'')) LIKE '%STRUKTURAL%'
        AND ${h.eselonLabel} = ${params.eselon}
      ORDER BY
        a.jabatan_nama ASC,
        a.nama ASC,
        a.nip ASC
    `);

    return rows.map((row) => ({
      id: row.id,
      nip: row.nip,
      nama: row.nama,
      golonganNama: row.golonganNama,
      tmtGolongan: row.tmtGolongan instanceof Date
        ? row.tmtGolongan.toISOString()
        : row.tmtGolongan ? String(row.tmtGolongan) : null,
      jabatanNama: row.jabatanNama,
      tmtJabatan: row.tmtJabatan instanceof Date
        ? row.tmtJabatan.toISOString()
        : row.tmtJabatan ? String(row.tmtJabatan) : null,
      opdNama: row.opdNama ?? row.unitKerjaNama,
      unitKerjaNama: row.unitKerjaNama,
      jenisAsn: row.jenisAsn,
    }));
  }

  async findRekapAsnData(params: { unitKerjaId?: string } = {}): Promise<RekapAsnResponse> {
    type JkSqlRow = { jk: string; cnt: bigint | number };
    type GolruJkSqlRow = { golru: string; jk: string; cnt: bigint | number };
    type PppkGolruJkSqlRow = { jenis_asn: string; golru: string; jk: string; cnt: bigint | number };
    type PddknJkSqlRow = { pddkn_label: string; jk: string; cnt: bigint | number };
    type PppkPddknJkSqlRow = { jenis_asn: string; pddkn_label: string; jk: string; cnt: bigint | number };
    type JenjangJkSqlRow = { jenis_asn: string; kategori: string; jk: string; cnt: bigint | number };
    type EselonJkSqlRow = { eselon_label: string; jk: string; cnt: bigint | number };
    type EselonPddknSqlRow = { pddkn_label: string; eselon_label: string; cnt: bigint | number };
    type FungsionalJkSqlRow = { jabatan_nama: string; ahli_terampil: string; jk: string; cnt: bigint | number };

    const toN = (v: bigint | number | string | object | null | undefined): number => {
      if (typeof v === 'bigint') return Number(v);
      if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
      if (typeof v === 'string') {
        const parsed = Number(v);
        return Number.isFinite(parsed) ? parsed : 0;
      }
      if (v) {
        const parsed = Number(v);
        return Number.isFinite(parsed) ? parsed : 0;
      }
      return 0;
    };

    type GenderCount = { pria: number; wanita: number; lainnya: number; total: number };
    const emptyGenderCount = (): GenderCount => ({ pria: 0, wanita: 0, lainnya: 0, total: 0 });
    const addGenderCount = (entry: GenderCount, jk: string, count: number) => {
      entry.total += count;
      if (jk === 'PRIA') entry.pria += count;
      else if (jk === 'WANITA') entry.wanita += count;
      else entry.lainnya += count;
    };

    const toJKRow = (pria: number, wanita: number, lainnya = 0): RekapJKRow => {
      const total = pria + wanita + lainnya;
      return {
        pria,
        wanita,
        lainnya,
        total,
        persenPria: total > 0 ? Number(((pria / total) * 100).toFixed(2)) : 0,
        persenWanita: total > 0 ? Number(((wanita / total) * 100).toFixed(2)) : 0,
      };
    };

    const jkFragment = Prisma.sql`
      CASE
        WHEN UPPER(COALESCE(
          NULLIF(sp.jenis_kelamin_nama, ''),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$.jenis_kelamin_nama')), ''),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$.jenis_kelamin')), ''),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$.kelamin')), ''),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$."Jenis Kelamin"')), ''),
          ''
        )) IN ('LAKI-LAKI', 'LAKI LAKI', 'L', 'PRIA', 'LK', 'M', 'MALE', '1') THEN 'PRIA'
        WHEN UPPER(COALESCE(
          NULLIF(sp.jenis_kelamin_nama, ''),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$.jenis_kelamin_nama')), ''),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$.jenis_kelamin')), ''),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$.kelamin')), ''),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$."Jenis Kelamin"')), ''),
          ''
        )) IN ('PEREMPUAN', 'P', 'WANITA', 'PR', 'F', 'FEMALE', '2') THEN 'WANITA'
        ELSE 'LAINNYA'
      END`;

    const eduSubquery = Prisma.sql`
      (SELECT ph.asn_id,
        MAX(CASE
          WHEN UPPER(COALESCE(rpt.nama, ph.tingkat_pendidikan_nama, ph.pendidikan_nama, '')) REGEXP 'S[ -]?3|DOKTOR' THEN 9
          WHEN UPPER(COALESCE(rpt.nama, ph.tingkat_pendidikan_nama, ph.pendidikan_nama, '')) REGEXP 'S[ -]?2|MAGISTER' THEN 8
          WHEN UPPER(COALESCE(rpt.nama, ph.tingkat_pendidikan_nama, ph.pendidikan_nama, '')) REGEXP 'S[ -]?1|D[ -]?IV|DIPLOMA IV|SARJANA' THEN 7
          WHEN UPPER(COALESCE(rpt.nama, ph.tingkat_pendidikan_nama, ph.pendidikan_nama, '')) REGEXP 'D[ -]?III|DIPLOMA III' THEN 6
          WHEN UPPER(COALESCE(rpt.nama, ph.tingkat_pendidikan_nama, ph.pendidikan_nama, '')) REGEXP 'D[ -]?II|DIPLOMA II' THEN 5
          WHEN UPPER(COALESCE(rpt.nama, ph.tingkat_pendidikan_nama, ph.pendidikan_nama, '')) REGEXP 'D[ -]?I$|DIPLOMA I$' THEN 4
          WHEN UPPER(COALESCE(rpt.nama, ph.tingkat_pendidikan_nama, ph.pendidikan_nama, '')) REGEXP 'SMA|SMK|SLTA' THEN 3
          WHEN UPPER(COALESCE(rpt.nama, ph.tingkat_pendidikan_nama, ph.pendidikan_nama, '')) REGEXP 'SMP|SLTP|MTS' THEN 2
          WHEN UPPER(COALESCE(rpt.nama, ph.tingkat_pendidikan_nama, ph.pendidikan_nama, '')) REGEXP '^SD$|^MI$|SEKOLAH DASAR' THEN 1
          ELSE 0
        END) AS pddkn_rank
        FROM asn_pendidikan_history ph
        LEFT JOIN ref_pendidikan_tingkat rpt ON rpt.id = ph.tingkat_pendidikan_ref_id
        WHERE ph.deleted_at IS NULL
        GROUP BY ph.asn_id
      ) edu`;

    const pendidikanFallbackText = Prisma.sql`UPPER(COALESCE(
      NULLIF(a.tingkat_pendidikan_nama, ''),
      NULLIF(a.pendidikan_nama, ''),
      NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$.tingkat_pendidikan_nama')), ''),
      NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$.tingkat_pendidikan')), ''),
      NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$.pendidikan_nama')), ''),
      NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$.pendidikan_terakhir')), ''),
      NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$.pendidikan')), ''),
      NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$."Tingkat Pendidikan"')), ''),
      NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$."Pendidikan Terakhir"')), ''),
      NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$."Pendidikan"')), ''),
      ''
    ))`;

    const pddknDetailLabel = Prisma.sql`
      CASE
        WHEN edu.pddkn_rank = 9 OR ${pendidikanFallbackText} REGEXP 'S[ -]?3|DOKTOR' THEN 'S3'
        WHEN edu.pddkn_rank = 8 OR ${pendidikanFallbackText} REGEXP 'S[ -]?2|MAGISTER' THEN 'S2'
        WHEN edu.pddkn_rank = 7 OR ${pendidikanFallbackText} REGEXP 'S[ -]?1|D[ -]?IV|DIPLOMA IV|SARJANA' THEN 'S1/D.IV'
        WHEN edu.pddkn_rank = 6 OR ${pendidikanFallbackText} REGEXP 'D[ -]?III|DIPLOMA III' THEN 'D.III'
        WHEN edu.pddkn_rank = 5 OR ${pendidikanFallbackText} REGEXP 'D[ -]?II|DIPLOMA II' THEN 'D.II'
        WHEN edu.pddkn_rank = 4 OR ${pendidikanFallbackText} REGEXP 'D[ -]?I$|DIPLOMA I$' THEN 'D.I'
        WHEN edu.pddkn_rank = 3 OR ${pendidikanFallbackText} REGEXP 'SMA|SMK|SLTA|MA' THEN 'SMA/SMK'
        WHEN edu.pddkn_rank = 2 OR ${pendidikanFallbackText} REGEXP 'SMP|SLTP|MTS' THEN 'SMP'
        WHEN edu.pddkn_rank = 1 OR ${pendidikanFallbackText} REGEXP '^SD$|^MI$|SEKOLAH DASAR' THEN 'SD'
        ELSE 'LAINNYA'
      END`;

    const pddknGroupLabel = Prisma.sql`
      CASE
        WHEN edu.pddkn_rank >= 7 OR ${pendidikanFallbackText} REGEXP 'S[ -]?[123]|D[ -]?IV|DIPLOMA IV|SARJANA|MAGISTER|DOKTOR' THEN 'TINGGI'
        WHEN edu.pddkn_rank >= 4 OR ${pendidikanFallbackText} REGEXP 'D[ -]?[I]{1,3}|DIPLOMA [I]{1,3}' THEN 'DIPLOMA'
        WHEN edu.pddkn_rank >= 1 OR ${pendidikanFallbackText} REGEXP 'SMA|SMK|SLTA|MA|SMP|SLTP|MTS|^SD$|^MI$|SEKOLAH DASAR' THEN 'DSR & MNGH'
        ELSE 'LAINNYA'
      END`;

    const eselonLabel = Prisma.sql`
      CASE UPPER(COALESCE(
        NULLIF(a.siasn_eselon_id, ''),
        NULLIF(a.eselon_nama, ''),
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$.eselon_id')), ''),
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$.eselon')), ''),
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$."eselon id"')), ''),
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$."Eselon ID"')), ''),
        ''
      ))
        WHEN '12' THEN 'I.b' WHEN 'I.B' THEN 'I.b' WHEN 'IB' THEN 'I.b'
        WHEN '21' THEN 'II.a' WHEN 'II.A' THEN 'II.a' WHEN 'IIA' THEN 'II.a'
        WHEN '22' THEN 'II.b' WHEN 'II.B' THEN 'II.b' WHEN 'IIB' THEN 'II.b'
        WHEN '31' THEN 'III.a' WHEN 'III.A' THEN 'III.a' WHEN 'IIIA' THEN 'III.a'
        WHEN '32' THEN 'III.b' WHEN 'III.B' THEN 'III.b' WHEN 'IIIB' THEN 'III.b'
        WHEN '41' THEN 'IV.a' WHEN 'IV.A' THEN 'IV.a' WHEN 'IVA' THEN 'IV.a'
        WHEN '42' THEN 'IV.b' WHEN 'IV.B' THEN 'IV.b' WHEN 'IVB' THEN 'IV.b'
        ELSE NULL
      END`;

    const jenisJabatanText = Prisma.sql`UPPER(COALESCE(
      NULLIF(a.jenis_jabatan_nama, ''),
      NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$.jenis_jabatan_nama')), ''),
      NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$.jenis_jabatan')), ''),
      NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$."Jenis Jabatan"')), ''),
      ''
    ))`;

    const jenisJabatanKategori = Prisma.sql`
      CASE
        WHEN ${jenisJabatanText} LIKE '%STRUKTURAL%' THEN 'STRUKTURAL'
        WHEN ${jenisJabatanText} LIKE '%FUNGSIONAL%' THEN 'FUNGSIONAL'
        WHEN ${jenisJabatanText} LIKE '%PELAKSANA%' THEN 'PELAKSANA'
        ELSE 'LAINNYA'
      END`;

    const jenisAsnKategori = Prisma.sql`
      CASE
        WHEN UPPER(COALESCE(NULLIF(a.tipe_pegawai, ''), NULLIF(a.jenis_pegawai_nama, ''), NULLIF(a.jenis_asn_nama, ''), '')) IN ('PNS', 'CPNS') THEN 'PNS'
        WHEN UPPER(COALESCE(NULLIF(a.tipe_pegawai, ''), NULLIF(a.jenis_pegawai_nama, ''), NULLIF(a.jenis_asn_nama, ''), '')) LIKE '%PARUH%WAKTU%'
          OR UPPER(COALESCE(NULLIF(a.jenis_pegawai_nama, ''), NULLIF(a.jenis_asn_nama, ''), NULLIF(a.tipe_pegawai, ''), '')) LIKE '%PARUH%WAKTU%'
          THEN 'PPPK_PARUH_WAKTU'
        WHEN UPPER(COALESCE(NULLIF(a.tipe_pegawai, ''), NULLIF(a.jenis_pegawai_nama, ''), NULLIF(a.jenis_asn_nama, ''), '')) LIKE '%PPPK%'
          OR UPPER(COALESCE(NULLIF(a.jenis_pegawai_nama, ''), NULLIF(a.jenis_asn_nama, ''), NULLIF(a.tipe_pegawai, ''), '')) LIKE '%PPPK%'
          THEN 'PPPK'
        ELSE COALESCE(NULLIF(a.tipe_pegawai,''), NULLIF(a.jenis_pegawai_nama,''), NULLIF(a.jenis_asn_nama,''), 'LAINNYA')
      END`;

    const whereSql = await this.buildRekapWhereSql(params.unitKerjaId);

    const [
      allJkRows,
      pnsGolonganRows,
      pnsPendidikanRows,
      allJenjangRows,
      strukturalEselonRows,
      strukturalPendidikanRows,
      fungsionalRows,
      pppkJkRows,
      pppkGolonganRows,
      pppkPendidikanRows,
    ] = await Promise.all([
      // 1. allJk
      this.prisma.$queryRaw<JkSqlRow[]>(Prisma.sql`
        SELECT ${jkFragment} AS jk, COUNT(*) AS cnt
        FROM asn a
        LEFT JOIN asn_siasn_profile sp ON sp.asn_id = a.id AND sp.deleted_at IS NULL
        WHERE ${whereSql}
        GROUP BY jk
      `),

      // 2. pnsGolonganDetail
      this.prisma.$queryRaw<GolruJkSqlRow[]>(Prisma.sql`
        SELECT
          CASE
            WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%IV/E%' THEN 'IV/e'
            WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%IV/D%' THEN 'IV/d'
            WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%IV/C%' THEN 'IV/c'
            WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%IV/B%' THEN 'IV/b'
            WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%IV/A%' THEN 'IV/a'
            WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%III/D%' THEN 'III/d'
            WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%III/C%' THEN 'III/c'
            WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%III/B%' THEN 'III/b'
            WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%III/A%' THEN 'III/a'
            WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%II/D%' THEN 'II/d'
            WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%II/C%' THEN 'II/c'
            WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%II/B%' THEN 'II/b'
            WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%II/A%' THEN 'II/a'
            WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%I/D%' THEN 'I/d'
            WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%I/C%' THEN 'I/c'
            WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%I/B%' THEN 'I/b'
            WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%I/A%' THEN 'I/a'
            ELSE 'LAINNYA'
          END AS golru,
          ${jkFragment} AS jk,
          COUNT(*) AS cnt
        FROM asn a
        LEFT JOIN asn_siasn_profile sp ON sp.asn_id = a.id AND sp.deleted_at IS NULL
        WHERE ${whereSql} AND a.tipe_pegawai = 'PNS'
        GROUP BY golru, jk
      `),

      // 3. pnsPendidikanDetail
      this.prisma.$queryRaw<PddknJkSqlRow[]>(Prisma.sql`
        SELECT ${pddknDetailLabel} AS pddkn_label, ${jkFragment} AS jk, COUNT(*) AS cnt
        FROM asn a
        LEFT JOIN asn_siasn_profile sp ON sp.asn_id = a.id AND sp.deleted_at IS NULL
        LEFT JOIN ${eduSubquery} ON edu.asn_id = a.id
        WHERE ${whereSql} AND a.tipe_pegawai = 'PNS'
        GROUP BY pddkn_label, jk
      `),

      // 4. allJenjangJabatan
      this.prisma.$queryRaw<JenjangJkSqlRow[]>(Prisma.sql`
        SELECT
          ${jenisAsnKategori} AS jenis_asn,
          ${jenisJabatanKategori} AS kategori,
          ${jkFragment} AS jk,
          COUNT(*) AS cnt
        FROM asn a
        LEFT JOIN asn_siasn_profile sp ON sp.asn_id = a.id AND sp.deleted_at IS NULL
        WHERE ${whereSql}
        GROUP BY jenis_asn, kategori, jk
      `),

      // 5. strukturalEselon
      this.prisma.$queryRaw<EselonJkSqlRow[]>(Prisma.sql`
        SELECT
          ${eselonLabel} AS eselon_label,
          ${jkFragment} AS jk,
          COUNT(*) AS cnt
        FROM asn a
        LEFT JOIN asn_siasn_profile sp ON sp.asn_id = a.id AND sp.deleted_at IS NULL
        WHERE ${whereSql}
          AND a.tipe_pegawai = 'PNS'
          AND ${jenisJabatanText} LIKE '%STRUKTURAL%'
        GROUP BY eselon_label, jk
      `),

      // 6. strukturalPendidikan
      this.prisma.$queryRaw<EselonPddknSqlRow[]>(Prisma.sql`
        SELECT
          ${pddknDetailLabel} AS pddkn_label,
          ${eselonLabel} AS eselon_label,
          COUNT(*) AS cnt
        FROM asn a
        LEFT JOIN asn_siasn_profile sp ON sp.asn_id = a.id AND sp.deleted_at IS NULL
        LEFT JOIN ${eduSubquery} ON edu.asn_id = a.id
        WHERE ${whereSql}
          AND a.tipe_pegawai = 'PNS'
          AND ${jenisJabatanText} LIKE '%STRUKTURAL%'
        GROUP BY pddkn_label, eselon_label
      `),

      // 7. fungsionalJabatan — subquery avoids only_full_group_by on rj.nama
      this.prisma.$queryRaw<FungsionalJkSqlRow[]>(Prisma.sql`
        SELECT sub.jabatan_nama, sub.ahli_terampil, sub.jk, COUNT(*) AS cnt
        FROM (
          SELECT
            COALESCE(NULLIF(a.jabatan_nama,''), rj.nama, 'TIDAK_DIISI') AS jabatan_nama,
            CASE
              WHEN UPPER(COALESCE(rfp.jenjang, rfp.kategori, '')) LIKE '%AHLI%'
                OR UPPER(COALESCE(rfp.jenjang,'')) IN ('UTAMA','MADYA','MUDA','PERTAMA') THEN 'AHLI'
              ELSE 'TERAMPIL'
            END AS ahli_terampil,
            ${jkFragment} AS jk
          FROM asn a
          LEFT JOIN asn_siasn_profile sp ON sp.asn_id = a.id AND sp.deleted_at IS NULL
          LEFT JOIN ref_jabatan rj ON rj.id = a.jabatan_ref_id
          LEFT JOIN ref_jabatan_fungsional_profile rfp ON rfp.jabatan_id = rj.id
          WHERE ${whereSql}
            AND a.tipe_pegawai = 'PNS'
            AND ${jenisJabatanText} LIKE '%FUNGSIONAL%'
        ) sub
        GROUP BY sub.jabatan_nama, sub.ahli_terampil, sub.jk
      `),

      // 8. pppkJk
      this.prisma.$queryRaw<JkSqlRow[]>(Prisma.sql`
        SELECT ${jkFragment} AS jk, COUNT(*) AS cnt
        FROM asn a
        LEFT JOIN asn_siasn_profile sp ON sp.asn_id = a.id AND sp.deleted_at IS NULL
        WHERE ${whereSql}
          AND a.tipe_pegawai IN ('PPPK','PPPK_PARUH_WAKTU')
        GROUP BY jk
      `),

      // 9. pppkGolongan
      this.prisma.$queryRaw<PppkGolruJkSqlRow[]>(Prisma.sql`
        SELECT
          ${jenisAsnKategori} AS jenis_asn,
          CASE
            WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%XI%' THEN 'XI'
            WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%IX%' THEN 'IX'
            WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%VIII%' THEN 'VIII'
            WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%VII%' THEN 'VII'
            WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%VI%' THEN 'VI'
            WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%X%' THEN 'X'
            WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%V%' THEN 'V'
            ELSE 'LAINNYA'
          END AS golru,
          ${jkFragment} AS jk,
          COUNT(*) AS cnt
        FROM asn a
        LEFT JOIN asn_siasn_profile sp ON sp.asn_id = a.id AND sp.deleted_at IS NULL
        WHERE ${whereSql}
          AND ${jenisAsnKategori} IN ('PPPK','PPPK_PARUH_WAKTU')
        GROUP BY jenis_asn, golru, jk
      `),

      // 10. pppkPendidikan
      this.prisma.$queryRaw<PppkPddknJkSqlRow[]>(Prisma.sql`
        SELECT
          ${jenisAsnKategori} AS jenis_asn,
          ${pddknDetailLabel} AS pddkn_label,
          ${jkFragment} AS jk,
          COUNT(*) AS cnt
        FROM asn a
        LEFT JOIN asn_siasn_profile sp ON sp.asn_id = a.id AND sp.deleted_at IS NULL
        LEFT JOIN ${eduSubquery} ON edu.asn_id = a.id
        WHERE ${whereSql}
          AND ${jenisAsnKategori} IN ('PPPK','PPPK_PARUH_WAKTU')
        GROUP BY jenis_asn, pddkn_label, jk
      `),
    ]);

    // --- Build allJk ---
    const allJkMap = new Map<string, number>();
    for (const row of allJkRows) allJkMap.set(row.jk, toN(row.cnt));
    const allJk = toJKRow(
      allJkMap.get('PRIA') ?? 0,
      allJkMap.get('WANITA') ?? 0,
      allJkMap.get('LAINNYA') ?? 0,
    );

    // --- Build pnsGolonganDetail ---
    const PNS_GOLRU_DETAIL = ['IV/e','IV/d','IV/c','IV/b','IV/a','III/d','III/c','III/b','III/a','II/d','II/c','II/b','II/a','I/d','I/c','I/b','I/a'];
    const pnsGolruMap = new Map<string, GenderCount>();
    for (const row of pnsGolonganRows) {
      const g = row.golru;
      const entry = pnsGolruMap.get(g) ?? emptyGenderCount();
      addGenderCount(entry, row.jk, toN(row.cnt));
      pnsGolruMap.set(g, entry);
    }
    const pnsGolonganDetail: RekapGolonganRow[] = PNS_GOLRU_DETAIL.map((golru) => {
      const e = pnsGolruMap.get(golru) ?? emptyGenderCount();
      return { golru, pria: e.pria, wanita: e.wanita, total: e.total };
    });

    // --- Build pnsGolonganGroup ---
    const PNS_GOLRU_GROUP = ['IV','III','II','I'];
    const pnsGolruGroupMap = new Map<string, GenderCount>();
    for (const row of pnsGolonganRows) {
      const g = row.golru;
      let grp = 'LAINNYA';
      if (g.startsWith('IV')) grp = 'IV';
      else if (g.startsWith('III')) grp = 'III';
      else if (g.startsWith('II')) grp = 'II';
      else if (g.startsWith('I')) grp = 'I';
      const entry = pnsGolruGroupMap.get(grp) ?? emptyGenderCount();
      addGenderCount(entry, row.jk, toN(row.cnt));
      pnsGolruGroupMap.set(grp, entry);
    }
    const pnsGolonganGroup: RekapGolonganRow[] = PNS_GOLRU_GROUP.map((golru) => {
      const e = pnsGolruGroupMap.get(golru) ?? emptyGenderCount();
      return { golru, pria: e.pria, wanita: e.wanita, total: e.total };
    });

    // --- Build pnsPendidikanDetail ---
    const PDDKN_DETAIL_ORDER = ['S3','S2','S1/D.IV','D.III','D.II','D.I','SMA/SMK','SMP','SD','LAINNYA'];
    const pnsPddknMap = new Map<string, GenderCount>();
    for (const row of pnsPendidikanRows) {
      const entry = pnsPddknMap.get(row.pddkn_label) ?? emptyGenderCount();
      addGenderCount(entry, row.jk, toN(row.cnt));
      pnsPddknMap.set(row.pddkn_label, entry);
    }
    const pnsPendidikanDetail: RekapPendidikanRow[] = PDDKN_DETAIL_ORDER.map((pddkn) => {
      const e = pnsPddknMap.get(pddkn) ?? emptyGenderCount();
      return { pddkn, pria: e.pria, wanita: e.wanita, total: e.total };
    });

    // --- Build pnsPendidikanGroup ---
    const PDDKN_GROUP_ORDER = ['TINGGI','DIPLOMA','DSR & MNGH','LAINNYA'];
    const pnsPddknGroupMap = new Map<string, GenderCount>();
    for (const row of pnsPendidikanRows) {
      let grp = 'LAINNYA';
      if (['S3','S2','S1/D.IV'].includes(row.pddkn_label)) grp = 'TINGGI';
      else if (['D.III','D.II','D.I'].includes(row.pddkn_label)) grp = 'DIPLOMA';
      else if (['SMA/SMK','SMP','SD'].includes(row.pddkn_label)) grp = 'DSR & MNGH';
      const entry = pnsPddknGroupMap.get(grp) ?? emptyGenderCount();
      addGenderCount(entry, row.jk, toN(row.cnt));
      pnsPddknGroupMap.set(grp, entry);
    }
    const pnsPendidikanGroup: RekapPendidikanRow[] = PDDKN_GROUP_ORDER.map((pddkn) => {
      const e = pnsPddknGroupMap.get(pddkn) ?? emptyGenderCount();
      return { pddkn, pria: e.pria, wanita: e.wanita, total: e.total };
    });

    // --- Build allJenjangJabatan ---
    const JENIS_ASN_ORDER = ['PNS','PPPK','PPPK_PARUH_WAKTU'];
    const JENJANG_ORDER = ['STRUKTURAL','FUNGSIONAL','PELAKSANA'];
    const jenjangMap = new Map<string, GenderCount>();
    for (const row of allJenjangRows) {
      const key = `${row.jenis_asn}:${row.kategori}`;
      const entry = jenjangMap.get(key) ?? emptyGenderCount();
      addGenderCount(entry, row.jk, toN(row.cnt));
      jenjangMap.set(key, entry);
    }
    const toJenjangRow = (jenisAsn: string, jabatan: string): RekapJenjangRow => {
      const e = jenjangMap.get(`${jenisAsn}:${jabatan}`) ?? emptyGenderCount();
      return {
        jenisAsn,
        jabatan,
        pria: e.pria,
        wanita: e.wanita,
        total: e.total,
        persenPria: e.total > 0 ? Number(((e.pria / e.total) * 100).toFixed(2)) : 0,
        persenWanita: e.total > 0 ? Number(((e.wanita / e.total) * 100).toFixed(2)) : 0,
      };
    };
    const allJenjangJabatan: RekapJenjangRow[] = JENIS_ASN_ORDER.flatMap((jenisAsn) =>
      JENJANG_ORDER.map((jabatan) => toJenjangRow(jenisAsn, jabatan)),
    );

    // --- Build strukturalEselonDetail ---
    const ESELON_SLOTS = ['I.b','II.a','II.b','III.a','III.b','IV.a','IV.b'];
    const eselonMap = new Map<string, GenderCount>();
    for (const row of strukturalEselonRows) {
      if (!row.eselon_label) continue;
      const entry = eselonMap.get(row.eselon_label) ?? emptyGenderCount();
      addGenderCount(entry, row.jk, toN(row.cnt));
      eselonMap.set(row.eselon_label, entry);
    }
    const strukturalEselonDetail: RekapStrukturalEselonRow[] = ESELON_SLOTS.map((eselon) => {
      const e = eselonMap.get(eselon) ?? emptyGenderCount();
      return { eselon, terisi: e.total, pria: e.pria, wanita: e.wanita };
    });

    // --- Build strukturalEselonGroup ---
    const ESELON_GROUP_SLOTS = ['I','II','III','IV'];
    const eselonGroupMap = new Map<string, GenderCount>();
    for (const row of strukturalEselonRows) {
      if (!row.eselon_label) continue;
      let grp = 'LAINNYA';
      if (row.eselon_label.startsWith('I.')) grp = 'I';
      else if (row.eselon_label.startsWith('II.')) grp = 'II';
      else if (row.eselon_label.startsWith('III.')) grp = 'III';
      else if (row.eselon_label.startsWith('IV.')) grp = 'IV';
      const entry = eselonGroupMap.get(grp) ?? emptyGenderCount();
      addGenderCount(entry, row.jk, toN(row.cnt));
      eselonGroupMap.set(grp, entry);
    }
    const strukturalEselonGroup: RekapStrukturalEselonRow[] = ESELON_GROUP_SLOTS.map((eselon) => {
      const e = eselonGroupMap.get(eselon) ?? emptyGenderCount();
      return { eselon, terisi: e.total, pria: e.pria, wanita: e.wanita };
    });

    // --- Build strukturalPendidikan ---
    type EssPddknEntry = { ess1: number; ess2: number; ess3: number; ess4: number };
    const strPddknMap = new Map<string, EssPddknEntry>();
    const getEssGroup = (label: string | null): keyof EssPddknEntry | null => {
      if (!label) return null;
      if (label.startsWith('I.')) return 'ess1';
      if (label.startsWith('II.')) return 'ess2';
      if (label.startsWith('III.')) return 'ess3';
      if (label.startsWith('IV.')) return 'ess4';
      return null;
    };
    for (const row of strukturalPendidikanRows) {
      const pddkn = row.pddkn_label;
      const essKey = getEssGroup(row.eselon_label);
      if (!essKey) continue;
      const entry = strPddknMap.get(pddkn) ?? { ess1: 0, ess2: 0, ess3: 0, ess4: 0 };
      entry[essKey] += toN(row.cnt);
      strPddknMap.set(pddkn, entry);
    }
    const strukturalPendidikan: RekapStrukturalPendidikanRow[] = PDDKN_DETAIL_ORDER.map((pddkn) => {
      const e = strPddknMap.get(pddkn) ?? { ess1: 0, ess2: 0, ess3: 0, ess4: 0 };
      return { pddkn, ess1: e.ess1, ess2: e.ess2, ess3: e.ess3, ess4: e.ess4, total: e.ess1 + e.ess2 + e.ess3 + e.ess4 };
    });

    // --- Build fungsionalJabatan ---
    type FungsRow = {
      ahliPria: number;
      ahliWanita: number;
      jumlahAhli: number;
      terampilPria: number;
      terampilWanita: number;
      jumlahTerampil: number;
    };
    const fungsMap = new Map<string, FungsRow>();
    for (const row of fungsionalRows) {
      const jabatan = row.jabatan_nama;
      const entry = fungsMap.get(jabatan) ?? {
        ahliPria: 0,
        ahliWanita: 0,
        jumlahAhli: 0,
        terampilPria: 0,
        terampilWanita: 0,
        jumlahTerampil: 0,
      };
      const count = toN(row.cnt);
      if (row.ahli_terampil === 'AHLI') {
        entry.jumlahAhli += count;
        if (row.jk === 'PRIA') entry.ahliPria += count;
        else if (row.jk === 'WANITA') entry.ahliWanita += count;
      } else {
        entry.jumlahTerampil += count;
        if (row.jk === 'PRIA') entry.terampilPria += count;
        else if (row.jk === 'WANITA') entry.terampilWanita += count;
      }
      fungsMap.set(jabatan, entry);
    }
    const fungsionalJabatan: RekapFungsionalRow[] = Array.from(fungsMap.entries())
      .map(([namaJabatan, e]) => ({
        namaJabatan,
        ahliPria: e.ahliPria,
        ahliWanita: e.ahliWanita,
        jumlahAhli: e.jumlahAhli,
        terampilPria: e.terampilPria,
        terampilWanita: e.terampilWanita,
        jumlahTerampil: e.jumlahTerampil,
        jumlahTotal: e.jumlahAhli + e.jumlahTerampil,
      }))
      .sort((a, b) => a.namaJabatan.localeCompare(b.namaJabatan));

    // --- Build pppkJk ---
    const pppkJkMap = new Map<string, number>();
    for (const row of pppkJkRows) pppkJkMap.set(row.jk, toN(row.cnt));
    const pppkJk = toJKRow(
      pppkJkMap.get('PRIA') ?? 0,
      pppkJkMap.get('WANITA') ?? 0,
      pppkJkMap.get('LAINNYA') ?? 0,
    );

    // --- Build pppkGolongan ---
    const PPPK_GOLRU_ORDER = ['XI','X','IX','VIII','VII','VI','V','LAINNYA'];
    const pppkGolruMap = new Map<string, GenderCount>();
    for (const row of pppkGolonganRows) {
      const key = `${row.jenis_asn}:${row.golru}`;
      const entry = pppkGolruMap.get(key) ?? emptyGenderCount();
      addGenderCount(entry, row.jk, toN(row.cnt));
      pppkGolruMap.set(key, entry);
    }
    const toPppkGolonganRows = (jenisAsn: string): RekapGolonganRow[] => PPPK_GOLRU_ORDER.map((golru) => {
      const e = pppkGolruMap.get(`${jenisAsn}:${golru}`) ?? emptyGenderCount();
      return { golru, pria: e.pria, wanita: e.wanita, total: e.total };
    });
    const pppkGolongan = toPppkGolonganRows('PPPK');
    const pppkParuhWaktuGolongan = toPppkGolonganRows('PPPK_PARUH_WAKTU');

    // --- Build pppkPendidikanDetail ---
    const pppkPddknMap = new Map<string, GenderCount>();
    for (const row of pppkPendidikanRows) {
      const key = `${row.jenis_asn}:${row.pddkn_label}`;
      const entry = pppkPddknMap.get(key) ?? emptyGenderCount();
      addGenderCount(entry, row.jk, toN(row.cnt));
      pppkPddknMap.set(key, entry);
    }
    const toPppkPendidikanDetailRows = (jenisAsn: string): RekapPendidikanRow[] => PDDKN_DETAIL_ORDER.map((pddkn) => {
      const e = pppkPddknMap.get(`${jenisAsn}:${pddkn}`) ?? emptyGenderCount();
      return { pddkn, pria: e.pria, wanita: e.wanita, total: e.total };
    });
    const pppkPendidikanDetail = toPppkPendidikanDetailRows('PPPK');
    const pppkParuhWaktuPendidikanDetail = toPppkPendidikanDetailRows('PPPK_PARUH_WAKTU');

    // --- Build pppkPendidikanGroup ---
    const pppkPddknGroupMap = new Map<string, GenderCount>();
    for (const row of pppkPendidikanRows) {
      let grp = 'LAINNYA';
      if (['S3','S2','S1/D.IV'].includes(row.pddkn_label)) grp = 'TINGGI';
      else if (['D.III','D.II','D.I'].includes(row.pddkn_label)) grp = 'DIPLOMA';
      else if (['SMA/SMK','SMP','SD'].includes(row.pddkn_label)) grp = 'DSR & MNGH';
      const key = `${row.jenis_asn}:${grp}`;
      const entry = pppkPddknGroupMap.get(key) ?? emptyGenderCount();
      addGenderCount(entry, row.jk, toN(row.cnt));
      pppkPddknGroupMap.set(key, entry);
    }
    const toPppkPendidikanGroupRows = (jenisAsn: string): RekapPendidikanRow[] => PDDKN_GROUP_ORDER.map((pddkn) => {
      const e = pppkPddknGroupMap.get(`${jenisAsn}:${pddkn}`) ?? emptyGenderCount();
      return { pddkn, pria: e.pria, wanita: e.wanita, total: e.total };
    });
    const pppkPendidikanGroup = toPppkPendidikanGroupRows('PPPK');
    const pppkParuhWaktuPendidikanGroup = toPppkPendidikanGroupRows('PPPK_PARUH_WAKTU');

    // --- Build pppkJenjangJabatan ---
    const pppkJenjangJabatan: RekapJenjangRow[] = JENJANG_ORDER.map((jabatan) =>
      toJenjangRow('PPPK', jabatan),
    );

    return {
      allJk,
      pnsGolonganDetail,
      pnsGolonganGroup,
      pnsPendidikanDetail,
      pnsPendidikanGroup,
      allJenjangJabatan,
      strukturalEselonDetail,
      strukturalEselonGroup,
      strukturalPendidikan,
      fungsionalJabatan,
      pppkJk,
      pppkGolongan,
      pppkPendidikanDetail,
      pppkPendidikanGroup,
      pppkParuhWaktuGolongan,
      pppkParuhWaktuPendidikanDetail,
      pppkParuhWaktuPendidikanGroup,
      pppkJenjangJabatan,
    };
  }

  // ── Shared helpers for split rekap methods ───────────────────────────────

  private async buildRekapWhereSql(unitKerjaId?: string): Promise<Prisma.Sql> {
    const clauses: Prisma.Sql[] = [
      Prisma.sql`a.deleted_at IS NULL`,
      Prisma.sql`(
        a.is_active = 1
        OR UPPER(COALESCE(a.status_asn, '')) IN ('AKTIF', 'ACTIVE')
        OR (
          UPPER(COALESCE(a.status_asn, '')) LIKE '%AKTIF%'
          AND UPPER(COALESCE(a.status_asn, '')) NOT LIKE '%TIDAK%AKTIF%'
          AND UPPER(COALESCE(a.status_asn, '')) NOT LIKE '%NON%AKTIF%'
        )
      )`,
    ];

    if (unitKerjaId) {
      const unitIds = await this.findUnitKerjaDescendantIds(unitKerjaId);
      clauses.push(
        Prisma.sql`a.unit_kerja_id IN (${Prisma.join(
          unitIds.length > 0 ? unitIds : [unitKerjaId],
        )})`,
      );
    }

    return Prisma.join(clauses, ' AND ');
  }

  private rekapHelpers() {
    type JkSqlRow = { jk: string; cnt: bigint | number };
    type GolruJkSqlRow = { golru: string; jk: string; cnt: bigint | number };
    type PddknJkSqlRow = { pddkn_label: string; jk: string; cnt: bigint | number };
    type JenjangJkSqlRow = { kategori: string; jk: string; cnt: bigint | number };
    type EselonJkSqlRow = { eselon_label: string; jk: string; cnt: bigint | number };
    type EselonPddknSqlRow = { pddkn_label: string; eselon_label: string; cnt: bigint | number };
    type FungsionalJkSqlRow = { jabatan_nama: string; ahli_terampil: string; jk: string; cnt: bigint | number };

    const toN = (v: bigint | number | string | object | null | undefined): number => {
      if (typeof v === 'bigint') return Number(v);
      if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
      if (typeof v === 'string') {
        const parsed = Number(v);
        return Number.isFinite(parsed) ? parsed : 0;
      }
      if (v) {
        const parsed = Number(v);
        return Number.isFinite(parsed) ? parsed : 0;
      }
      return 0;
    };

    const toJKRow = (pria: number, wanita: number, lainnya = 0): RekapJKRow => {
      const total = pria + wanita + lainnya;
      return {
        pria, wanita, lainnya, total,
        persenPria: total > 0 ? Number(((pria / total) * 100).toFixed(2)) : 0,
        persenWanita: total > 0 ? Number(((wanita / total) * 100).toFixed(2)) : 0,
      };
    };

    const jkFragment = Prisma.sql`
      CASE
        WHEN UPPER(COALESCE(sp.jenis_kelamin_nama, '')) IN ('LAKI-LAKI', 'LAKI LAKI', 'L', 'PRIA', 'LK', 'M', 'MALE', '1') THEN 'PRIA'
        WHEN UPPER(COALESCE(sp.jenis_kelamin_nama, '')) IN ('PEREMPUAN', 'P', 'WANITA', 'PR', 'F', 'FEMALE', '2') THEN 'WANITA'
        ELSE 'LAINNYA'
      END`;

    const eduSubquery = Prisma.sql`
      (SELECT ph.asn_id,
        MAX(CASE
          WHEN UPPER(COALESCE(rpt.nama, ph.tingkat_pendidikan_nama, ph.pendidikan_nama, '')) REGEXP 'S[ -]?3|DOKTOR' THEN 9
          WHEN UPPER(COALESCE(rpt.nama, ph.tingkat_pendidikan_nama, ph.pendidikan_nama, '')) REGEXP 'S[ -]?2|MAGISTER' THEN 8
          WHEN UPPER(COALESCE(rpt.nama, ph.tingkat_pendidikan_nama, ph.pendidikan_nama, '')) REGEXP 'S[ -]?1|D[ -]?IV|DIPLOMA IV|SARJANA' THEN 7
          WHEN UPPER(COALESCE(rpt.nama, ph.tingkat_pendidikan_nama, ph.pendidikan_nama, '')) REGEXP 'D[ -]?III|DIPLOMA III' THEN 6
          WHEN UPPER(COALESCE(rpt.nama, ph.tingkat_pendidikan_nama, ph.pendidikan_nama, '')) REGEXP 'D[ -]?II|DIPLOMA II' THEN 5
          WHEN UPPER(COALESCE(rpt.nama, ph.tingkat_pendidikan_nama, ph.pendidikan_nama, '')) REGEXP 'D[ -]?I$|DIPLOMA I$' THEN 4
          WHEN UPPER(COALESCE(rpt.nama, ph.tingkat_pendidikan_nama, ph.pendidikan_nama, '')) REGEXP 'SMA|SMK|SLTA' THEN 3
          WHEN UPPER(COALESCE(rpt.nama, ph.tingkat_pendidikan_nama, ph.pendidikan_nama, '')) REGEXP 'SMP|SLTP|MTS' THEN 2
          WHEN UPPER(COALESCE(rpt.nama, ph.tingkat_pendidikan_nama, ph.pendidikan_nama, '')) REGEXP '^SD$|^MI$|SEKOLAH DASAR' THEN 1
          ELSE 0
        END) AS pddkn_rank
        FROM asn_pendidikan_history ph
        LEFT JOIN ref_pendidikan_tingkat rpt ON rpt.id = ph.tingkat_pendidikan_ref_id
        WHERE ph.deleted_at IS NULL
        GROUP BY ph.asn_id
      ) edu`;

    const pendidikanFallbackText = Prisma.sql`UPPER(COALESCE(
      NULLIF(a.tingkat_pendidikan_nama, ''),
      NULLIF(a.pendidikan_nama, ''),
      NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$.tingkat_pendidikan_nama')), ''),
      NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$.tingkat_pendidikan')), ''),
      NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$.pendidikan_nama')), ''),
      NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$.pendidikan_terakhir')), ''),
      NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$.pendidikan')), ''),
      NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$."Tingkat Pendidikan"')), ''),
      NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$."Pendidikan Terakhir"')), ''),
      NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$."Pendidikan"')), ''),
      ''
    ))`;

    const pddknDetailLabel = Prisma.sql`
      CASE
        WHEN edu.pddkn_rank = 9 OR ${pendidikanFallbackText} REGEXP 'S[ -]?3|DOKTOR' THEN 'S3'
        WHEN edu.pddkn_rank = 8 OR ${pendidikanFallbackText} REGEXP 'S[ -]?2|MAGISTER' THEN 'S2'
        WHEN edu.pddkn_rank = 7 OR ${pendidikanFallbackText} REGEXP 'S[ -]?1|D[ -]?IV|DIPLOMA IV|SARJANA' THEN 'S1/D.IV'
        WHEN edu.pddkn_rank = 6 OR ${pendidikanFallbackText} REGEXP 'D[ -]?III|DIPLOMA III' THEN 'D.III'
        WHEN edu.pddkn_rank = 5 OR ${pendidikanFallbackText} REGEXP 'D[ -]?II|DIPLOMA II' THEN 'D.II'
        WHEN edu.pddkn_rank = 4 OR ${pendidikanFallbackText} REGEXP 'D[ -]?I$|DIPLOMA I$' THEN 'D.I'
        WHEN edu.pddkn_rank = 3 OR ${pendidikanFallbackText} REGEXP 'SMA|SMK|SLTA|MA' THEN 'SMA/SMK'
        WHEN edu.pddkn_rank = 2 OR ${pendidikanFallbackText} REGEXP 'SMP|SLTP|MTS' THEN 'SMP'
        WHEN edu.pddkn_rank = 1 OR ${pendidikanFallbackText} REGEXP '^SD$|^MI$|SEKOLAH DASAR' THEN 'SD'
        ELSE 'LAINNYA'
      END`;

    const eselonLabel = Prisma.sql`
      CASE UPPER(COALESCE(
        NULLIF(a.siasn_eselon_id, ''),
        NULLIF(a.eselon_nama, ''),
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$.eselon_id')), ''),
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$.eselon')), ''),
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$."eselon id"')), ''),
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.raw_data, '$."Eselon ID"')), ''),
        ''
      ))
        WHEN '12' THEN 'I.b' WHEN 'I.B' THEN 'I.b' WHEN 'IB' THEN 'I.b'
        WHEN '21' THEN 'II.a' WHEN 'II.A' THEN 'II.a' WHEN 'IIA' THEN 'II.a'
        WHEN '22' THEN 'II.b' WHEN 'II.B' THEN 'II.b' WHEN 'IIB' THEN 'II.b'
        WHEN '31' THEN 'III.a' WHEN 'III.A' THEN 'III.a' WHEN 'IIIA' THEN 'III.a'
        WHEN '32' THEN 'III.b' WHEN 'III.B' THEN 'III.b' WHEN 'IIIB' THEN 'III.b'
        WHEN '41' THEN 'IV.a' WHEN 'IV.A' THEN 'IV.a' WHEN 'IVA' THEN 'IV.a'
        WHEN '42' THEN 'IV.b' WHEN 'IV.B' THEN 'IV.b' WHEN 'IVB' THEN 'IV.b'
        ELSE NULL
      END`;

    const PDDKN_DETAIL_ORDER = ['S3','S2','S1/D.IV','D.III','D.II','D.I','SMA/SMK','SMP','SD','LAINNYA'];
    const PDDKN_GROUP_ORDER  = ['TINGGI','DIPLOMA','DSR & MNGH','LAINNYA'];
    const ESELON_SLOTS       = ['I.b','II.a','II.b','III.a','III.b','IV.a','IV.b'];
    const ESELON_GROUP_SLOTS = ['I','II','III','IV'];
    const PNS_GOLRU_DETAIL   = ['IV/e','IV/d','IV/c','IV/b','IV/a','III/d','III/c','III/b','III/a','II/d','II/c','II/b','II/a','I/d','I/c','I/b','I/a'];
    const PNS_GOLRU_GROUP    = ['IV','III','II','I'];
    const PPPK_GOLRU_ORDER   = ['XI','X','IX','VIII','VII','VI','V','LAINNYA'];
    const JENJANG_ORDER      = ['STRUKTURAL','FUNGSIONAL','PELAKSANA','PPPK'];

    return {
      toN, toJKRow,
      jkFragment, eduSubquery, pddknDetailLabel, eselonLabel,
      PDDKN_DETAIL_ORDER, PDDKN_GROUP_ORDER, ESELON_SLOTS, ESELON_GROUP_SLOTS,
      PNS_GOLRU_DETAIL, PNS_GOLRU_GROUP, PPPK_GOLRU_ORDER, JENJANG_ORDER,
      JkSqlRow: null as unknown as JkSqlRow,
      GolruJkSqlRow: null as unknown as GolruJkSqlRow,
      PddknJkSqlRow: null as unknown as PddknJkSqlRow,
      JenjangJkSqlRow: null as unknown as JenjangJkSqlRow,
      EselonJkSqlRow: null as unknown as EselonJkSqlRow,
      EselonPddknSqlRow: null as unknown as EselonPddknSqlRow,
      FungsionalJkSqlRow: null as unknown as FungsionalJkSqlRow,
    };
  }

  // ── IKHTISAR: 3 queries (allJk, pppkJk, allJenjang) ────────────────────

  async findRekapIkhtisarData(): Promise<RekapIkhtisarResponse> {
    type JkRow = { jk: string; cnt: bigint | number };
    type JenjangRow = { kategori: string; jk: string; cnt: bigint | number };
    const h = this.rekapHelpers();
    const whereSql = await this.buildRekapWhereSql();

    const [allJkRows, pppkJkRows, allJenjangRows] = await Promise.all([
      this.prisma.$queryRaw<JkRow[]>(Prisma.sql`
        SELECT ${h.jkFragment} AS jk, COUNT(*) AS cnt
        FROM asn a
        LEFT JOIN asn_siasn_profile sp ON sp.asn_id = a.id AND sp.deleted_at IS NULL
        WHERE ${whereSql}
        GROUP BY jk`),

      this.prisma.$queryRaw<JkRow[]>(Prisma.sql`
        SELECT ${h.jkFragment} AS jk, COUNT(*) AS cnt
        FROM asn a
        LEFT JOIN asn_siasn_profile sp ON sp.asn_id = a.id AND sp.deleted_at IS NULL
        WHERE ${whereSql}
          AND a.tipe_pegawai IN ('PPPK','PPPK_PARUH_WAKTU')
        GROUP BY jk`),

      this.prisma.$queryRaw<JenjangRow[]>(Prisma.sql`
        SELECT
          CASE
            WHEN UPPER(COALESCE(a.jenis_jabatan_nama,'')) LIKE '%STRUKTURAL%' THEN 'STRUKTURAL'
            WHEN UPPER(COALESCE(a.jenis_jabatan_nama,'')) LIKE '%FUNGSIONAL%' THEN 'FUNGSIONAL'
            WHEN UPPER(COALESCE(a.jenis_jabatan_nama,'')) LIKE '%PELAKSANA%' THEN 'PELAKSANA'
            WHEN a.tipe_pegawai IN ('PPPK','PPPK_PARUH_WAKTU') THEN 'PPPK'
            ELSE 'LAINNYA'
          END AS kategori,
          ${h.jkFragment} AS jk,
          COUNT(*) AS cnt
        FROM asn a
        LEFT JOIN asn_siasn_profile sp ON sp.asn_id = a.id AND sp.deleted_at IS NULL
        WHERE ${whereSql}
        GROUP BY kategori, jk`),
    ]);

    const toJkMap = (rows: JkRow[]) => {
      const m = new Map<string, number>();
      for (const r of rows) m.set(r.jk, h.toN(r.cnt));
      return m;
    };
    const allJkMap  = toJkMap(allJkRows);
    const pppkJkMap = toJkMap(pppkJkRows);
    const allJk  = h.toJKRow(
      allJkMap.get('PRIA') ?? 0,
      allJkMap.get('WANITA') ?? 0,
      allJkMap.get('LAINNYA') ?? 0,
    );
    const pppkJk = h.toJKRow(
      pppkJkMap.get('PRIA') ?? 0,
      pppkJkMap.get('WANITA') ?? 0,
      pppkJkMap.get('LAINNYA') ?? 0,
    );

    const jenjangMap = new Map<string, { pria: number; wanita: number; lainnya: number }>();
    for (const row of allJenjangRows) {
      const entry = jenjangMap.get(row.kategori) ?? { pria: 0, wanita: 0, lainnya: 0 };
      const count = h.toN(row.cnt);
      if (row.jk === 'PRIA') entry.pria += count;
      else if (row.jk === 'WANITA') entry.wanita += count;
      else entry.lainnya += count;
      jenjangMap.set(row.kategori, entry);
    }
    const toJenjangRow = (jabatan: string) => {
      const e = jenjangMap.get(jabatan) ?? { pria: 0, wanita: 0, lainnya: 0 };
      const total = e.pria + e.wanita + e.lainnya;
      return { jabatan, pria: e.pria, wanita: e.wanita, total,
        persenPria: total > 0 ? Number(((e.pria / total) * 100).toFixed(2)) : 0,
        persenWanita: total > 0 ? Number(((e.wanita / total) * 100).toFixed(2)) : 0,
      };
    };

    return {
      allJk,
      pppkJk,
      allJenjangJabatan: h.JENJANG_ORDER.map(toJenjangRow),
      pppkJenjangJabatan: [toJenjangRow('PPPK')],
    };
  }

  // ── PNS: 5 queries ───────────────────────────────────────────────────────

  async findRekapPnsData(): Promise<RekapPnsResponse> {
    type GolruRow = { golru: string; jk: string; cnt: bigint | number };
    type PddknRow = { pddkn_label: string; jk: string; cnt: bigint | number };
    type EselonJkRow = { eselon_label: string; jk: string; cnt: bigint | number };
    type EselonPddknRow = { pddkn_label: string; eselon_label: string; cnt: bigint | number };
    type StrukturalJabatanRow = { jabatan_nama: string; eselon_label: string; jk: string; cnt: bigint | number };
    type FungsionalRow = { jabatan_nama: string; ahli_terampil: string; jk: string; cnt: bigint | number };
    const h = this.rekapHelpers();
    const whereSql = await this.buildRekapWhereSql();

    const [pnsGolonganRows, pnsPendidikanRows, strukturalEselonRows, strukturalPendidikanRows, strukturalJabatanRows, fungsionalRows] =
      await Promise.all([
        this.prisma.$queryRaw<GolruRow[]>(Prisma.sql`
          SELECT
            CASE
              WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%IV/E%' THEN 'IV/e'
              WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%IV/D%' THEN 'IV/d'
              WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%IV/C%' THEN 'IV/c'
              WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%IV/B%' THEN 'IV/b'
              WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%IV/A%' THEN 'IV/a'
              WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%III/D%' THEN 'III/d'
              WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%III/C%' THEN 'III/c'
              WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%III/B%' THEN 'III/b'
              WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%III/A%' THEN 'III/a'
              WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%II/D%' THEN 'II/d'
              WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%II/C%' THEN 'II/c'
              WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%II/B%' THEN 'II/b'
              WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%II/A%' THEN 'II/a'
              WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%I/D%' THEN 'I/d'
              WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%I/C%' THEN 'I/c'
              WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%I/B%' THEN 'I/b'
              WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%I/A%' THEN 'I/a'
              ELSE 'LAINNYA'
            END AS golru,
            ${h.jkFragment} AS jk, COUNT(*) AS cnt
          FROM asn a
          LEFT JOIN asn_siasn_profile sp ON sp.asn_id = a.id AND sp.deleted_at IS NULL
          WHERE ${whereSql} AND a.tipe_pegawai = 'PNS'
          GROUP BY golru, jk`),

        this.prisma.$queryRaw<PddknRow[]>(Prisma.sql`
          SELECT ${h.pddknDetailLabel} AS pddkn_label, ${h.jkFragment} AS jk, COUNT(*) AS cnt
          FROM asn a
          LEFT JOIN asn_siasn_profile sp ON sp.asn_id = a.id AND sp.deleted_at IS NULL
          LEFT JOIN ${h.eduSubquery} ON edu.asn_id = a.id
          WHERE ${whereSql} AND a.tipe_pegawai = 'PNS'
          GROUP BY pddkn_label, jk`),

        this.prisma.$queryRaw<EselonJkRow[]>(Prisma.sql`
          SELECT ${h.eselonLabel} AS eselon_label, ${h.jkFragment} AS jk, COUNT(*) AS cnt
          FROM asn a
          LEFT JOIN asn_siasn_profile sp ON sp.asn_id = a.id AND sp.deleted_at IS NULL
          WHERE ${whereSql}
            AND a.tipe_pegawai = 'PNS'
            AND UPPER(COALESCE(a.jenis_jabatan_nama,'')) LIKE '%STRUKTURAL%'
          GROUP BY eselon_label, jk`),

        this.prisma.$queryRaw<EselonPddknRow[]>(Prisma.sql`
          SELECT ${h.pddknDetailLabel} AS pddkn_label, ${h.eselonLabel} AS eselon_label, COUNT(*) AS cnt
          FROM asn a
          LEFT JOIN asn_siasn_profile sp ON sp.asn_id = a.id AND sp.deleted_at IS NULL
          LEFT JOIN ${h.eduSubquery} ON edu.asn_id = a.id
          WHERE ${whereSql}
            AND a.tipe_pegawai = 'PNS'
            AND UPPER(COALESCE(a.jenis_jabatan_nama,'')) LIKE '%STRUKTURAL%'
          GROUP BY pddkn_label, eselon_label`),

        this.prisma.$queryRaw<StrukturalJabatanRow[]>(Prisma.sql`
          SELECT sub.jabatan_nama, sub.eselon_label, sub.jk, COUNT(*) AS cnt
          FROM (
            SELECT
              COALESCE(NULLIF(a.jabatan_nama,''), rj.nama, 'TIDAK_DIISI') AS jabatan_nama,
              ${h.eselonLabel} AS eselon_label,
              ${h.jkFragment} AS jk
            FROM asn a
            LEFT JOIN asn_siasn_profile sp ON sp.asn_id = a.id AND sp.deleted_at IS NULL
            LEFT JOIN ref_jabatan rj ON rj.id = a.jabatan_ref_id
            WHERE ${whereSql}
              AND a.tipe_pegawai = 'PNS'
              AND UPPER(COALESCE(a.jenis_jabatan_nama,'')) LIKE '%STRUKTURAL%'
          ) sub
          GROUP BY sub.jabatan_nama, sub.eselon_label, sub.jk`),

        this.prisma.$queryRaw<FungsionalRow[]>(Prisma.sql`
          SELECT sub.jabatan_nama, sub.ahli_terampil, sub.jk, COUNT(*) AS cnt
          FROM (
            SELECT
              COALESCE(NULLIF(a.jabatan_nama,''), rj.nama, 'TIDAK_DIISI') AS jabatan_nama,
              CASE
                WHEN UPPER(COALESCE(rfp.jenjang, rfp.kategori, '')) LIKE '%AHLI%'
                  OR UPPER(COALESCE(rfp.jenjang,'')) IN ('UTAMA','MADYA','MUDA','PERTAMA') THEN 'AHLI'
                ELSE 'TERAMPIL'
              END AS ahli_terampil,
              ${h.jkFragment} AS jk
            FROM asn a
            LEFT JOIN asn_siasn_profile sp ON sp.asn_id = a.id AND sp.deleted_at IS NULL
            LEFT JOIN ref_jabatan rj ON rj.id = a.jabatan_ref_id
            LEFT JOIN ref_jabatan_fungsional_profile rfp ON rfp.jabatan_id = rj.id
            WHERE ${whereSql}
              AND a.tipe_pegawai = 'PNS'
              AND UPPER(COALESCE(a.jenis_jabatan_nama,'')) LIKE '%FUNGSIONAL%'
          ) sub
          GROUP BY sub.jabatan_nama, sub.ahli_terampil, sub.jk`),
      ]);

    // Build golongan detail
    const pnsGolruMap = new Map<string, { pria: number; wanita: number; total: number }>();
    for (const row of pnsGolonganRows) {
      const e = pnsGolruMap.get(row.golru) ?? { pria: 0, wanita: 0, total: 0 };
      const count = h.toN(row.cnt);
      e.total += count;
      if (row.jk === 'PRIA') e.pria += count;
      else if (row.jk === 'WANITA') e.wanita += count;
      pnsGolruMap.set(row.golru, e);
    }
    const pnsGolonganDetail: RekapGolonganRow[] = h.PNS_GOLRU_DETAIL.map((golru) => {
      const e = pnsGolruMap.get(golru) ?? { pria: 0, wanita: 0, total: 0 };
      return { golru, pria: e.pria, wanita: e.wanita, total: e.total };
    });

    // Build golongan group
    const pnsGolruGroupMap = new Map<string, { pria: number; wanita: number; total: number }>();
    for (const row of pnsGolonganRows) {
      const g = row.golru;
      let grp = 'LAINNYA';
      if (g.startsWith('IV')) grp = 'IV';
      else if (g.startsWith('III')) grp = 'III';
      else if (g.startsWith('II/')) grp = 'II';
      else if (g.startsWith('I/')) grp = 'I';
      const e = pnsGolruGroupMap.get(grp) ?? { pria: 0, wanita: 0, total: 0 };
      const count = h.toN(row.cnt);
      e.total += count;
      if (row.jk === 'PRIA') e.pria += count;
      else if (row.jk === 'WANITA') e.wanita += count;
      pnsGolruGroupMap.set(grp, e);
    }
    const pnsGolonganGroup: RekapGolonganRow[] = h.PNS_GOLRU_GROUP.map((golru) => {
      const e = pnsGolruGroupMap.get(golru) ?? { pria: 0, wanita: 0, total: 0 };
      return { golru, pria: e.pria, wanita: e.wanita, total: e.total };
    });

    // Build pendidikan detail & group
    const pnsPddknMap = new Map<string, { pria: number; wanita: number; total: number }>();
    for (const row of pnsPendidikanRows) {
      const e = pnsPddknMap.get(row.pddkn_label) ?? { pria: 0, wanita: 0, total: 0 };
      const count = h.toN(row.cnt);
      e.total += count;
      if (row.jk === 'PRIA') e.pria += count;
      else if (row.jk === 'WANITA') e.wanita += count;
      pnsPddknMap.set(row.pddkn_label, e);
    }
    const pnsPendidikanDetail: RekapPendidikanRow[] = h.PDDKN_DETAIL_ORDER.map((pddkn) => {
      const e = pnsPddknMap.get(pddkn) ?? { pria: 0, wanita: 0, total: 0 };
      return { pddkn, pria: e.pria, wanita: e.wanita, total: e.total };
    });
    const pnsPddknGroupMap = new Map<string, { pria: number; wanita: number; total: number }>();
    for (const row of pnsPendidikanRows) {
      let grp = 'LAINNYA';
      if (['S3','S2','S1/D.IV'].includes(row.pddkn_label)) grp = 'TINGGI';
      else if (['D.III','D.II','D.I'].includes(row.pddkn_label)) grp = 'DIPLOMA';
      else if (['SMA/SMK','SMP','SD'].includes(row.pddkn_label)) grp = 'DSR & MNGH';
      const e = pnsPddknGroupMap.get(grp) ?? { pria: 0, wanita: 0, total: 0 };
      const count = h.toN(row.cnt);
      e.total += count;
      if (row.jk === 'PRIA') e.pria += count;
      else if (row.jk === 'WANITA') e.wanita += count;
      pnsPddknGroupMap.set(grp, e);
    }
    const pnsPendidikanGroup: RekapPendidikanRow[] = h.PDDKN_GROUP_ORDER.map((pddkn) => {
      const e = pnsPddknGroupMap.get(pddkn) ?? { pria: 0, wanita: 0, total: 0 };
      return { pddkn, pria: e.pria, wanita: e.wanita, total: e.total };
    });

    // Build eselon detail & group
    const eselonMap = new Map<string, { pria: number; wanita: number; total: number }>();
    for (const row of strukturalEselonRows) {
      if (!row.eselon_label) continue;
      const e = eselonMap.get(row.eselon_label) ?? { pria: 0, wanita: 0, total: 0 };
      const count = h.toN(row.cnt);
      e.total += count;
      if (row.jk === 'PRIA') e.pria += count;
      else if (row.jk === 'WANITA') e.wanita += count;
      eselonMap.set(row.eselon_label, e);
    }
    const strukturalEselonDetail: RekapStrukturalEselonRow[] = h.ESELON_SLOTS.map((eselon) => {
      const e = eselonMap.get(eselon) ?? { pria: 0, wanita: 0, total: 0 };
      return { eselon, terisi: e.total, pria: e.pria, wanita: e.wanita };
    });
    const eselonGroupMap = new Map<string, { pria: number; wanita: number; total: number }>();
    for (const row of strukturalEselonRows) {
      if (!row.eselon_label) continue;
      let grp = 'LAINNYA';
      if (row.eselon_label.startsWith('I.')) grp = 'I';
      else if (row.eselon_label.startsWith('II.')) grp = 'II';
      else if (row.eselon_label.startsWith('III.')) grp = 'III';
      else if (row.eselon_label.startsWith('IV.')) grp = 'IV';
      const e = eselonGroupMap.get(grp) ?? { pria: 0, wanita: 0, total: 0 };
      const count = h.toN(row.cnt);
      e.total += count;
      if (row.jk === 'PRIA') e.pria += count;
      else if (row.jk === 'WANITA') e.wanita += count;
      eselonGroupMap.set(grp, e);
    }
    const strukturalEselonGroup: RekapStrukturalEselonRow[] = h.ESELON_GROUP_SLOTS.map((eselon) => {
      const e = eselonGroupMap.get(eselon) ?? { pria: 0, wanita: 0, total: 0 };
      return { eselon, terisi: e.total, pria: e.pria, wanita: e.wanita };
    });

    // Build struktural pendidikan
    type EssPddknEntry = { ess1: number; ess2: number; ess3: number; ess4: number };
    const strPddknMap = new Map<string, EssPddknEntry>();
    const getEssKey = (label: string | null): keyof EssPddknEntry | null => {
      if (!label) return null;
      if (label.startsWith('I.')) return 'ess1';
      if (label.startsWith('II.')) return 'ess2';
      if (label.startsWith('III.')) return 'ess3';
      if (label.startsWith('IV.')) return 'ess4';
      return null;
    };
    for (const row of strukturalPendidikanRows) {
      const k = getEssKey(row.eselon_label);
      if (!k) continue;
      const e = strPddknMap.get(row.pddkn_label) ?? { ess1: 0, ess2: 0, ess3: 0, ess4: 0 };
      e[k] += h.toN(row.cnt);
      strPddknMap.set(row.pddkn_label, e);
    }
    const strukturalPendidikan: RekapStrukturalPendidikanRow[] = h.PDDKN_DETAIL_ORDER.map((pddkn) => {
      const e = strPddknMap.get(pddkn) ?? { ess1: 0, ess2: 0, ess3: 0, ess4: 0 };
      return { pddkn, ...e, total: e.ess1 + e.ess2 + e.ess3 + e.ess4 };
    });

    const strukturalJabatanMap = new Map<string, { namaJabatan: string; eselon: string; pria: number; wanita: number; total: number }>();
    for (const row of strukturalJabatanRows) {
      const namaJabatan = row.jabatan_nama || 'TIDAK_DIISI';
      const eselon = row.eselon_label || '-';
      const key = `${eselon}:${namaJabatan}`;
      const entry = strukturalJabatanMap.get(key) ?? { namaJabatan, eselon, pria: 0, wanita: 0, total: 0 };
      const count = h.toN(row.cnt);
      entry.total += count;
      if (row.jk === 'PRIA') entry.pria += count;
      else if (row.jk === 'WANITA') entry.wanita += count;
      strukturalJabatanMap.set(key, entry);
    }
    const strukturalJabatan: RekapStrukturalJabatanRow[] = Array.from(strukturalJabatanMap.values())
      .map((row) => ({
        namaJabatan: row.namaJabatan,
        eselon: row.eselon,
        pria: row.pria,
        wanita: row.wanita,
        jumlahTotal: row.total,
      }))
      .sort((a, b) => a.eselon.localeCompare(b.eselon) || a.namaJabatan.localeCompare(b.namaJabatan));

    // Build fungsional
    type FungsRow = { ahliPria: number; ahliWanita: number; jumlahAhli: number; terampilPria: number; terampilWanita: number; jumlahTerampil: number };
    const fungsMap = new Map<string, FungsRow>();
    for (const row of fungsionalRows) {
      const e = fungsMap.get(row.jabatan_nama) ?? { ahliPria: 0, ahliWanita: 0, jumlahAhli: 0, terampilPria: 0, terampilWanita: 0, jumlahTerampil: 0 };
      const count = h.toN(row.cnt);
      if (row.ahli_terampil === 'AHLI') {
        e.jumlahAhli += count;
        if (row.jk === 'PRIA') e.ahliPria += count;
        else if (row.jk === 'WANITA') e.ahliWanita += count;
      } else {
        e.jumlahTerampil += count;
        if (row.jk === 'PRIA') e.terampilPria += count;
        else if (row.jk === 'WANITA') e.terampilWanita += count;
      }
      fungsMap.set(row.jabatan_nama, e);
    }
    const fungsionalJabatan: RekapFungsionalRow[] = Array.from(fungsMap.entries())
      .map(([namaJabatan, e]) => ({
        namaJabatan,
        ahliPria: e.ahliPria, ahliWanita: e.ahliWanita, jumlahAhli: e.jumlahAhli,
        terampilPria: e.terampilPria, terampilWanita: e.terampilWanita, jumlahTerampil: e.jumlahTerampil,
        jumlahTotal: e.jumlahAhli + e.jumlahTerampil,
      }))
      .sort((a, b) => a.namaJabatan.localeCompare(b.namaJabatan));

    return { pnsGolonganDetail, pnsGolonganGroup, pnsPendidikanDetail, pnsPendidikanGroup, strukturalEselonDetail, strukturalEselonGroup, strukturalPendidikan, strukturalJabatan, fungsionalJabatan };
  }

  // ── PPPK: 2 queries ──────────────────────────────────────────────────────

  async findRekapPppkData(): Promise<RekapPppkResponse> {
    type GolruRow = { jenis_asn: string; golru: string; jk: string; cnt: bigint | number };
    type PddknRow = { jenis_asn: string; pddkn_label: string; jk: string; cnt: bigint | number };
    const h = this.rekapHelpers();
    const whereSql = await this.buildRekapWhereSql();

    const [pppkGolonganRows, pppkPendidikanRows] = await Promise.all([
      this.prisma.$queryRaw<GolruRow[]>(Prisma.sql`
        SELECT
          CASE WHEN a.tipe_pegawai = 'PPPK_PARUH_WAKTU' THEN 'PPPK_PARUH_WAKTU' ELSE 'PPPK' END AS jenis_asn,
          CASE
            WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%XI%' THEN 'XI'
            WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%IX%' THEN 'IX'
            WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%VIII%' THEN 'VIII'
            WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%VII%' THEN 'VII'
            WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%VI%' THEN 'VI'
            WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%X%' THEN 'X'
            WHEN UPPER(COALESCE(a.golongan_nama,'')) LIKE '%V%' THEN 'V'
            ELSE 'LAINNYA'
          END AS golru,
          ${h.jkFragment} AS jk, COUNT(*) AS cnt
        FROM asn a
        LEFT JOIN asn_siasn_profile sp ON sp.asn_id = a.id AND sp.deleted_at IS NULL
        WHERE ${whereSql}
          AND a.tipe_pegawai IN ('PPPK','PPPK_PARUH_WAKTU')
        GROUP BY jenis_asn, golru, jk`),

      this.prisma.$queryRaw<PddknRow[]>(Prisma.sql`
        SELECT
          CASE WHEN a.tipe_pegawai = 'PPPK_PARUH_WAKTU' THEN 'PPPK_PARUH_WAKTU' ELSE 'PPPK' END AS jenis_asn,
          ${h.pddknDetailLabel} AS pddkn_label,
          ${h.jkFragment} AS jk,
          COUNT(*) AS cnt
        FROM asn a
        LEFT JOIN asn_siasn_profile sp ON sp.asn_id = a.id AND sp.deleted_at IS NULL
        LEFT JOIN ${h.eduSubquery} ON edu.asn_id = a.id
        WHERE ${whereSql}
          AND a.tipe_pegawai IN ('PPPK','PPPK_PARUH_WAKTU')
        GROUP BY jenis_asn, pddkn_label, jk`),
    ]);

    const pppkGolruMap = new Map<string, { pria: number; wanita: number; total: number }>();
    for (const row of pppkGolonganRows) {
      const key = `${row.jenis_asn}:${row.golru}`;
      const e = pppkGolruMap.get(key) ?? { pria: 0, wanita: 0, total: 0 };
      const count = h.toN(row.cnt);
      e.total += count;
      if (row.jk === 'PRIA') e.pria += count;
      else if (row.jk === 'WANITA') e.wanita += count;
      pppkGolruMap.set(key, e);
    }
    const toPppkGolonganRows = (jenisAsn: string): RekapGolonganRow[] => h.PPPK_GOLRU_ORDER.map((golru) => {
      const e = pppkGolruMap.get(`${jenisAsn}:${golru}`) ?? { pria: 0, wanita: 0, total: 0 };
      return { golru, pria: e.pria, wanita: e.wanita, total: e.total };
    });
    const pppkGolongan = toPppkGolonganRows('PPPK');
    const pppkParuhWaktuGolongan = toPppkGolonganRows('PPPK_PARUH_WAKTU');

    const pppkPddknMap = new Map<string, { pria: number; wanita: number; total: number }>();
    for (const row of pppkPendidikanRows) {
      const key = `${row.jenis_asn}:${row.pddkn_label}`;
      const e = pppkPddknMap.get(key) ?? { pria: 0, wanita: 0, total: 0 };
      const count = h.toN(row.cnt);
      e.total += count;
      if (row.jk === 'PRIA') e.pria += count;
      else if (row.jk === 'WANITA') e.wanita += count;
      pppkPddknMap.set(key, e);
    }
    const toPppkPendidikanDetailRows = (jenisAsn: string): RekapPendidikanRow[] => h.PDDKN_DETAIL_ORDER.map((pddkn) => {
      const e = pppkPddknMap.get(`${jenisAsn}:${pddkn}`) ?? { pria: 0, wanita: 0, total: 0 };
      return { pddkn, pria: e.pria, wanita: e.wanita, total: e.total };
    });
    const pppkPendidikanDetail = toPppkPendidikanDetailRows('PPPK');
    const pppkParuhWaktuPendidikanDetail = toPppkPendidikanDetailRows('PPPK_PARUH_WAKTU');

    const pppkPddknGroupMap = new Map<string, { pria: number; wanita: number; total: number }>();
    for (const row of pppkPendidikanRows) {
      let grp = 'LAINNYA';
      if (['S3','S2','S1/D.IV'].includes(row.pddkn_label)) grp = 'TINGGI';
      else if (['D.III','D.II','D.I'].includes(row.pddkn_label)) grp = 'DIPLOMA';
      else if (['SMA/SMK','SMP','SD'].includes(row.pddkn_label)) grp = 'DSR & MNGH';
      const key = `${row.jenis_asn}:${grp}`;
      const e = pppkPddknGroupMap.get(key) ?? { pria: 0, wanita: 0, total: 0 };
      const count = h.toN(row.cnt);
      e.total += count;
      if (row.jk === 'PRIA') e.pria += count;
      else if (row.jk === 'WANITA') e.wanita += count;
      pppkPddknGroupMap.set(key, e);
    }
    const toPppkPendidikanGroupRows = (jenisAsn: string): RekapPendidikanRow[] => h.PDDKN_GROUP_ORDER.map((pddkn) => {
      const e = pppkPddknGroupMap.get(`${jenisAsn}:${pddkn}`) ?? { pria: 0, wanita: 0, total: 0 };
      return { pddkn, pria: e.pria, wanita: e.wanita, total: e.total };
    });
    const pppkPendidikanGroup = toPppkPendidikanGroupRows('PPPK');
    const pppkParuhWaktuPendidikanGroup = toPppkPendidikanGroupRows('PPPK_PARUH_WAKTU');

    return {
      pppkGolongan,
      pppkPendidikanDetail,
      pppkPendidikanGroup,
      pppkParuhWaktuGolongan,
      pppkParuhWaktuPendidikanDetail,
      pppkParuhWaktuPendidikanGroup,
    };
  }
}
