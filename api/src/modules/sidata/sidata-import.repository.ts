import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  CommitGenericReferenceResult,
  CommitReferenceJabatanResult,
  CommitSiasnAsnBatchResult,
  MapSiasnAsnBatchResult,
  NormalizedSidataImportIssueQuery,
  PaginatedImportIssuesResponse,
  SIDATA_ASN_COMMIT_ACTION,
  SIDATA_ASN_MAP_STATUS,
  SIDATA_COMMIT_ACTION,
  SIDATA_IMPORT_AUDIT_ACTION,
  SIDATA_IMPORT_STATUS,
  SIDATA_MAPPING_STATUS,
  SIDATA_VALIDATION_STATUS,
  SidataAsnMappedData,
  SidataImportAuditPayload,
  SidataImportSummaryResponse,
  SiasnAsnMappedDataForCommit,
  ValidatedReferenceJabatanRow,
  ValidatedSiasnAsnRow,
} from './sidata-import.types';

const importBatchSelect = {
  id: true,
  source: true,
  importType: true,
  fileName: true,
  status: true,
  totalRows: true,
  validRows: true,
  invalidRows: true,
  duplicateRows: true,
  warningRows: true,
  importedById: true,
  startedAt: true,
  finishedAt: true,
  errorMessage: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SidataReferenceImportBatchSelect;

const importStagingSelect = {
  id: true,
  batchId: true,
  rowNumber: true,
  referenceType: true,
  sourceCode: true,
  sourceName: true,
  sourceDescription: true,
  targetTable: true,
  targetId: true,
  mappingStatus: true,
  validationStatus: true,
  validationErrors: true,
  rawData: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SidataReferenceImportStagingSelect;

const jenisJabatanSelect = {
  id: true,
  kode: true,
  nama: true,
  isActive: true,
} satisfies Prisma.RefJenisJabatanSelect;

const jabatanSelect = {
  id: true,
  jenisJabatanId: true,
  kode: true,
  nama: true,
  namaNormalized: true,
  siasnId: true,
  siasnKode: true,
  siasnNama: true,
  source: true,
  isActive: true,
  deletedAt: true,
} satisfies Prisma.RefJabatanSelect;

const simpleIdSelect = { id: true } as const;

export type SidataReferenceImportBatchRecord =
  Prisma.SidataReferenceImportBatchGetPayload<{
    select: typeof importBatchSelect;
  }>;

export type SidataReferenceImportStagingRecord =
  Prisma.SidataReferenceImportStagingGetPayload<{
    select: typeof importStagingSelect;
  }>;

export type RefJenisJabatanRecord = Prisma.RefJenisJabatanGetPayload<{
  select: typeof jenisJabatanSelect;
}>;

export type RefJabatanRecord = Prisma.RefJabatanGetPayload<{
  select: typeof jabatanSelect;
}>;

// ─── Phase 5: ASN Import Selects & Types ─────────────────────────────────────

const asnImportBatchSelect = {
  id: true,
  source: true,
  importType: true,
  fileName: true,
  status: true,
  totalRows: true,
  validRows: true,
  invalidRows: true,
  duplicateRows: true,
  warningRows: true,
  importedById: true,
  startedAt: true,
  finishedAt: true,
  errorMessage: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SidataAsnImportBatchSelect;

const asnImportStagingSelect = {
  id: true,
  batchId: true,
  rowNumber: true,
  nip: true,
  nipLama: true,
  nama: true,
  namaJabatan: true,
  jenisJabatan: true,
  kdJabatan: true,
  kdJabatanSiasn: true,
  tmtJabatan: true,
  namaGolongan: true,
  namaRuang: true,
  kdGolongan: true,
  kdGolonganSiasn: true,
  tmtGolongan: true,
  masaKerjaGolongan: true,
  masaKerjaSeluruh: true,
  namaUnorEselon1: true,
  namaUnorEselon2: true,
  namaUnorEselon3: true,
  namaUnorEselon4: true,
  kdUnor: true,
  tempatLahir: true,
  tanggalLahir: true,
  jenisKelamin: true,
  agama: true,
  statusKawin: true,
  pendidikanTerakhir: true,
  namaSekolah: true,
  tmtPns: true,
  tmtPensiun: true,
  statusKepegawaian: true,
  jenisAsn: true,
  kedudukanHukum: true,
  noSk: true,
  tanggalSk: true,
  validationStatus: true,
  validationErrors: true,
  mappingStatus: true,
  matchedAsnId: true,
  rawData: true,
  mappedData: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SidataAsnImportStagingSelect;

export type SidataAsnImportBatchRecord = Prisma.SidataAsnImportBatchGetPayload<{
  select: typeof asnImportBatchSelect;
}>;

export type SidataAsnImportStagingRecord = Prisma.SidataAsnImportStagingGetPayload<{
  select: typeof asnImportStagingSelect;
}>;

const importAuditLogSelect = {
  id: true,
  batchId: true,
  batchType: true,
  action: true,
  actorId: true,
  metadata: true,
  createdAt: true,
} satisfies Prisma.SidataImportAuditLogSelect;

export type SidataImportAuditLogRecord = Prisma.SidataImportAuditLogGetPayload<{
  select: typeof importAuditLogSelect;
}>;

@Injectable()
export class SidataImportRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findBatches(): Promise<SidataReferenceImportBatchRecord[]> {
    return this.prisma.sidataReferenceImportBatch.findMany({
      orderBy: { createdAt: 'desc' },
      select: importBatchSelect,
    });
  }

  async findBatchById(id: string): Promise<SidataReferenceImportBatchRecord | null> {
    return this.prisma.sidataReferenceImportBatch.findUnique({
      where: { id },
      select: importBatchSelect,
    });
  }

  async findStagingByBatchId(
    batchId: string,
  ): Promise<SidataReferenceImportStagingRecord[]> {
    return this.prisma.sidataReferenceImportStaging.findMany({
      where: { batchId },
      orderBy: { rowNumber: 'asc' },
      select: importStagingSelect,
    });
  }

  async createReferenceBatch(params: {
    source: string;
    importType: string;
    fileName: string;
    totalRows: number;
    validRows: number;
    invalidRows: number;
    duplicateRows: number;
    warningRows: number;
    importedById?: string | null;
  }): Promise<SidataReferenceImportBatchRecord> {
    return this.prisma.sidataReferenceImportBatch.create({
      data: {
        id: randomUUID(),
        source: params.source,
        importType: params.importType,
        fileName: params.fileName,
        status: SIDATA_IMPORT_STATUS.VALIDATED,
        totalRows: params.totalRows,
        validRows: params.validRows,
        invalidRows: params.invalidRows,
        duplicateRows: params.duplicateRows,
        warningRows: params.warningRows,
        importedById: params.importedById ?? null,
        startedAt: new Date(),
        finishedAt: new Date(),
      },
      select: importBatchSelect,
    });
  }

  async createReferenceStagingRows(params: {
    batchId: string;
    referenceType: string;
    rows: ValidatedReferenceJabatanRow[];
  }): Promise<{ count: number }> {
    if (params.rows.length === 0) {
      return { count: 0 };
    }

    return this.prisma.sidataReferenceImportStaging.createMany({
      data: params.rows.map((row) => ({
        id: randomUUID(),
        batchId: params.batchId,
        rowNumber: row.rowNumber,
        referenceType: params.referenceType,
        sourceCode: row.sourceCode,
        sourceName: row.sourceName ?? '',
        sourceDescription: row.sourceDescription,
        targetTable: 'ref_jabatan',
        targetId: null,
        mappingStatus: row.isDuplicate
          ? SIDATA_MAPPING_STATUS.NEEDS_REVIEW
          : SIDATA_MAPPING_STATUS.UNMAPPED,
        validationStatus: row.validationStatus,
        validationErrors: row.validationErrors as Prisma.InputJsonValue,
        rawData: row.rawData as Prisma.InputJsonValue,
      })),
    });
  }

  async markBatchFailed(params: {
    batchId: string;
    errorMessage: string;
  }): Promise<SidataReferenceImportBatchRecord> {
    return this.prisma.sidataReferenceImportBatch.update({
      where: { id: params.batchId },
      data: {
        status: SIDATA_IMPORT_STATUS.FAILED,
        errorMessage: params.errorMessage,
        finishedAt: new Date(),
      },
      select: importBatchSelect,
    });
  }

  async findJenisJabatanByKode(kode: string): Promise<RefJenisJabatanRecord | null> {
    return this.prisma.refJenisJabatan.findFirst({
      where: { kode, deletedAt: null },
      select: jenisJabatanSelect,
    });
  }

  async commitReferenceJabatanBatch(params: {
    batchId: string;
    jenisJabatanId: string;
  }): Promise<CommitReferenceJabatanResult> {
    return this.prisma.$transaction(async (tx) => {
      const batch = await tx.sidataReferenceImportBatch.findUnique({
        where: { id: params.batchId },
        select: importBatchSelect,
      });

      if (!batch) {
        throw new Error('BATCH_NOT_FOUND');
      }

      const stagingRows = await tx.sidataReferenceImportStaging.findMany({
        where: { batchId: params.batchId },
        orderBy: { rowNumber: 'asc' },
        select: importStagingSelect,
      });

      let committedRows = 0;
      let skippedRows = 0;
      let createdRows = 0;
      let updatedRows = 0;
      let invalidRows = 0;
      let mappedRows = 0;

      for (const row of stagingRows) {
        const sourceName = row.sourceName?.trim() ?? '';
        const sourceCode = row.sourceCode?.trim() || null;
        const namaNormalized = this.normalizeText(sourceName);

        if (row.validationStatus === SIDATA_VALIDATION_STATUS.INVALID || !sourceName) {
          invalidRows += 1;
          skippedRows += 1;
          continue;
        }

        const existing = await this.findExistingJabatanInTx(tx, {
          jenisJabatanId: params.jenisJabatanId,
          sourceCode,
          namaNormalized,
        });

        let jabatan: RefJabatanRecord;
        let action: 'CREATED' | 'UPDATED';

        if (existing) {
          jabatan = await tx.refJabatan.update({
            where: { id: existing.id },
            data: {
              kode: sourceCode,
              nama: sourceName,
              namaNormalized,
              siasnKode: sourceCode,
              siasnNama: sourceName,
              source: 'SIASN',
              isActive: true,
              deletedAt: null,
            },
            select: jabatanSelect,
          });
          action = SIDATA_COMMIT_ACTION.UPDATED;
          updatedRows += 1;
        } else {
          jabatan = await tx.refJabatan.create({
            data: {
              id: randomUUID(),
              jenisJabatanId: params.jenisJabatanId,
              kode: sourceCode,
              nama: sourceName,
              namaNormalized,
              siasnKode: sourceCode,
              siasnNama: sourceName,
              source: 'SIASN',
              isActive: true,
            },
            select: jabatanSelect,
          });
          action = SIDATA_COMMIT_ACTION.CREATED;
          createdRows += 1;
        }

        await tx.sidataReferenceImportStaging.update({
          where: { id: row.id },
          data: {
            targetTable: 'ref_jabatan',
            targetId: jabatan.id,
            mappingStatus: SIDATA_MAPPING_STATUS.MAPPED,
          },
        });

        await this.upsertReferenceMappingInTx(tx, {
          sourceType: row.referenceType,
          sourceCode,
          sourceName,
          targetTable: 'ref_jabatan',
          targetId: jabatan.id,
          mappingStatus: SIDATA_MAPPING_STATUS.MAPPED,
          note: `Commit ${action} dari batch ${params.batchId}`,
        });

        committedRows += 1;
        mappedRows += 1;
      }

      await tx.sidataReferenceImportBatch.update({
        where: { id: params.batchId },
        data: {
          status: SIDATA_IMPORT_STATUS.COMMITTED,
          finishedAt: new Date(),
          errorMessage: null,
        },
      });

      return {
        batchId: params.batchId,
        status: SIDATA_IMPORT_STATUS.COMMITTED,
        totalRows: stagingRows.length,
        committedRows,
        skippedRows,
        createdRows,
        updatedRows,
        invalidRows,
        mappedRows,
      };
    });
  }

  private async findExistingJabatanInTx(
    tx: Prisma.TransactionClient,
    params: {
      jenisJabatanId: string;
      sourceCode: string | null;
      namaNormalized: string;
    },
  ): Promise<RefJabatanRecord | null> {
    if (params.sourceCode) {
      const bySiasnCode = await tx.refJabatan.findFirst({
        where: {
          jenisJabatanId: params.jenisJabatanId,
          siasnKode: params.sourceCode,
        },
        select: jabatanSelect,
      });

      if (bySiasnCode) return bySiasnCode;

      const byKode = await tx.refJabatan.findFirst({
        where: {
          jenisJabatanId: params.jenisJabatanId,
          kode: params.sourceCode,
        },
        select: jabatanSelect,
      });

      if (byKode) return byKode;
    }

    return tx.refJabatan.findFirst({
      where: {
        jenisJabatanId: params.jenisJabatanId,
        namaNormalized: params.namaNormalized,
      },
      select: jabatanSelect,
    });
  }

  private async upsertReferenceMappingInTx(
    tx: Prisma.TransactionClient,
    params: {
      sourceType: string;
      sourceCode: string | null;
      sourceName: string;
      targetTable: string;
      targetId: string;
      mappingStatus: string;
      note: string;
    },
  ) {
    const existingMapping = await tx.sidataReferenceMapping.findFirst({
      where: {
        sourceType: params.sourceType,
        sourceCode: params.sourceCode,
        sourceName: params.sourceName,
        targetTable: params.targetTable,
      },
      select: { id: true },
    });

    if (existingMapping) {
      await tx.sidataReferenceMapping.update({
        where: { id: existingMapping.id },
        data: {
          targetId: params.targetId,
          mappingStatus: params.mappingStatus,
          confidenceScore: 1,
          note: params.note,
        },
      });
      return;
    }

    await tx.sidataReferenceMapping.create({
      data: {
        id: randomUUID(),
        sourceType: params.sourceType,
        sourceCode: params.sourceCode,
        sourceName: params.sourceName,
        targetTable: params.targetTable,
        targetId: params.targetId,
        mappingStatus: params.mappingStatus,
        confidenceScore: 1,
        note: params.note,
      },
    });
  }

  async createGenericReferenceBatch(params: {
    source: string;
    importType: string;
    fileName: string;
    totalRows: number;
    validRows: number;
    invalidRows: number;
    duplicateRows: number;
    warningRows: number;
    importedById?: string | null;
  }): Promise<SidataReferenceImportBatchRecord> {
    return this.prisma.sidataReferenceImportBatch.create({
      data: {
        id: randomUUID(),
        source: params.source,
        importType: params.importType,
        fileName: params.fileName,
        status: SIDATA_IMPORT_STATUS.VALIDATED,
        totalRows: params.totalRows,
        validRows: params.validRows,
        invalidRows: params.invalidRows,
        duplicateRows: params.duplicateRows,
        warningRows: params.warningRows,
        importedById: params.importedById ?? null,
        startedAt: new Date(),
        finishedAt: new Date(),
      },
      select: importBatchSelect,
    });
  }

  async createGenericReferenceStagingRows(params: {
    batchId: string;
    referenceType: string;
    targetTable: string;
    rows: ValidatedReferenceJabatanRow[];
  }): Promise<{ count: number }> {
    if (params.rows.length === 0) return { count: 0 };

    return this.prisma.sidataReferenceImportStaging.createMany({
      data: params.rows.map((row) => ({
        id: randomUUID(),
        batchId: params.batchId,
        rowNumber: row.rowNumber,
        referenceType: params.referenceType,
        sourceCode: row.sourceCode,
        sourceName: row.sourceName ?? '',
        sourceDescription: row.sourceDescription,
        targetTable: params.targetTable,
        targetId: null,
        mappingStatus: row.isDuplicate
          ? SIDATA_MAPPING_STATUS.NEEDS_REVIEW
          : SIDATA_MAPPING_STATUS.UNMAPPED,
        validationStatus: row.validationStatus,
        validationErrors: row.validationErrors as Prisma.InputJsonValue,
        rawData: row.rawData as Prisma.InputJsonValue,
      })),
    });
  }

  async commitGenericReferenceBatch(params: {
    batchId: string;
    targetTable: string;
  }): Promise<CommitGenericReferenceResult> {
    return this.prisma.$transaction(async (tx) => {
      const batch = await tx.sidataReferenceImportBatch.findUnique({
        where: { id: params.batchId },
        select: importBatchSelect,
      });

      if (!batch) throw new Error('BATCH_NOT_FOUND');

      const stagingRows = await tx.sidataReferenceImportStaging.findMany({
        where: { batchId: params.batchId },
        orderBy: { rowNumber: 'asc' },
        select: importStagingSelect,
      });

      let committedRows = 0;
      let skippedRows = 0;
      let createdRows = 0;
      let updatedRows = 0;
      let invalidRows = 0;
      let mappedRows = 0;

      for (const row of stagingRows) {
        const sourceName = row.sourceName?.trim() ?? '';
        const sourceCode = row.sourceCode?.trim() || null;

        if (row.validationStatus === SIDATA_VALIDATION_STATUS.INVALID || !sourceName) {
          invalidRows += 1;
          skippedRows += 1;
          continue;
        }

        const result = await this.upsertGenericReferenceInTx(tx, {
          targetTable: params.targetTable,
          sourceCode,
          sourceName,
          sourceDescription: row.sourceDescription,
        });

        await tx.sidataReferenceImportStaging.update({
          where: { id: row.id },
          data: {
            targetTable: params.targetTable,
            targetId: result.id,
            mappingStatus: SIDATA_MAPPING_STATUS.MAPPED,
          },
        });

        await this.upsertReferenceMappingInTx(tx, {
          sourceType: row.referenceType,
          sourceCode,
          sourceName,
          targetTable: params.targetTable,
          targetId: result.id,
          mappingStatus: SIDATA_MAPPING_STATUS.MAPPED,
          note: `Commit ${result.action} dari batch ${params.batchId}`,
        });

        committedRows += 1;
        mappedRows += 1;

        if (result.action === SIDATA_COMMIT_ACTION.CREATED) createdRows += 1;
        else updatedRows += 1;
      }

      await tx.sidataReferenceImportBatch.update({
        where: { id: params.batchId },
        data: { status: SIDATA_IMPORT_STATUS.COMMITTED, finishedAt: new Date(), errorMessage: null },
      });

      return {
        batchId: params.batchId,
        status: SIDATA_IMPORT_STATUS.COMMITTED,
        targetTable: params.targetTable,
        totalRows: stagingRows.length,
        committedRows,
        skippedRows,
        createdRows,
        updatedRows,
        invalidRows,
        mappedRows,
      };
    });
  }

  private async upsertGenericReferenceInTx(
    tx: Prisma.TransactionClient,
    params: {
      targetTable: string;
      sourceCode: string | null;
      sourceName: string;
      sourceDescription: string | null;
    },
  ): Promise<{ id: string; action: 'CREATED' | 'UPDATED' }> {
    if (params.targetTable === 'ref_unit_organisasi') {
      return this.upsertUnitKerjaInTx(tx, params);
    }
    if (params.targetTable === 'ref_golongan') {
      return this.upsertSimpleRefInTx(tx, 'refGolongan', params);
    }
    if (params.targetTable === 'ref_pangkat') {
      return this.upsertSimpleRefInTx(tx, 'refPangkat', params);
    }
    if (params.targetTable === 'ref_pendidikan') {
      return this.upsertSimpleRefInTx(tx, 'refPendidikan', params);
    }
    if (params.targetTable === 'ref_agama') {
      return this.upsertSimpleRefInTx(tx, 'refAgama', params);
    }
    if (params.targetTable === 'ref_jenis_kelamin') {
      return this.upsertSimpleRefInTx(tx, 'refJenisKelamin', params);
    }
    if (params.targetTable === 'ref_status_kawin') {
      return this.upsertSimpleRefInTx(tx, 'refStatusKawin', params);
    }
    if (params.targetTable === 'ref_kedudukan_hukum') {
      return this.upsertSimpleRefInTx(tx, 'refKedudukanHukum', params);
    }
    if (params.targetTable === 'ref_jenis_asn') {
      return this.upsertSimpleRefInTx(tx, 'refJenisAsn', params);
    }

    throw new Error(`Unsupported target table: ${params.targetTable}`);
  }

  private async upsertUnitKerjaInTx(
    tx: Prisma.TransactionClient,
    params: { sourceCode: string | null; sourceName: string; sourceDescription: string | null },
  ): Promise<{ id: string; action: 'CREATED' | 'UPDATED' }> {
    const orClauses: Prisma.UnitKerjaWhereInput[] = [];
    if (params.sourceCode) orClauses.push({ kode: params.sourceCode });
    orClauses.push({ nama: params.sourceName });

    const existing = await tx.unitKerja.findFirst({
      where: { OR: orClauses, deletedAt: null },
      select: { id: true },
    });

    if (existing) {
      await tx.unitKerja.update({
        where: { id: existing.id },
        data: { nama: params.sourceName, isActive: true },
      });
      return { id: existing.id, action: SIDATA_COMMIT_ACTION.UPDATED };
    }

    const created = await tx.unitKerja.create({
      data: {
        id: randomUUID(),
        kode: params.sourceCode ?? randomUUID(),
        nama: params.sourceName,
        level: 1,
        isActive: true,
      },
      select: { id: true },
    });

    return { id: created.id, action: SIDATA_COMMIT_ACTION.CREATED };
  }

  private async upsertSimpleRefInTx(
    tx: Prisma.TransactionClient,
    model:
      | 'refGolongan'
      | 'refPangkat'
      | 'refPendidikan'
      | 'refAgama'
      | 'refJenisKelamin'
      | 'refStatusKawin'
      | 'refKedudukanHukum'
      | 'refJenisAsn',
    params: { sourceCode: string | null; sourceName: string; sourceDescription: string | null },
  ): Promise<{ id: string; action: 'CREATED' | 'UPDATED' }> {
    const delegate = (tx[model] as unknown) as {
      findFirst: (args: { where: { OR: { kode?: string; nama?: string }[] }; select: { id: true } }) => Promise<{ id: string } | null>;
      update: (args: { where: { id: string }; data: { kode?: string | null; nama: string; isActive: boolean }; select: { id: true } }) => Promise<{ id: string }>;
      create: (args: { data: { id: string; kode: string | null; nama: string; isActive: boolean }; select: { id: true } }) => Promise<{ id: string }>;
    };

    const orClauses: { kode?: string; nama?: string }[] = [];
    if (params.sourceCode) orClauses.push({ kode: params.sourceCode });
    orClauses.push({ nama: params.sourceName });

    const existing = await delegate.findFirst({
      where: { OR: orClauses },
      select: { id: true },
    });

    if (existing) {
      const updated = await delegate.update({
        where: { id: existing.id },
        data: { kode: params.sourceCode, nama: params.sourceName, isActive: true },
        select: { id: true },
      });
      return { id: updated.id, action: SIDATA_COMMIT_ACTION.UPDATED };
    }

    const created = await delegate.create({
      data: { id: randomUUID(), kode: params.sourceCode, nama: params.sourceName, isActive: true },
      select: { id: true },
    });

    return { id: created.id, action: SIDATA_COMMIT_ACTION.CREATED };
  }

  private normalizeText(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private toStringArray(value: unknown): string[] {
    if (!value || !Array.isArray(value)) return [];
    return (value as unknown[])
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private normalizeJenisJabatanKode(
    kode: string | null,
    nama: string | null,
  ): string | null {
    const raw = `${kode ?? ''} ${nama ?? ''}`.trim().toUpperCase();
    if (!raw) return null;
    if (
      raw.includes('STRUKTURAL') ||
      raw.includes('JPT') ||
      raw.includes('ADMINISTRATOR') ||
      raw.includes('PENGAWAS')
    ) {
      return 'STRUKTURAL';
    }
    if (raw.includes('FUNGSIONAL')) return 'FUNGSIONAL';
    if (raw.includes('PELAKSANA')) return 'PELAKSANA';
    return null;
  }

  // ─── Phase 5: ASN Import Methods ─────────────────────────────────────────────

  async findAsnImportBatches(): Promise<SidataAsnImportBatchRecord[]> {
    return this.prisma.sidataAsnImportBatch.findMany({
      orderBy: { createdAt: 'desc' },
      select: asnImportBatchSelect,
    });
  }

  async findAsnImportBatchById(id: string): Promise<SidataAsnImportBatchRecord | null> {
    return this.prisma.sidataAsnImportBatch.findUnique({
      where: { id },
      select: asnImportBatchSelect,
    });
  }

  async findAsnStagingByBatchId(batchId: string): Promise<SidataAsnImportStagingRecord[]> {
    return this.prisma.sidataAsnImportStaging.findMany({
      where: { batchId },
      orderBy: { rowNumber: 'asc' },
      select: asnImportStagingSelect,
    });
  }

  async createAsnImportBatch(params: {
    source: string;
    importType: string;
    fileName: string;
    totalRows: number;
    validRows: number;
    invalidRows: number;
    duplicateRows: number;
    warningRows: number;
    importedById?: string | null;
  }): Promise<SidataAsnImportBatchRecord> {
    return this.prisma.sidataAsnImportBatch.create({
      data: {
        id: randomUUID(),
        source: params.source,
        importType: params.importType,
        fileName: params.fileName,
        status: SIDATA_IMPORT_STATUS.VALIDATED,
        totalRows: params.totalRows,
        validRows: params.validRows,
        invalidRows: params.invalidRows,
        duplicateRows: params.duplicateRows,
        warningRows: params.warningRows,
        importedById: params.importedById ?? null,
        startedAt: new Date(),
        finishedAt: new Date(),
      },
      select: asnImportBatchSelect,
    });
  }

  async createAsnStagingRows(params: {
    batchId: string;
    rows: ValidatedSiasnAsnRow[];
  }): Promise<{ count: number }> {
    if (params.rows.length === 0) return { count: 0 };

    return this.prisma.sidataAsnImportStaging.createMany({
      data: params.rows.map((row) => ({
        id: randomUUID(),
        batchId: params.batchId,
        rowNumber: row.rowNumber,
        nip: row.nip,
        nipLama: row.nipLama,
        nama: row.nama,
        namaJabatan: row.namaJabatan,
        jenisJabatan: row.jenisJabatan,
        kdJabatan: row.kdJabatan,
        kdJabatanSiasn: row.kdJabatanSiasn,
        tmtJabatan: row.tmtJabatan,
        namaGolongan: row.namaGolongan,
        namaRuang: row.namaRuang,
        kdGolongan: row.kdGolongan,
        kdGolonganSiasn: row.kdGolonganSiasn,
        tmtGolongan: row.tmtGolongan,
        masaKerjaGolongan: row.masaKerjaGolongan,
        masaKerjaSeluruh: row.masaKerjaSeluruh,
        namaUnorEselon1: row.namaUnorEselon1,
        namaUnorEselon2: row.namaUnorEselon2,
        namaUnorEselon3: row.namaUnorEselon3,
        namaUnorEselon4: row.namaUnorEselon4,
        kdUnor: row.kdUnor,
        tempatLahir: row.tempatLahir,
        tanggalLahir: row.tanggalLahir,
        jenisKelamin: row.jenisKelamin,
        agama: row.agama,
        statusKawin: row.statusKawin,
        pendidikanTerakhir: row.pendidikanTerakhir,
        namaSekolah: row.namaSekolah,
        tmtPns: row.tmtPns,
        tmtPensiun: row.tmtPensiun,
        statusKepegawaian: row.statusKepegawaian,
        jenisAsn: row.jenisAsn,
        kedudukanHukum: row.kedudukanHukum,
        noSk: row.noSk,
        tanggalSk: row.tanggalSk,
        validationStatus: row.validationStatus,
        validationErrors: row.validationErrors as Prisma.InputJsonValue,
        mappingStatus: row.isDuplicate
          ? SIDATA_MAPPING_STATUS.NEEDS_REVIEW
          : SIDATA_MAPPING_STATUS.UNMAPPED,
        matchedAsnId: null,
        rawData: row.rawData as Prisma.InputJsonValue,
        mappedData: Prisma.JsonNull,
      })),
    });
  }

  // ─── Phase 8: Audit & Review ──────────────────────────────────────────────────

  async createImportAuditLog(
    payload: SidataImportAuditPayload,
  ): Promise<SidataImportAuditLogRecord> {
    return this.prisma.sidataImportAuditLog.create({
      data: {
        id: randomUUID(),
        batchId: payload.batchId,
        batchType: payload.batchType,
        action: payload.action,
        actorId: payload.actorId ?? null,
        metadata: payload.metadata
          ? (payload.metadata as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
      select: importAuditLogSelect,
    });
  }

  async getAsnImportBatchSummary(
    batchId: string,
  ): Promise<SidataImportSummaryResponse | null> {
    const batch = await this.prisma.sidataAsnImportBatch.findUnique({
      where: { id: batchId },
      select: asnImportBatchSelect,
    });

    if (!batch) return null;

    const grouped = await this.prisma.sidataAsnImportStaging.groupBy({
      by: ['mappingStatus', 'validationStatus'],
      where: { batchId },
      _count: { id: true },
    });

    const mappedRows = grouped
      .filter((item) => item.mappingStatus === SIDATA_ASN_MAP_STATUS.MAPPED)
      .reduce((sum, item) => sum + item._count.id, 0);

    const needsReviewRows = grouped
      .filter((item) => item.mappingStatus === SIDATA_ASN_MAP_STATUS.NEEDS_REVIEW)
      .reduce((sum, item) => sum + item._count.id, 0);

    const unmappedRows = grouped
      .filter((item) => item.mappingStatus === SIDATA_ASN_MAP_STATUS.UNMAPPED)
      .reduce((sum, item) => sum + item._count.id, 0);

    const committedRows = await this.prisma.sidataAsnImportStaging.count({
      where: { batchId, mappingStatus: SIDATA_ASN_MAP_STATUS.MAPPED, matchedAsnId: { not: null } },
    });

    const existingAsnRows = await this.prisma.sidataAsnImportStaging.count({
      where: { batchId, matchedAsnId: { not: null } },
    });

    return {
      batchId: batch.id,
      batchType: 'ASN',
      source: batch.source,
      importType: batch.importType,
      fileName: batch.fileName,
      status: batch.status,
      totalRows: batch.totalRows,
      validRows: batch.validRows,
      invalidRows: batch.invalidRows,
      duplicateRows: batch.duplicateRows,
      warningRows: batch.warningRows,
      mappedRows,
      needsReviewRows,
      unmappedRows,
      committedRows,
      existingAsnRows,
      createdAt: batch.createdAt.toISOString(),
      updatedAt: batch.updatedAt.toISOString(),
    };
  }

  async getReferenceImportBatchSummary(
    batchId: string,
  ): Promise<SidataImportSummaryResponse | null> {
    const batch = await this.prisma.sidataReferenceImportBatch.findUnique({
      where: { id: batchId },
      select: importBatchSelect,
    });

    if (!batch) return null;

    const grouped = await this.prisma.sidataReferenceImportStaging.groupBy({
      by: ['mappingStatus', 'validationStatus'],
      where: { batchId },
      _count: { id: true },
    });

    const mappedRows = grouped
      .filter((item) => item.mappingStatus === SIDATA_MAPPING_STATUS.MAPPED)
      .reduce((sum, item) => sum + item._count.id, 0);

    const needsReviewRows = grouped
      .filter((item) => item.mappingStatus === SIDATA_MAPPING_STATUS.NEEDS_REVIEW)
      .reduce((sum, item) => sum + item._count.id, 0);

    const unmappedRows = grouped
      .filter((item) => item.mappingStatus === SIDATA_MAPPING_STATUS.UNMAPPED)
      .reduce((sum, item) => sum + item._count.id, 0);

    const committedRows = await this.prisma.sidataReferenceImportStaging.count({
      where: { batchId, mappingStatus: SIDATA_MAPPING_STATUS.MAPPED, targetId: { not: null } },
    });

    return {
      batchId: batch.id,
      batchType: 'REFERENCE',
      source: batch.source,
      importType: batch.importType,
      fileName: batch.fileName,
      status: batch.status,
      totalRows: batch.totalRows,
      validRows: batch.validRows,
      invalidRows: batch.invalidRows,
      duplicateRows: batch.duplicateRows,
      warningRows: batch.warningRows,
      mappedRows,
      needsReviewRows,
      unmappedRows,
      committedRows,
      createdAt: batch.createdAt.toISOString(),
      updatedAt: batch.updatedAt.toISOString(),
    };
  }

  async findAsnImportIssues(params: {
    batchId: string;
    query: NormalizedSidataImportIssueQuery;
  }): Promise<PaginatedImportIssuesResponse> {
    const skip = (params.query.page - 1) * params.query.limit;

    const where: Prisma.SidataAsnImportStagingWhereInput = {
      batchId: params.batchId,
    };

    if (params.query.status === 'NEEDS_REVIEW') {
      where.mappingStatus = SIDATA_ASN_MAP_STATUS.NEEDS_REVIEW;
    } else if (params.query.status === 'INVALID') {
      where.validationStatus = SIDATA_VALIDATION_STATUS.INVALID;
    } else if (params.query.status === 'UNMAPPED') {
      where.mappingStatus = SIDATA_ASN_MAP_STATUS.UNMAPPED;
    } else {
      where.OR = [
        { mappingStatus: SIDATA_ASN_MAP_STATUS.NEEDS_REVIEW },
        { mappingStatus: SIDATA_ASN_MAP_STATUS.UNMAPPED },
        { validationStatus: SIDATA_VALIDATION_STATUS.INVALID },
      ];
    }

    if (params.query.q) {
      const q = params.query.q;
      where.AND = [
        {
          OR: [
            { nip: { contains: q } },
            { nama: { contains: q } },
            { namaJabatan: { contains: q } },
            { namaUnorEselon1: { contains: q } },
            { namaGolongan: { contains: q } },
          ],
        },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.sidataAsnImportStaging.findMany({
        where,
        orderBy: [{ rowNumber: 'asc' }],
        skip,
        take: params.query.limit,
        select: asnImportStagingSelect,
      }),
      this.prisma.sidataAsnImportStaging.count({ where }),
    ]);

    return {
      items: items.map((row) => ({
        id: row.id,
        rowNumber: row.rowNumber,
        nip: row.nip,
        nama: row.nama,
        unitOrganisasiNama: row.namaUnorEselon1,
        jabatanNama: row.namaJabatan,
        golonganNama: row.namaGolongan,
        jenisAsnNama: row.jenisAsn,
        statusAsnNama: row.statusKepegawaian,
        mappingStatus: row.mappingStatus,
        validationStatus: row.validationStatus,
        validationErrors: row.validationErrors,
        matchedAsnId: row.matchedAsnId,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
      page: params.query.page,
      limit: params.query.limit,
      total,
    };
  }

  async findAsnImportNeedsReview(params: {
    batchId: string;
    query: NormalizedSidataImportIssueQuery;
  }): Promise<PaginatedImportIssuesResponse> {
    return this.findAsnImportIssues({
      batchId: params.batchId,
      query: { ...params.query, status: 'NEEDS_REVIEW' },
    });
  }

  async findAsnImportInvalid(params: {
    batchId: string;
    query: NormalizedSidataImportIssueQuery;
  }): Promise<PaginatedImportIssuesResponse> {
    return this.findAsnImportIssues({
      batchId: params.batchId,
      query: { ...params.query, status: 'INVALID' },
    });
  }

  // ─── Phase 6: ASN Mapping ─────────────────────────────────────────────────────

  async mapSiasnAsnBatch(params: {
    batchId: string;
  }): Promise<MapSiasnAsnBatchResult> {
    return this.prisma.$transaction(
      async (tx) => {
        const batch = await tx.sidataAsnImportBatch.findUnique({
          where: { id: params.batchId },
          select: asnImportBatchSelect,
        });

        if (!batch) throw new Error('ASN_BATCH_NOT_FOUND');

        const rows = await tx.sidataAsnImportStaging.findMany({
          where: { batchId: params.batchId },
          orderBy: { rowNumber: 'asc' },
          select: asnImportStagingSelect,
        });

        let mappedRows = 0;
        let needsReviewRows = 0;
        let unmappedRows = 0;
        let invalidRows = 0;
        let existingAsnRows = 0;
        let missingReferenceRows = 0;

        for (const row of rows) {
          const validationErrors = this.toStringArray(row.validationErrors);
          const mappedData = await this.resolveAsnMappedDataInTx(tx, row);
          const missingReferences = this.getMissingReferenceMessages(row, mappedData);
          const matchedAsn = await this.findExistingAsnInTx(tx, { nip: row.nip });

          const nextValidationErrors = [...validationErrors, ...missingReferences];
          const hasRequiredInvalid =
            row.validationStatus === SIDATA_VALIDATION_STATUS.INVALID ||
            !row.nip ||
            !row.nama;

          let nextValidationStatus: string = row.validationStatus;
          let nextMappingStatus: string = SIDATA_ASN_MAP_STATUS.MAPPED;

          if (hasRequiredInvalid) {
            nextValidationStatus = SIDATA_VALIDATION_STATUS.INVALID;
            nextMappingStatus = SIDATA_ASN_MAP_STATUS.UNMAPPED;
            invalidRows += 1;
            unmappedRows += 1;
          } else if (missingReferences.length > 0) {
            nextValidationStatus = SIDATA_VALIDATION_STATUS.WARNING;
            nextMappingStatus = SIDATA_ASN_MAP_STATUS.NEEDS_REVIEW;
            needsReviewRows += 1;
            missingReferenceRows += 1;
          } else {
            mappedRows += 1;
          }

          if (matchedAsn) existingAsnRows += 1;

          await tx.sidataAsnImportStaging.update({
            where: { id: row.id },
            data: {
              mappedData: mappedData as unknown as Prisma.InputJsonValue,
              mappingStatus: nextMappingStatus,
              validationStatus: nextValidationStatus,
              validationErrors: nextValidationErrors as Prisma.InputJsonValue,
              matchedAsnId: matchedAsn?.id ?? null,
            },
          });
        }

        return {
          batchId: params.batchId,
          totalRows: rows.length,
          mappedRows,
          needsReviewRows,
          unmappedRows,
          invalidRows,
          existingAsnRows,
          missingReferenceRows,
        };
      },
      { timeout: 120000 },
    );
  }

  private async resolveAsnMappedDataInTx(
    tx: Prisma.TransactionClient,
    row: SidataAsnImportStagingRecord,
  ): Promise<SidataAsnMappedData> {
    const [
      unitKerjaId,
      jabatanId,
      golonganId,
      pangkatId,
      jenisAsnId,
      kedudukanHukumId,
      jenisKelaminId,
      agamaId,
      statusKawinId,
      pendidikanId,
    ] = await Promise.all([
      this.findUnitKerjaIdInTx(tx, { code: row.kdUnor, name: row.namaUnorEselon1 }),
      this.findJabatanIdInTx(tx, {
        code: row.kdJabatan ?? row.kdJabatanSiasn,
        name: row.namaJabatan,
        jenisJabatanKode: null,
        jenisJabatanNama: row.jenisJabatan,
      }),
      this.findSimpleRefIdInTx(tx, {
        model: 'refGolongan',
        code: row.kdGolongan ?? row.kdGolonganSiasn,
        name: row.namaGolongan,
      }),
      this.findSimpleRefIdInTx(tx, {
        model: 'refPangkat',
        code: null,
        name: row.namaRuang,
      }),
      this.findSimpleRefIdInTx(tx, {
        model: 'refJenisAsn',
        code: null,
        name: row.jenisAsn,
      }),
      this.findSimpleRefIdInTx(tx, {
        model: 'refKedudukanHukum',
        code: null,
        name: row.kedudukanHukum,
      }),
      this.findSimpleRefIdInTx(tx, {
        model: 'refJenisKelamin',
        code: null,
        name: row.jenisKelamin,
      }),
      this.findSimpleRefIdInTx(tx, {
        model: 'refAgama',
        code: null,
        name: row.agama,
      }),
      this.findSimpleRefIdInTx(tx, {
        model: 'refStatusKawin',
        code: null,
        name: row.statusKawin,
      }),
      this.findSimpleRefIdInTx(tx, {
        model: 'refPendidikan',
        code: null,
        name: row.pendidikanTerakhir,
      }),
    ]);

    return {
      unitKerjaId,
      jabatanId,
      golonganId,
      pangkatId,
      jenisAsnId,
      kedudukanHukumId,
      jenisKelaminId,
      agamaId,
      statusKawinId,
      pendidikanId,
    };
  }

  private async findUnitKerjaIdInTx(
    tx: Prisma.TransactionClient,
    params: { code: string | null; name: string | null },
  ): Promise<string | null> {
    const code = params.code?.trim() || null;
    const name = params.name?.trim() || null;

    if (code) {
      const byCode = await tx.unitKerja.findFirst({
        where: { kode: code, deletedAt: null },
        select: simpleIdSelect,
      });
      if (byCode) return byCode.id;
    }

    if (name) {
      const byName = await tx.unitKerja.findFirst({
        where: { nama: name, deletedAt: null },
        select: simpleIdSelect,
      });
      if (byName) return byName.id;

      const normalizedName = this.normalizeText(name);
      const candidates = await tx.unitKerja.findMany({
        where: { deletedAt: null },
        select: { id: true, nama: true },
        take: 5000,
      });
      const fuzzy = candidates.find(
        (c) => this.normalizeText(c.nama) === normalizedName,
      );
      if (fuzzy) return fuzzy.id;
    }

    return null;
  }

  private async findJabatanIdInTx(
    tx: Prisma.TransactionClient,
    params: {
      code: string | null;
      name: string | null;
      jenisJabatanKode: string | null;
      jenisJabatanNama: string | null;
    },
  ): Promise<string | null> {
    const code = params.code?.trim() || null;
    const name = params.name?.trim() || null;
    const jenisKode = this.normalizeJenisJabatanKode(
      params.jenisJabatanKode,
      params.jenisJabatanNama,
    );

    const jenisJabatan = jenisKode
      ? await tx.refJenisJabatan.findFirst({
          where: { kode: jenisKode, deletedAt: null },
          select: simpleIdSelect,
        })
      : null;

    const jenisFilter = jenisJabatan ? { jenisJabatanId: jenisJabatan.id } : {};

    if (code) {
      const bySiasnCode = await tx.refJabatan.findFirst({
        where: { siasnKode: code, ...jenisFilter, deletedAt: null },
        select: simpleIdSelect,
      });
      if (bySiasnCode) return bySiasnCode.id;

      const byKode = await tx.refJabatan.findFirst({
        where: { kode: code, ...jenisFilter, deletedAt: null },
        select: simpleIdSelect,
      });
      if (byKode) return byKode.id;
    }

    if (name) {
      const normalized = this.normalizeText(name);
      const byNormalized = await tx.refJabatan.findFirst({
        where: { namaNormalized: normalized, ...jenisFilter, deletedAt: null },
        select: simpleIdSelect,
      });
      if (byNormalized) return byNormalized.id;

      const byName = await tx.refJabatan.findFirst({
        where: { nama: name, ...jenisFilter, deletedAt: null },
        select: simpleIdSelect,
      });
      if (byName) return byName.id;
    }

    return null;
  }

  private async findSimpleRefIdInTx(
    tx: Prisma.TransactionClient,
    params: {
      model:
        | 'refGolongan'
        | 'refPangkat'
        | 'refPendidikan'
        | 'refAgama'
        | 'refJenisKelamin'
        | 'refStatusKawin'
        | 'refKedudukanHukum'
        | 'refJenisAsn';
      code: string | null;
      name: string | null;
    },
  ): Promise<string | null> {
    const delegate = (tx[params.model] as unknown) as {
      findFirst(args: {
        where: { kode?: string; nama?: string };
        select: { id: true };
      }): Promise<{ id: string } | null>;
      findMany(args: {
        select: { id: true; nama: true };
        take: number;
      }): Promise<Array<{ id: string; nama: string }>>;
    };

    const code = params.code?.trim() || null;
    const name = params.name?.trim() || null;

    if (code) {
      const byCode = await delegate.findFirst({ where: { kode: code }, select: simpleIdSelect });
      if (byCode) return byCode.id;
    }

    if (name) {
      const byName = await delegate.findFirst({ where: { nama: name }, select: simpleIdSelect });
      if (byName) return byName.id;

      const normalized = this.normalizeText(name);
      const candidates = await delegate.findMany({
        select: { id: true, nama: true },
        take: 5000,
      });
      const fuzzy = candidates.find((c) => this.normalizeText(c.nama) === normalized);
      if (fuzzy) return fuzzy.id;
    }

    return null;
  }

  private async findExistingAsnInTx(
    tx: Prisma.TransactionClient,
    params: { nip: string | null },
  ): Promise<{ id: string } | null> {
    const nip = params.nip?.trim() || null;
    if (!nip) return null;

    return tx.asn.findFirst({
      where: { deletedAt: null, nip },
      select: simpleIdSelect,
    });
  }

  // ─── Phase 7: ASN Commit ──────────────────────────────────────────────────────

  async commitSiasnAsnBatch(params: {
    batchId: string;
  }): Promise<CommitSiasnAsnBatchResult> {
    return this.prisma.$transaction(
      async (tx) => {
        const batch = await tx.sidataAsnImportBatch.findUnique({
          where: { id: params.batchId },
          select: asnImportBatchSelect,
        });

        if (!batch) throw new Error('ASN_BATCH_NOT_FOUND');

        const rows = await tx.sidataAsnImportStaging.findMany({
          where: { batchId: params.batchId },
          orderBy: { rowNumber: 'asc' },
          select: asnImportStagingSelect,
        });

        let eligibleRows = 0;
        let committedRows = 0;
        let createdRows = 0;
        let updatedRows = 0;
        let skippedRows = 0;
        let invalidRows = 0;
        let needsReviewRows = 0;
        let unmappedRows = 0;

        for (const row of rows) {
          if (row.validationStatus === SIDATA_VALIDATION_STATUS.INVALID) {
            invalidRows += 1;
            skippedRows += 1;
            continue;
          }

          if (row.mappingStatus === SIDATA_ASN_MAP_STATUS.NEEDS_REVIEW) {
            needsReviewRows += 1;
            skippedRows += 1;
            continue;
          }

          if (row.mappingStatus === SIDATA_ASN_MAP_STATUS.UNMAPPED) {
            unmappedRows += 1;
            skippedRows += 1;
            continue;
          }

          if (row.mappingStatus !== SIDATA_ASN_MAP_STATUS.MAPPED) {
            skippedRows += 1;
            continue;
          }

          if (!row.nip || !row.nama) {
            invalidRows += 1;
            skippedRows += 1;
            continue;
          }

          eligibleRows += 1;

          const mappedData = this.parseMappedData(row.mappedData);
          const commitResult = await this.upsertAsnFromStagingInTx(tx, { row, mappedData });

          await tx.sidataAsnImportStaging.update({
            where: { id: row.id },
            data: {
              matchedAsnId: commitResult.asnId,
              mappingStatus: SIDATA_ASN_MAP_STATUS.MAPPED,
            },
          });

          committedRows += 1;
          if (commitResult.action === SIDATA_ASN_COMMIT_ACTION.CREATED) createdRows += 1;
          if (commitResult.action === SIDATA_ASN_COMMIT_ACTION.UPDATED) updatedRows += 1;
        }

        await tx.sidataAsnImportBatch.update({
          where: { id: params.batchId },
          data: {
            status: SIDATA_IMPORT_STATUS.COMMITTED,
            finishedAt: new Date(),
            errorMessage: null,
          },
        });

        return {
          batchId: params.batchId,
          status: SIDATA_IMPORT_STATUS.COMMITTED,
          totalRows: rows.length,
          eligibleRows,
          committedRows,
          createdRows,
          updatedRows,
          skippedRows,
          invalidRows,
          needsReviewRows,
          unmappedRows,
        };
      },
      { timeout: 120_000, maxWait: 20_000 },
    );
  }

  private async upsertAsnFromStagingInTx(
    tx: Prisma.TransactionClient,
    params: {
      row: SidataAsnImportStagingRecord;
      mappedData: SiasnAsnMappedDataForCommit;
    },
  ): Promise<{ asnId: string; action: 'CREATED' | 'UPDATED' }> {
    const { row } = params;

    const existing = row.matchedAsnId
      ? await tx.asn.findFirst({
          where: { id: row.matchedAsnId, deletedAt: null },
          select: simpleIdSelect,
        })
      : await tx.asn.findFirst({
          where: { nip: row.nip ?? '', deletedAt: null },
          select: simpleIdSelect,
        });

    const safeData = this.buildAsnSafeDataFromStaging(params);

    if (existing) {
      const updated = await tx.asn.update({
        where: { id: existing.id },
        data: safeData,
        select: simpleIdSelect,
      });
      return { asnId: updated.id, action: SIDATA_ASN_COMMIT_ACTION.UPDATED };
    }

    const created = await tx.asn.create({
      data: { id: randomUUID(), ...safeData },
      select: simpleIdSelect,
    });
    return { asnId: created.id, action: SIDATA_ASN_COMMIT_ACTION.CREATED };
  }

  private buildAsnSafeDataFromStaging(params: {
    row: SidataAsnImportStagingRecord;
    mappedData: SiasnAsnMappedDataForCommit;
  }) {
    const { row, mappedData } = params;

    return {
      nip: row.nip ?? '',
      nama: row.nama ?? '',
      unitKerjaId: mappedData.unitKerjaId ?? null,
      jabatanNama: row.namaJabatan,
      golonganNama: row.namaGolongan,
      jenisAsn: row.jenisAsn,
      statusAsn: row.statusKepegawaian,
      tanggalLahir: row.tanggalLahir,
      tmtPensiun: row.tmtPensiun,
      deletedAt: null,
    };
  }

  private parseMappedData(value: unknown): SiasnAsnMappedDataForCommit {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

    const record = value as Record<string, unknown>;

    return {
      unitKerjaId: this.toNullableStringFromJson(record['unitKerjaId']),
      jabatanId: this.toNullableStringFromJson(record['jabatanId']),
      golonganId: this.toNullableStringFromJson(record['golonganId']),
      pangkatId: this.toNullableStringFromJson(record['pangkatId']),
      jenisAsnId: this.toNullableStringFromJson(record['jenisAsnId']),
      kedudukanHukumId: this.toNullableStringFromJson(record['kedudukanHukumId']),
      jenisKelaminId: this.toNullableStringFromJson(record['jenisKelaminId']),
      agamaId: this.toNullableStringFromJson(record['agamaId']),
      statusKawinId: this.toNullableStringFromJson(record['statusKawinId']),
      pendidikanId: this.toNullableStringFromJson(record['pendidikanId']),
    };
  }

  private toNullableStringFromJson(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const normalized = value.trim();
    return normalized || null;
  }

  private getMissingReferenceMessages(
    row: SidataAsnImportStagingRecord,
    mappedData: SidataAsnMappedData,
  ): string[] {
    const errors: string[] = [];

    if ((row.kdUnor || row.namaUnorEselon1) && !mappedData.unitKerjaId) {
      errors.push('Referensi unit organisasi belum termapping');
    }
    if ((row.kdJabatan || row.namaJabatan) && !mappedData.jabatanId) {
      errors.push('Referensi jabatan belum termapping');
    }
    if ((row.kdGolongan || row.namaGolongan) && !mappedData.golonganId) {
      errors.push('Referensi golongan belum termapping');
    }
    if (row.namaRuang && !mappedData.pangkatId) {
      errors.push('Referensi pangkat belum termapping');
    }
    if (row.jenisAsn && !mappedData.jenisAsnId) {
      errors.push('Referensi jenis ASN belum termapping');
    }
    if (row.kedudukanHukum && !mappedData.kedudukanHukumId) {
      errors.push('Referensi kedudukan hukum belum termapping');
    }
    if (row.jenisKelamin && !mappedData.jenisKelaminId) {
      errors.push('Referensi jenis kelamin belum termapping');
    }
    if (row.agama && !mappedData.agamaId) {
      errors.push('Referensi agama belum termapping');
    }
    if (row.statusKawin && !mappedData.statusKawinId) {
      errors.push('Referensi status kawin belum termapping');
    }
    if (row.pendidikanTerakhir && !mappedData.pendidikanId) {
      errors.push('Referensi pendidikan belum termapping');
    }

    return errors;
  }
}
