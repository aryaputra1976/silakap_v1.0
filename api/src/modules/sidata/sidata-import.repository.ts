import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { REF_JENIS_JABATAN_DEFAULTS } from './sidata-reference.types';
import {
  CommitGenericReferenceResult,
  CommitJfProfileResult,
  CommitReferenceJabatanResult,
  CommitSiasnAsnBatchResult,
  MapSiasnAsnBatchResult,
  NormalizedAuditLogFilters,
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
  SidataAsnImportIssueRow,
  SidataAsnReconciliationFieldDiff,
  SidataAsnReconciliationResponse,
  SidataAsnReconciliationRow,
  SidataAsnReconciliationSummary,
  SidataAsnReconciliationType,
  SidataImportAuditPayload,
  SidataImportSummaryResponse,
  SiasnAsnMappedDataForCommit,
  ValidatedJfProfileRow,
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
  fileChecksum: true,
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
  jenjang: true,
  bup: true,
  source: true,
  isActive: true,
  deletedAt: true,
} satisfies Prisma.RefJabatanSelect;

const simpleIdSelect = { id: true } as const;

const asnImportCompareSelect = {
  id: true,
  nip: true,
  nipLama: true,
  nik: true,
  nama: true,
  tipePegawai: true,
  statusAsn: true,
  isActive: true,
  kedudukanHukumRefId: true,
  kedudukanHukumNama: true,
  tmtPensiun: true,
  unitKerjaId: true,
  siasnUnorId: true,
  unorNama: true,
  jabatanRefId: true,
  siasnJabatanId: true,
  jabatanNama: true,
  jenisJabatanNama: true,
  tmtJabatan: true,
  golonganRefId: true,
  siasnGolonganId: true,
  golonganNama: true,
  tmtGolongan: true,
  pendidikanRefId: true,
  pendidikanNama: true,
  tingkatPendidikanRefId: true,
  tingkatPendidikanNama: true,
  tmtPerjanjianKerja: true,
  akhirPerjanjianKerja: true,
  checksum: true,
  syncStatus: true,
} satisfies Prisma.AsnSelect;

const reconciliationAsnSelect = {
  id: true,
  nip: true,
  nama: true,
  unitKerjaId: true,
  jabatanNama: true,
  golonganNama: true,
  statusAsn: true,
  unitKerja: {
    select: {
      nama: true,
    },
  },
} satisfies Prisma.AsnSelect;

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

// In-memory lookup maps pre-loaded once per mapping batch — eliminates N+1 queries
type AsnReferenceMaps = {
  unitKerjaByKode: Map<string, string>;
  unitKerjaByNama: Map<string, string>;
  unitKerjaCandidatesByNama: Map<string, Array<{ id: string; parentId: string | null }>>;
  unitKerjaParentNameById: Map<string, string>;
  jenisJabatanByKode: Map<string, string>;
  jabatanBySiasnKode: Map<string, { id: string; jenisJabatanId: string }>;
  jabatanByKode: Map<string, { id: string; jenisJabatanId: string }>;
  jabatanByNormalized: Array<{ id: string; namaNormalized: string; jenisJabatanId: string }>;
  golonganByKode: Map<string, string>;
  golonganByNama: Map<string, string>;
  pangkatByNama: Map<string, string>;
  jenisAsnByNama: Map<string, string>;
  kedudukanHukumByNama: Map<string, string>;
  jenisKelaminByNama: Map<string, string>;
  agamaByNama: Map<string, string>;
  statusKawinByNama: Map<string, string>;
  pendidikanByNama: Map<string, string>;
  pendidikanTingkatByKode: Map<string, string>;
  pendidikanTingkatByNama: Map<string, string>;
  pendidikanTingkatIdByPendidikanNama: Map<string, string>;
};

type ExtractedAsnJabatanPair = {
  kode: string | null;
  nama: string;
  jenisKode: string;
  jenisNama: string | null;
};

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
  fileChecksum: true,
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
  nik: true,
  nama: true,
  gelarDepan: true,
  gelarBelakang: true,
  namaJabatan: true,
  jenisJabatan: true,
  kdJabatan: true,
  kdJabatanSiasn: true,
  tmtJabatan: true,
  nomorSkJabatan: true,
  tanggalSkJabatan: true,
  siasnEselonId: true,
  eselonNama: true,
  namaGolongan: true,
  namaPangkat: true,
  namaRuang: true,
  kdGolongan: true,
  kdGolonganSiasn: true,
  tmtGolongan: true,
  masaKerjaGolongan: true,
  masaKerjaSeluruh: true,
  nomorSkGolongan: true,
  tanggalSkGolongan: true,
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
  nomorPerjanjianKerja: true,
  tmtPerjanjianKerja: true,
  akhirPerjanjianKerja: true,
  masaHubunganKerjaBulan: true,
  noSk: true,
  tanggalSk: true,
  masaKerjaTahun: true,
  masaKerjaBulan: true,
  nomorHp: true,
  email: true,
  emailGov: true,
  alamat: true,
  npwpNomor: true,
  bpjsNomor: true,
  tahunLulus: true,
  unorNama: true,
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

type ReconciliationAsnRecord = Prisma.AsnGetPayload<{
  select: typeof reconciliationAsnSelect;
}>;

type AsnImportCompareRecord = Prisma.AsnGetPayload<{
  select: typeof asnImportCompareSelect;
}>;

type NormalizedAsnReconciliationQuery = {
  page: number;
  limit: number;
  type?: SidataAsnReconciliationType;
  q?: string;
};

@Injectable()
export class SidataImportRepository {
  private static readonly ASN_JOB_CHUNK_SIZE = 300;

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
    pagination?: { page: number; limit: number },
  ): Promise<{ items: SidataReferenceImportStagingRecord[]; total: number }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 50;
    const skip = (page - 1) * limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.sidataReferenceImportStaging.findMany({
        where: { batchId },
        orderBy: { rowNumber: 'asc' },
        select: importStagingSelect,
        skip,
        take: limit,
      }),
      this.prisma.sidataReferenceImportStaging.count({ where: { batchId } }),
    ]);

    return { items, total };
  }

  async findReferenceBatchByChecksum(fileChecksum: string): Promise<SidataReferenceImportBatchRecord | null> {
    return this.prisma.sidataReferenceImportBatch.findFirst({
      where: { fileChecksum, status: { notIn: [SIDATA_IMPORT_STATUS.FAILED, SIDATA_IMPORT_STATUS.CANCELLED] } },
      orderBy: { createdAt: 'desc' },
      select: importBatchSelect,
    });
  }

  async findAsnImportBatchByChecksum(fileChecksum: string): Promise<SidataAsnImportBatchRecord | null> {
    return this.prisma.sidataAsnImportBatch.findFirst({
      where: { fileChecksum, status: { notIn: [SIDATA_IMPORT_STATUS.FAILED, SIDATA_IMPORT_STATUS.CANCELLED] } },
      orderBy: { createdAt: 'desc' },
      select: asnImportBatchSelect,
    });
  }

  async createReferenceBatch(params: {
    source: string;
    importType: string;
    fileName: string;
    fileChecksum?: string | null;
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
        fileChecksum: params.fileChecksum ?? null,
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

  async cancelReferenceBatch(batchId: string): Promise<{ cancelled: boolean }> {
    const result = await this.prisma.sidataReferenceImportBatch.updateMany({
      where: {
        id: batchId,
        status: { notIn: [SIDATA_IMPORT_STATUS.COMMITTED, SIDATA_IMPORT_STATUS.CANCELLED] },
      },
      data: { status: SIDATA_IMPORT_STATUS.CANCELLED, finishedAt: new Date() },
    });
    return { cancelled: result.count > 0 };
  }

  async cancelAsnBatch(batchId: string): Promise<{ cancelled: boolean }> {
    const result = await this.prisma.sidataAsnImportBatch.updateMany({
      where: {
        id: batchId,
        status: { notIn: [SIDATA_IMPORT_STATUS.COMMITTED, SIDATA_IMPORT_STATUS.CANCELLED] },
      },
      data: { status: SIDATA_IMPORT_STATUS.CANCELLED, finishedAt: new Date() },
    });
    return { cancelled: result.count > 0 };
  }

  async claimAsnBatchForJob(batchId: string): Promise<boolean> {
    return this.claimAsnBatch(batchId);
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

  async markAsnBatchFailed(params: {
    batchId: string;
    errorMessage: string;
  }): Promise<void> {
    await this.prisma.sidataAsnImportBatch.update({
      where: { id: params.batchId },
      data: {
        status: SIDATA_IMPORT_STATUS.FAILED,
        errorMessage: params.errorMessage,
        finishedAt: new Date(),
      },
      select: { id: true },
    });
  }

  async markProcessingAsnBatchesFailedOnStartup(): Promise<{ count: number }> {
    return this.prisma.sidataAsnImportBatch.updateMany({
      where: { status: SIDATA_IMPORT_STATUS.PROCESSING },
      data: {
        status: SIDATA_IMPORT_STATUS.FAILED,
        errorMessage:
          'Proses background terhenti sebelum selesai. Jalankan ulang proses dari batch baru.',
        finishedAt: new Date(),
      },
    });
  }

  // Atomically claims a reference batch for commit. Returns false if already claimed.
  private async claimReferenceBatch(batchId: string): Promise<boolean> {
    const result = await this.prisma.sidataReferenceImportBatch.updateMany({
      where: {
        id: batchId,
        status: { notIn: [SIDATA_IMPORT_STATUS.COMMITTED, SIDATA_IMPORT_STATUS.PROCESSING, SIDATA_IMPORT_STATUS.CANCELLED, SIDATA_IMPORT_STATUS.FAILED] },
      },
      data: { status: SIDATA_IMPORT_STATUS.PROCESSING },
    });
    return result.count > 0;
  }

  // Atomically claims an ASN batch for commit or map. Returns false if already claimed.
  private async claimAsnBatch(batchId: string): Promise<boolean> {
    const result = await this.prisma.sidataAsnImportBatch.updateMany({
      where: {
        id: batchId,
        status: { notIn: [SIDATA_IMPORT_STATUS.COMMITTED, SIDATA_IMPORT_STATUS.PROCESSING, SIDATA_IMPORT_STATUS.CANCELLED, SIDATA_IMPORT_STATUS.FAILED] },
      },
      data: { status: SIDATA_IMPORT_STATUS.PROCESSING },
    });
    return result.count > 0;
  }

  async findJenisJabatanByKode(kode: string): Promise<RefJenisJabatanRecord | null> {
    return this.prisma.refJenisJabatan.findFirst({
      where: { kode, deletedAt: null },
      select: jenisJabatanSelect,
    });
  }

  async ensureDefaultJenisJabatan(): Promise<void> {
    await this.prisma.$transaction(
      REF_JENIS_JABATAN_DEFAULTS.map((item) =>
        this.prisma.refJenisJabatan.upsert({
          where: { kode: item.kode },
          update: {
            nama: item.nama,
            deskripsi: item.deskripsi,
            isActive: true,
            deletedAt: null,
          },
          create: {
            id: randomUUID(),
            kode: item.kode,
            nama: item.nama,
            deskripsi: item.deskripsi,
            isActive: true,
          },
        }),
      ),
    );
  }

  async commitReferenceJabatanBatch(params: {
    batchId: string;
    jenisJabatanId: string;
  }): Promise<CommitReferenceJabatanResult> {
    const claimed = await this.claimReferenceBatch(params.batchId);
    if (!claimed) throw new Error('BATCH_ALREADY_PROCESSING_OR_COMMITTED');

    return this.prisma.$transaction(
      async (tx) => {
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

          const normalizedRaw = this.normalizeRawDataKeys(row.rawData as Record<string, unknown>);
          const jenjang = this.pickRaw(normalizedRaw, [
            'jenjang',
            'jenjang_jabatan',
            'eselon_id',
            'eselon',
          ]);
          const bupRaw = this.pickRaw(normalizedRaw, ['bup', 'batas_usia_pensiun', 'batas_usia_pensiun_tahun']);
          const bup = bupRaw !== null ? parseInt(bupRaw, 10) || null : null;

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
                siasnId: sourceCode,
                siasnKode: sourceCode,
                siasnNama: sourceName,
                jenjang: jenjang ?? existing.jenjang,
                bup: bup ?? existing.bup,
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
                siasnId: sourceCode,
                siasnKode: sourceCode,
                siasnNama: sourceName,
                jenjang,
                bup,
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
      },
      { timeout: 300_000, maxWait: 20_000 },
    );
  }

  private async commitUnitKerjaBatchInTx(
    tx: Prisma.TransactionClient,
    params: {
      batchId: string;
      targetTable: string;
      stagingRows: SidataReferenceImportStagingRecord[];
    },
  ): Promise<CommitGenericReferenceResult> {
    const idBySourceCode = new Map<string, string>();
    const levelBySourceCode = new Map<string, number>();
    const parentCodeBySourceCode = new Map<string, string | null>();
    const actionByRowId = new Map<string, 'CREATED' | 'UPDATED'>();

    let committedRows = 0;
    let skippedRows = 0;
    let createdRows = 0;
    let updatedRows = 0;
    let invalidRows = 0;
    let mappedRows = 0;

    const validRows: Array<{
      row: SidataReferenceImportStagingRecord;
      sourceCode: string;
      sourceName: string;
      parentSourceCode: string | null;
    }> = [];

    for (const row of params.stagingRows) {
      const sourceCode = row.sourceCode?.trim() || null;
      const sourceName = row.sourceName?.trim() || '';
      const parentSourceCode = this.getUnitKerjaParentCode(row);

      if (row.validationStatus === SIDATA_VALIDATION_STATUS.INVALID || !sourceCode || !sourceName) {
        invalidRows += 1;
        skippedRows += 1;
        continue;
      }

      validRows.push({ row, sourceCode, sourceName, parentSourceCode });
    }

    if (validRows.length > 0) {
      await tx.unitKerja.updateMany({
        where: {
          kode: { notIn: validRows.map((item) => item.sourceCode) },
          deletedAt: null,
        },
        data: { sortOrder: 999_999 },
      });
    }

    for (const item of validRows) {
      const existing = await tx.unitKerja.findFirst({
        where: { kode: item.sourceCode, deletedAt: null },
        select: simpleIdSelect,
      });
      const sortOrder = Math.max(item.row.rowNumber - 1, 0);

      const saved = existing
        ? await tx.unitKerja.update({
            where: { id: existing.id },
            data: {
              nama: item.sourceName,
              parentId: null,
              level: 0,
              sortOrder,
              isActive: true,
              deletedAt: null,
            },
            select: simpleIdSelect,
          })
        : await tx.unitKerja.create({
            data: {
              id: randomUUID(),
              kode: item.sourceCode,
              nama: item.sourceName,
              parentId: null,
              level: 0,
              sortOrder,
              isActive: true,
            },
            select: simpleIdSelect,
          });

      idBySourceCode.set(this.normalizeUnitKerjaCode(item.sourceCode), saved.id);
      parentCodeBySourceCode.set(
        this.normalizeUnitKerjaCode(item.sourceCode),
        item.parentSourceCode ? this.normalizeUnitKerjaCode(item.parentSourceCode) : null,
      );
      actionByRowId.set(item.row.id, existing ? SIDATA_COMMIT_ACTION.UPDATED : SIDATA_COMMIT_ACTION.CREATED);
    }

    const resolveLevel = (sourceCode: string, seen = new Set<string>()): number => {
      const normalized = this.normalizeUnitKerjaCode(sourceCode);
      const cached = levelBySourceCode.get(normalized);
      if (cached !== undefined) return cached;

      const parentCode = parentCodeBySourceCode.get(normalized);
      if (!parentCode || !idBySourceCode.has(parentCode) || seen.has(normalized)) {
        levelBySourceCode.set(normalized, 0);
        return 0;
      }

      seen.add(normalized);
      const level = resolveLevel(parentCode, seen) + 1;
      levelBySourceCode.set(normalized, level);
      return level;
    };

    for (const item of validRows) {
      const normalizedCode = this.normalizeUnitKerjaCode(item.sourceCode!);
      const id = idBySourceCode.get(normalizedCode);
      if (!id) continue;

      const parentCode = parentCodeBySourceCode.get(normalizedCode);
      const parentId = parentCode ? idBySourceCode.get(parentCode) ?? null : null;
      const level = resolveLevel(normalizedCode);

      await tx.unitKerja.update({
        where: { id },
        data: { parentId, level },
      });

      await tx.sidataReferenceImportStaging.update({
        where: { id: item.row.id },
        data: {
          targetTable: params.targetTable,
          targetId: id,
          mappingStatus: SIDATA_MAPPING_STATUS.MAPPED,
        },
      });

      await this.upsertReferenceMappingInTx(tx, {
        sourceType: item.row.referenceType,
        sourceCode: item.sourceCode,
        sourceName: item.sourceName,
        targetTable: params.targetTable,
        targetId: id,
        mappingStatus: SIDATA_MAPPING_STATUS.MAPPED,
        note: `Commit ${actionByRowId.get(item.row.id)} dari batch ${params.batchId}`,
      });

      committedRows += 1;
      mappedRows += 1;
      if (actionByRowId.get(item.row.id) === SIDATA_COMMIT_ACTION.CREATED) createdRows += 1;
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
      totalRows: params.stagingRows.length,
      committedRows,
      skippedRows,
      createdRows,
      updatedRows,
      invalidRows,
      mappedRows,
    };
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

  // ─── Phase 3B: JF Profile Import ─────────────────────────────────────────────

  async createJfProfileStagingRows(params: {
    batchId: string;
    rows: ValidatedJfProfileRow[];
  }): Promise<{ count: number }> {
    if (params.rows.length === 0) return { count: 0 };

    return this.prisma.sidataReferenceImportStaging.createMany({
      data: params.rows.map((row) => ({
        id: randomUUID(),
        batchId: params.batchId,
        rowNumber: row.rowNumber,
        referenceType: 'JF_PROFILE',
        sourceCode: null,
        sourceName: row.sourceName,
        sourceDescription: row.sourceDescription,
        targetTable: 'ref_jabatan_fungsional_profile',
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

  async commitJfProfileBatch(params: {
    batchId: string;
  }): Promise<CommitJfProfileResult> {
    const claimed = await this.claimReferenceBatch(params.batchId);
    if (!claimed) throw new Error('BATCH_ALREADY_PROCESSING_OR_COMMITTED');

    return this.prisma.$transaction(
      async (tx) => {
        const stagingRows = await tx.sidataReferenceImportStaging.findMany({
          where: { batchId: params.batchId, referenceType: 'JF_PROFILE' },
          orderBy: { rowNumber: 'asc' },
          select: importStagingSelect,
        });

        // Pre-load semua jabatan fungsional untuk pencocokan di memori
        const fungsionalJenis = await tx.refJenisJabatan.findFirst({
          where: { kode: 'FUNGSIONAL', deletedAt: null },
          select: { id: true },
        });

        const allFungsional = fungsionalJenis
          ? await tx.refJabatan.findMany({
              where: { jenisJabatanId: fungsionalJenis.id, deletedAt: null },
              select: { id: true, namaNormalized: true },
            })
          : [];

        const jabatanByNormalized = new Map(
          allFungsional.map((j) => [j.namaNormalized ?? '', j.id]),
        );

        let committedRows = 0;
        let matchedRows = 0;
        let unmatchedRows = 0;
        let createdRows = 0;
        let updatedRows = 0;
        let skippedRows = 0;
        let invalidRows = 0;

        for (const row of stagingRows) {
          if (row.validationStatus === SIDATA_VALIDATION_STATUS.INVALID || !row.sourceName) {
            invalidRows += 1;
            skippedRows += 1;
            continue;
          }

          const raw = row.rawData && typeof row.rawData === 'object' && !Array.isArray(row.rawData)
            ? this.normalizeRawDataKeys(row.rawData as Record<string, unknown>)
            : {};

          const namaJabatan = this.rawString(raw, ['_namajabatan', 'nama_jabatan_fungsional', 'nama_jabatan']);
          const jenjang = row.sourceDescription?.trim() || this.rawString(raw, ['_jenjang', 'jenjang']);
          const namaLengkap = row.sourceName.trim();

          if (!namaJabatan || !jenjang) {
            invalidRows += 1;
            skippedRows += 1;
            continue;
          }

          const namaJabatanNormalized = this.normalizeText(namaJabatan);
          const jenjangNormalized = this.normalizeText(jenjang);
          const namaLengkapNormalized = this.normalizeText(namaLengkap);

          // Cari ref_jabatan yang cocok berdasarkan namaLengkap (format: "NAMA JENJANG")
          const jabatanId = jabatanByNormalized.get(namaLengkapNormalized) ?? null;

          if (!jabatanId) unmatchedRows += 1;
          else matchedRows += 1;

          const profileData = {
            jabatanId,
            namaJabatan,
            namaJabatanNormalized,
            jenjang,
            jenjangNormalized,
            namaLengkap,
            namaLengkapNormalized,
            dasarHukum: this.rawString(raw, ['dasar_hukum']),
            tugasJabatan: this.rawString(raw, ['tugas_jabatan']),
            pendidikanPengangkatanPertama: this.rawString(raw, ['pendidikan_pengangkatan_pertama']),
            pendidikanPerpindahan: this.rawString(raw, ['pendidikan_perpindahan']),
            kategori: this.rawString(raw, ['kategori']),
            jenjangAwal: this.rawString(raw, ['awal', 'jenjang_awal']),
            jenjangPuncak: this.rawString(raw, ['puncak', 'jenjang_puncak']),
            golonganRuangAwal: this.rawString(raw, ['golongan_ruang_awal']),
            rumpunJabatan: this.rawString(raw, ['rumpun_jabatan']),
            ruangLingkup: this.rawString(raw, ['ruang_lingkup']),
            kedudukan: this.rawString(raw, ['kedudukan']),
            pengisianAsn: this.rawString(raw, ['pengisian_asn']),
            instansiPembina: this.rawString(raw, ['instansi_pembina']),
            peraturanPresidenTunjangan: this.rawString(raw, ['peraturan_presiden_tentang_tunjangan', 'peraturan_presiden_tunjangan']),
            besaranTunjangan: this.rawString(raw, ['besaran_tunjangan']),
            source: 'BKN_PROFILE',
            rawData: row.rawData as Prisma.InputJsonValue,
            deletedAt: null,
          };

          const existing = await tx.refJabatanFungsionalProfile.findUnique({
            where: {
              namaJabatanNormalized_jenjangNormalized: { namaJabatanNormalized, jenjangNormalized },
            },
            select: { id: true },
          });

          let targetId: string;

          if (existing) {
            await tx.refJabatanFungsionalProfile.update({
              where: { id: existing.id },
              data: profileData,
            });
            targetId = existing.id;
            updatedRows += 1;
          } else {
            const created = await tx.refJabatanFungsionalProfile.create({
              data: { id: randomUUID(), ...profileData },
              select: { id: true },
            });
            targetId = created.id;
            createdRows += 1;
          }

          await tx.sidataReferenceImportStaging.update({
            where: { id: row.id },
            data: {
              targetId,
              mappingStatus: jabatanId
                ? SIDATA_MAPPING_STATUS.MAPPED
                : SIDATA_MAPPING_STATUS.NEEDS_REVIEW,
            },
          });

          committedRows += 1;
        }

        await tx.sidataReferenceImportBatch.update({
          where: { id: params.batchId },
          data: { status: SIDATA_IMPORT_STATUS.COMMITTED, finishedAt: new Date(), errorMessage: null },
        });

        return {
          batchId: params.batchId,
          status: SIDATA_IMPORT_STATUS.COMMITTED,
          totalRows: stagingRows.length,
          committedRows,
          matchedRows,
          unmatchedRows,
          createdRows,
          updatedRows,
          skippedRows,
          invalidRows,
        };
      },
      { timeout: 120_000, maxWait: 20_000 },
    );
  }

  async createGenericReferenceBatch(params: {
    source: string;
    importType: string;
    fileName: string;
    fileChecksum?: string | null;
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
        fileChecksum: params.fileChecksum ?? null,
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
    const claimed = await this.claimReferenceBatch(params.batchId);
    if (!claimed) throw new Error('BATCH_ALREADY_PROCESSING_OR_COMMITTED');

    return this.prisma.$transaction(
      async (tx) => {
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

        if (params.targetTable === 'ref_unit_organisasi') {
          return this.commitUnitKerjaBatchInTx(tx, {
            batchId: params.batchId,
            targetTable: params.targetTable,
            stagingRows,
          });
        }

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
      },
      { timeout: 120_000, maxWait: 20_000 },
    );
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
    // Unit kerja names are NOT unique (same name can appear at different hierarchy levels).
    // Only match by kode (SIASN ID) to avoid merging distinct units that share a name.
    const existing = params.sourceCode
      ? await tx.unitKerja.findFirst({
          where: { kode: params.sourceCode, deletedAt: null },
          select: { id: true },
        })
      : null;

    if (existing) {
      await tx.unitKerja.update({
        where: { id: existing.id },
        data: { nama: params.sourceName.trim(), isActive: true, deletedAt: null },
      });
      return { id: existing.id, action: SIDATA_COMMIT_ACTION.UPDATED };
    }

    const created = await tx.unitKerja.create({
      data: {
        id: randomUUID(),
        kode: params.sourceCode ?? randomUUID(),
        nama: params.sourceName.trim(),
        level: 0,
        isActive: true,
      },
      select: { id: true },
    });

    return { id: created.id, action: SIDATA_COMMIT_ACTION.CREATED };
  }

  private getUnitKerjaParentCode(row: SidataReferenceImportStagingRecord): string | null {
    const raw = row.rawData && typeof row.rawData === 'object' && !Array.isArray(row.rawData)
      ? this.normalizeRawDataKeys(row.rawData as Record<string, unknown>)
      : {};

    return (
      this.rawString(raw, [
        'id_atasan',
        'id atasan',
        'parent_id',
        'parent id',
        'id_parent',
        'id parent',
        'parent_unor_id',
        'parent unor id',
        'unor_parent_id',
        'unor parent id',
        'id_unor_atasan',
        'id unor atasan',
        'kode_atasan',
        'kode atasan',
      ]) ??
      row.sourceDescription?.trim() ??
      null
    );
  }

  private normalizeUnitKerjaCode(value: string): string {
    return value.trim().toLowerCase();
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

  private stripPunctuation(value: string): string {
    return value.toLowerCase().replace(/[.,'\-\/\\()]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private readonly SIASN_JABATAN_JENJANG_PREFIXES = new Set([
    'AHLI PERTAMA',
    'AHLI MUDA',
    'AHLI MADYA',
    'AHLI UTAMA',
    'PEMULA',
    'TERAMPIL',
    'MAHIR',
    'PENYELIA',
  ]);

  private toNamaJenjangJabatan(value: string): string | null {
    const parts = value
      .split('-')
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length !== 2) return null;

    const [jenjang, nama] = parts;
    if (!jenjang || !nama) return null;

    const normalizedJenjang = this.stripPunctuation(jenjang).toUpperCase();
    if (!this.SIASN_JABATAN_JENJANG_PREFIXES.has(normalizedJenjang)) return null;

    return `${nama} ${jenjang}`;
  }

  private toAsnAbbreviationJabatan(value: string): string | null {
    const replaced = value.replace(/\bAparatur\s+Sipil\s+Negara\b/gi, 'ASN').trim();
    return replaced !== value.trim() ? replaced : null;
  }

  // Nama jabatan lama dari SIASN → nama baru di ref_jabatan (format: "NAMA JENJANG")
  private readonly GURU_LAMA_MAP: Record<string, string> = {
    'GURU PRATAMA TINGKAT. I': 'GURU PEMULA',
    'GURU PRATAMA':            'GURU PEMULA',
    'GURU MUDA TINGKAT. I':    'GURU TERAMPIL',
    'GURU MUDA':               'GURU TERAMPIL',
    'GURU MADYA TINGKAT. I':   'GURU MAHIR',
    'GURU MADYA':              'GURU MAHIR',
    'GURU DEWASA TINGKAT. I':  'GURU AHLI PERTAMA',
    'GURU DEWASA':             'GURU AHLI PERTAMA',
    'GURU PEMBINA':            'GURU AHLI MUDA',
    'GURU PERTAMA':            'GURU AHLI PERTAMA',
    'PENGAWAS MADYA':                                     'PENGAWAS SEKOLAH AHLI MUDA',
    'PENGAWAS SEKOLAH MADYA - TINGKAT MENENGAH':          'PENGAWAS SEKOLAH AHLI MADYA',
    'PENGAWAS SEKOLAH MADYA - TK/SD':                    'PENGAWAS SEKOLAH AHLI MADYA',
  };

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
    // Check kode and nama separately against the SIASN numeric/string code map
    for (const candidate of [kode, nama]) {
      const raw = candidate?.trim().toLowerCase();
      if (raw) {
        const mapped = this.SIASN_JENIS_JABATAN_CODE_MAP[raw];
        if (mapped) return mapped;
      }
    }

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

  async findAsnStagingByBatchId(
    batchId: string,
    pagination?: { page: number; limit: number },
  ): Promise<{ items: SidataAsnImportStagingRecord[]; total: number }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 50;
    const skip = (page - 1) * limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.sidataAsnImportStaging.findMany({
        where: { batchId },
        orderBy: { rowNumber: 'asc' },
        select: asnImportStagingSelect,
        skip,
        take: limit,
      }),
      this.prisma.sidataAsnImportStaging.count({ where: { batchId } }),
    ]);

    return { items, total };
  }

  async reconcileAsnBatch(params: {
    batchId: string;
    query: NormalizedAsnReconciliationQuery;
  }): Promise<SidataAsnReconciliationResponse> {
    const [batchRows, masterRows] = await this.prisma.$transaction([
      this.prisma.sidataAsnImportStaging.findMany({
        where: { batchId: params.batchId },
        orderBy: [{ rowNumber: 'asc' }, { id: 'asc' }],
        select: asnImportStagingSelect,
      }),
      this.prisma.asn.findMany({
        where: { deletedAt: null },
        orderBy: [{ nama: 'asc' }, { nip: 'asc' }],
        select: reconciliationAsnSelect,
      }),
    ]);

    const masterByNip = new Map(
      masterRows
        .filter((row) => row.nip)
        .map((row) => [this.normalizeNip(row.nip), row]),
    );
    const batchNips = new Set<string>();
    const rows: SidataAsnReconciliationRow[] = [];

    for (const batchRow of batchRows) {
      const nip = this.normalizeNip(batchRow.nip);
      if (nip) batchNips.add(nip);

      const master = nip ? masterByNip.get(nip) ?? null : null;
      rows.push(this.toReconciliationRow({ batchRow, master }));
    }

    for (const master of masterRows) {
      const nip = this.normalizeNip(master.nip);
      if (!nip || batchNips.has(nip)) {
        continue;
      }

      rows.push(this.toReconciliationRow({ batchRow: null, master }));
    }

    const summary = this.summarizeReconciliationRows({
      batchId: params.batchId,
      totalBatchRows: batchRows.length,
      totalMasterRows: masterRows.length,
      rows,
    });

    const filtered = rows
      .filter((row) => (params.query.type ? row.type === params.query.type : row.type !== 'SAME'))
      .filter((row) => this.matchesReconciliationSearch(row, params.query.q));
    const skip = (params.query.page - 1) * params.query.limit;

    return {
      summary,
      items: filtered.slice(skip, skip + params.query.limit),
      page: params.query.page,
      limit: params.query.limit,
      total: filtered.length,
    };
  }

  async createAsnImportBatch(params: {
    source: string;
    importType: string;
    fileName: string;
    fileChecksum?: string | null;
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
        fileChecksum: params.fileChecksum ?? null,
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
        nik: row.nik,
        nama: row.nama,
        gelarDepan: row.gelarDepan,
        gelarBelakang: row.gelarBelakang,
        namaJabatan: row.namaJabatan,
        jenisJabatan: row.jenisJabatan,
        kdJabatan: row.kdJabatan,
        kdJabatanSiasn: row.kdJabatanSiasn,
        tmtJabatan: row.tmtJabatan,
        nomorSkJabatan: row.nomorSkJabatan,
        tanggalSkJabatan: row.tanggalSkJabatan,
        siasnEselonId: row.siasnEselonId,
        eselonNama: row.eselonNama,
        namaGolongan: row.namaGolongan,
        namaPangkat: row.namaPangkat,
        namaRuang: row.namaRuang,
        kdGolongan: row.kdGolongan,
        kdGolonganSiasn: row.kdGolonganSiasn,
        tmtGolongan: row.tmtGolongan,
        masaKerjaGolongan: row.masaKerjaGolongan,
        masaKerjaSeluruh: row.masaKerjaSeluruh,
        nomorSkGolongan: row.nomorSkGolongan,
        tanggalSkGolongan: row.tanggalSkGolongan,
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
        nomorPerjanjianKerja: row.nomorPerjanjianKerja,
        tmtPerjanjianKerja: row.tmtPerjanjianKerja,
        akhirPerjanjianKerja: row.akhirPerjanjianKerja,
        masaHubunganKerjaBulan: row.masaHubunganKerjaBulan,
        noSk: row.noSk,
        tanggalSk: row.tanggalSk,
        masaKerjaTahun: row.masaKerjaTahun,
        masaKerjaBulan: row.masaKerjaBulan,
        nomorHp: row.nomorHp,
        email: row.email,
        emailGov: row.emailGov,
        alamat: row.alamat,
        npwpNomor: row.npwpNomor,
        bpjsNomor: row.bpjsNomor,
        tahunLulus: row.tahunLulus,
        unorNama: row.unorNama,
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

  async listAuditLogs(filters: NormalizedAuditLogFilters): Promise<{
    items: SidataImportAuditLogRecord[];
    total: number;
  }> {
    const where: Prisma.SidataImportAuditLogWhereInput = {};

    if (filters.batchId) {
      where.batchId = filters.batchId;
    }
    if (filters.batchType) {
      where.batchType = filters.batchType;
    }
    if (filters.action) {
      where.action = filters.action;
    }
    if (filters.dateFrom !== undefined || filters.dateTo !== undefined) {
      const dateFilter: Prisma.DateTimeFilter<'SidataImportAuditLog'> = {};
      if (filters.dateFrom !== undefined) dateFilter.gte = filters.dateFrom;
      if (filters.dateTo !== undefined) dateFilter.lte = filters.dateTo;
      where.createdAt = dateFilter;
    }

    const skip = (filters.page - 1) * filters.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.sidataImportAuditLog.findMany({
        where,
        select: importAuditLogSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: filters.limit,
      }),
      this.prisma.sidataImportAuditLog.count({ where }),
    ]);

    return { items, total };
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
    const where = this.buildAsnImportIssueWhere(params.batchId, params.query);

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
      items: items.map((row) => this.toAsnImportIssueRow(row)),
      page: params.query.page,
      limit: params.query.limit,
      total,
    };
  }

  async findAsnImportIssueExportPage(params: {
    batchId: string;
    query: NormalizedSidataImportIssueQuery;
    cursorId?: string;
    take: number;
  }): Promise<SidataAsnImportStagingRecord[]> {
    return this.prisma.sidataAsnImportStaging.findMany({
      where: this.buildAsnImportIssueWhere(params.batchId, params.query),
      orderBy: [{ rowNumber: 'asc' }, { id: 'asc' }],
      cursor: params.cursorId ? { id: params.cursorId } : undefined,
      skip: params.cursorId ? 1 : 0,
      take: params.take,
      select: asnImportStagingSelect,
    });
  }

  private buildAsnImportIssueWhere(
    batchId: string,
    query: NormalizedSidataImportIssueQuery,
  ): Prisma.SidataAsnImportStagingWhereInput {
    const where: Prisma.SidataAsnImportStagingWhereInput = { batchId };

    if (query.status === 'NEEDS_REVIEW') {
      where.mappingStatus = SIDATA_ASN_MAP_STATUS.NEEDS_REVIEW;
    } else if (query.status === 'INVALID') {
      where.validationStatus = SIDATA_VALIDATION_STATUS.INVALID;
    } else if (query.status === 'UNMAPPED') {
      where.mappingStatus = SIDATA_ASN_MAP_STATUS.UNMAPPED;
    } else {
      where.OR = [
        { mappingStatus: SIDATA_ASN_MAP_STATUS.NEEDS_REVIEW },
        { mappingStatus: SIDATA_ASN_MAP_STATUS.UNMAPPED },
        { validationStatus: SIDATA_VALIDATION_STATUS.INVALID },
      ];
    }

    if (query.q) {
      const q = query.q;
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

    return where;
  }

  private toAsnImportIssueRow(
    row: SidataAsnImportStagingRecord,
  ): SidataAsnImportIssueRow {
    const raw = row.rawData && typeof row.rawData === 'object' && !Array.isArray(row.rawData)
      ? this.normalizeRawDataKeys(row.rawData as Record<string, unknown>)
      : {};
    const unitNameCandidates = this.getUnitKerjaNameCandidates(row, raw);

    return {
      id: row.id,
      rowNumber: row.rowNumber,
      nip: row.nip,
      nama: row.nama,
      unitOrganisasiNama: unitNameCandidates[0] ?? row.namaUnorEselon1,
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
    };
  }

  private toReconciliationRow(params: {
    batchRow: SidataAsnImportStagingRecord | null;
    master: ReconciliationAsnRecord | null;
  }): SidataAsnReconciliationRow {
    const { batchRow, master } = params;
    const mappedData = this.parseMappedData(batchRow?.mappedData);
    const batchUnitKerjaId = mappedData.unitKerjaId ?? null;
    const batchUnitKerjaNama = batchRow?.namaUnorEselon1 ?? null;
    const diffs = this.buildReconciliationDiffs({
      batchRow,
      master,
      batchUnitKerjaId,
      batchUnitKerjaNama,
    });

    const type: SidataAsnReconciliationType = !master
      ? 'ONLY_IN_BATCH'
      : !batchRow
        ? 'ONLY_IN_MASTER'
        : diffs.length > 0
          ? 'DIFFERENT'
          : 'SAME';

    return {
      key: batchRow?.id ?? master?.id ?? randomUUID(),
      type,
      nip: batchRow?.nip ?? master?.nip ?? null,
      nama: batchRow?.nama ?? master?.nama ?? null,
      batch: batchRow
        ? {
            rowId: batchRow.id,
            rowNumber: batchRow.rowNumber,
            nama: batchRow.nama,
            unitKerjaId: batchUnitKerjaId,
            unitKerjaNama: batchUnitKerjaNama,
            jabatanNama: batchRow.namaJabatan,
            golonganNama: batchRow.namaGolongan,
            statusAsn: batchRow.statusKepegawaian,
            mappingStatus: batchRow.mappingStatus,
            validationStatus: batchRow.validationStatus,
          }
        : null,
      master: master
        ? {
            asnId: master.id,
            nama: master.nama,
            unitKerjaId: master.unitKerjaId,
            unitKerjaNama: master.unitKerja?.nama ?? null,
            jabatanNama: master.jabatanNama,
            golonganNama: master.golonganNama,
            statusAsn: master.statusAsn,
          }
        : null,
      diffs,
    };
  }

  private buildReconciliationDiffs(params: {
    batchRow: SidataAsnImportStagingRecord | null;
    master: ReconciliationAsnRecord | null;
    batchUnitKerjaId: string | null;
    batchUnitKerjaNama: string | null;
  }): SidataAsnReconciliationFieldDiff[] {
    const { batchRow, master, batchUnitKerjaId, batchUnitKerjaNama } = params;
    if (!batchRow || !master) return [];

    const diffs: SidataAsnReconciliationFieldDiff[] = [];
    const pushDiff = (
      field: SidataAsnReconciliationFieldDiff['field'],
      label: string,
      masterValue: string | null,
      batchValue: string | null,
    ) => {
      if (this.normalizeCompare(masterValue) !== this.normalizeCompare(batchValue)) {
        diffs.push({ field, label, master: masterValue, batch: batchValue });
      }
    };

    if (batchUnitKerjaId || master.unitKerjaId) {
      pushDiff(
        'unitKerja',
        'Unit Kerja',
        master.unitKerjaId,
        batchUnitKerjaId,
      );
    } else {
      pushDiff(
        'unitKerja',
        'Unit Kerja',
        master.unitKerja?.nama ?? null,
        batchUnitKerjaNama,
      );
    }

    pushDiff('jabatan', 'Jabatan', master.jabatanNama, batchRow.namaJabatan);
    pushDiff('golongan', 'Golongan', master.golonganNama, batchRow.namaGolongan);
    pushDiff('statusAsn', 'Status ASN', master.statusAsn, batchRow.statusKepegawaian);

    return diffs;
  }

  private summarizeReconciliationRows(params: {
    batchId: string;
    totalBatchRows: number;
    totalMasterRows: number;
    rows: SidataAsnReconciliationRow[];
  }): SidataAsnReconciliationSummary {
    const onlyInBatch = params.rows.filter((row) => row.type === 'ONLY_IN_BATCH').length;
    const onlyInMaster = params.rows.filter((row) => row.type === 'ONLY_IN_MASTER').length;
    const different = params.rows.filter((row) => row.type === 'DIFFERENT').length;
    const same = params.rows.filter((row) => row.type === 'SAME').length;

    return {
      batchId: params.batchId,
      totalBatchRows: params.totalBatchRows,
      totalMasterRows: params.totalMasterRows,
      onlyInBatch,
      onlyInMaster,
      different,
      same,
      attentionRows: onlyInBatch + onlyInMaster + different,
    };
  }

  private matchesReconciliationSearch(
    row: SidataAsnReconciliationRow,
    query: string | undefined,
  ): boolean {
    const q = query?.trim().toLowerCase();
    if (!q) return true;

    return [
      row.nip,
      row.nama,
      row.batch?.unitKerjaNama,
      row.batch?.jabatanNama,
      row.batch?.golonganNama,
      row.master?.unitKerjaNama,
      row.master?.jabatanNama,
      row.master?.golonganNama,
      row.master?.statusAsn,
      row.batch?.statusAsn,
    ]
      .map((value) => value ?? '')
      .join(' ')
      .toLowerCase()
      .includes(q);
  }

  private normalizeNip(value: string | null | undefined): string {
    return (value ?? '').replace(/\D/g, '').trim();
  }

  private normalizeCompare(value: string | null | undefined): string {
    return this.normalizeText(value ?? '');
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
    const batch = await this.prisma.sidataAsnImportBatch.findUnique({
      where: { id: params.batchId },
      select: asnImportBatchSelect,
    });
    if (!batch) throw new Error('ASN_BATCH_NOT_FOUND');

    const rows = await this.prisma.sidataAsnImportStaging.findMany({
      where: { batchId: params.batchId },
      orderBy: { rowNumber: 'asc' },
      select: asnImportStagingSelect,
    });

    // Pre-load ALL reference data in parallel — one query per table instead of per row
    const [refMaps, existingAsnMap] = await Promise.all([
      this.preloadReferenceMapsForMapping(),
      this.preloadExistingAsnByNip(rows.map((r) => r.nip).filter(Boolean) as string[]),
    ]);

    // Compute all mapped data in-memory with zero additional DB queries
    type RowResult = {
      id: string;
      mappedData: SidataAsnMappedData;
      nextValidationStatus: string;
      nextMappingStatus: string;
      nextValidationErrors: string[];
      matchedAsnId: string | null;
    };

    let mappedRows = 0;
    let needsReviewRows = 0;
    let unmappedRows = 0;
    let invalidRows = 0;
    let existingAsnRows = 0;
    let missingReferenceRows = 0;

    const results: RowResult[] = [];
    for (const row of rows) {
      const validationErrors = this.toStringArray(row.validationErrors).filter(
        (message) => !this.isMissingReferenceMessage(message),
      );
      const mappedData = this.resolveAsnMappedDataFromMaps(row, refMaps);
      const missingReferences = this.getMissingReferenceMessages(row, mappedData);
      const matchedAsnId = row.nip ? (existingAsnMap.get(row.nip) ?? null) : null;

      const nextValidationErrors = [...validationErrors, ...missingReferences];
      const hasRequiredInvalid =
        row.validationStatus === SIDATA_VALIDATION_STATUS.INVALID || !row.nip || !row.nama;

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

      if (matchedAsnId) existingAsnRows += 1;
      results.push({ id: row.id, mappedData, nextValidationStatus, nextMappingStatus, nextValidationErrors, matchedAsnId });
    }

    // Persist results in a single transaction — all updates + batch status
    for (const chunk of this.chunkArray(results, SidataImportRepository.ASN_JOB_CHUNK_SIZE)) {
      await this.prisma.$transaction(
        async (tx) => {
          await Promise.all(
            chunk.map((r) =>
              tx.sidataAsnImportStaging.update({
                where: { id: r.id },
                data: {
                  mappedData: r.mappedData as unknown as Prisma.InputJsonValue,
                  mappingStatus: r.nextMappingStatus,
                  validationStatus: r.nextValidationStatus,
                  validationErrors: r.nextValidationErrors as Prisma.InputJsonValue,
                  matchedAsnId: r.matchedAsnId,
                },
              }),
            ),
          );
        },
        { timeout: 60_000, maxWait: 10_000 },
      );
      await this.yieldToEventLoop();
    }

    await this.prisma.sidataAsnImportBatch.update({
      where: { id: params.batchId },
      data: { status: SIDATA_IMPORT_STATUS.VALIDATED },
    });

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
  }

  async resolveAsnUnitKerjaMapping(params: {
    batchId: string;
    rowId: string;
    unitKerjaId: string;
  }): Promise<SidataAsnImportIssueRow> {
    return this.prisma.$transaction(async (tx) => {
      const [row, unitKerja] = await Promise.all([
        tx.sidataAsnImportStaging.findFirst({
          where: { id: params.rowId, batchId: params.batchId },
          select: asnImportStagingSelect,
        }),
        tx.unitKerja.findFirst({
          where: { id: params.unitKerjaId, deletedAt: null, isActive: true },
          select: { id: true },
        }),
      ]);

      if (!row) throw new Error('ASN_IMPORT_ROW_NOT_FOUND');
      if (!unitKerja) throw new Error('UNIT_KERJA_NOT_FOUND');

      const errors = this.toStringArray(row.validationErrors).filter(
        (message) => message !== 'Referensi unit organisasi belum termapping',
      );
      const hasMissingReference = errors.some((message) => this.isMissingReferenceMessage(message));
      const nextValidationStatus = errors.length === 0
        ? SIDATA_VALIDATION_STATUS.VALID
        : row.validationStatus === SIDATA_VALIDATION_STATUS.INVALID
          ? SIDATA_VALIDATION_STATUS.INVALID
          : SIDATA_VALIDATION_STATUS.WARNING;
      const nextMappingStatus = hasMissingReference
        ? SIDATA_ASN_MAP_STATUS.NEEDS_REVIEW
        : nextValidationStatus === SIDATA_VALIDATION_STATUS.INVALID
          ? SIDATA_ASN_MAP_STATUS.UNMAPPED
          : SIDATA_ASN_MAP_STATUS.MAPPED;

      const mappedData = {
        ...this.parseMappedData(row.mappedData),
        unitKerjaId: unitKerja.id,
      };

      const updated = await tx.sidataAsnImportStaging.update({
        where: { id: row.id },
        data: {
          mappedData: mappedData as Prisma.InputJsonValue,
          validationErrors: errors as Prisma.InputJsonValue,
          validationStatus: nextValidationStatus,
          mappingStatus: nextMappingStatus,
        },
        select: asnImportStagingSelect,
      });

      return this.toAsnImportIssueRow(updated);
    });
  }

  private async preloadReferenceMapsForMapping(): Promise<AsnReferenceMaps> {
    const norm = (v: string | null | undefined) => this.normalizeText(v ?? '');

    const [unitKerjas, jenisJabatans, jabatans, golongans, pangkats,
      jenisAsns, kedudukanHukums, jenisKelamins, agamas, statusKawins, pendidikanTingkat, pendidikans] =
      await Promise.all([
        this.prisma.unitKerja.findMany({
          where: { deletedAt: null },
          select: {
            id: true,
            kode: true,
            nama: true,
            parentId: true,
            parent: { select: { nama: true } },
          },
          take: 20_000,
        }),
        this.prisma.refJenisJabatan.findMany({ where: { deletedAt: null }, select: { id: true, kode: true } }),
        this.prisma.refJabatan.findMany({ where: { deletedAt: null }, select: { id: true, kode: true, siasnKode: true, namaNormalized: true, jenisJabatanId: true }, take: 20_000 }),
        this.prisma.refGolongan.findMany({ where: { deletedAt: null }, select: { id: true, kode: true, nama: true }, take: 5_000 }),
        this.prisma.refPangkat.findMany({ where: { deletedAt: null }, select: { id: true, nama: true }, take: 5_000 }),
        this.prisma.refJenisAsn.findMany({ where: { deletedAt: null }, select: { id: true, nama: true }, take: 100 }),
        this.prisma.refKedudukanHukum.findMany({ where: { deletedAt: null }, select: { id: true, nama: true }, take: 100 }),
        this.prisma.refJenisKelamin.findMany({ where: { deletedAt: null }, select: { id: true, nama: true }, take: 10 }),
        this.prisma.refAgama.findMany({ where: { deletedAt: null }, select: { id: true, nama: true }, take: 20 }),
        this.prisma.refStatusKawin.findMany({ where: { deletedAt: null }, select: { id: true, nama: true }, take: 20 }),
        this.prisma.refPendidikanTingkat.findMany({ select: { id: true, kode: true, nama: true }, take: 100 }),
        this.prisma.refPendidikan.findMany({ where: { deletedAt: null }, select: { id: true, nama: true, tingkatPendidikanId: true }, take: 20_000 }),
      ]);

    const simpleMap = (items: { id: string; nama: string }[]) =>
      new Map(items.map((i) => [norm(i.nama), i.id]));

    const jabatanEntry = (j: { id: string; jenisJabatanId: string }) =>
      ({ id: j.id, jenisJabatanId: j.jenisJabatanId });

    const unitKerjaCandidatesByNama = new Map<string, Array<{ id: string; parentId: string | null }>>();
    for (const unit of unitKerjas) {
      const key = norm(unit.nama);
      const existing = unitKerjaCandidatesByNama.get(key) ?? [];
      existing.push({ id: unit.id, parentId: unit.parentId });
      unitKerjaCandidatesByNama.set(key, existing);
    }

    return {
      unitKerjaByKode: new Map(unitKerjas.flatMap((u) => [
        [u.kode, u.id] as const,
        [this.normalizeUnitKerjaCode(u.kode), u.id] as const,
      ])),
      unitKerjaByNama: new Map(unitKerjas.map((u) => [norm(u.nama), u.id])),
      unitKerjaCandidatesByNama,
      unitKerjaParentNameById: new Map(
        unitKerjas
          .filter((u) => u.parent?.nama)
          .map((u) => [u.id, u.parent!.nama]),
      ),
      jenisJabatanByKode: new Map(jenisJabatans.map((j) => [j.kode, j.id])),
      jabatanBySiasnKode: new Map(
        jabatans.filter((j) => j.siasnKode).map((j) => [j.siasnKode!, jabatanEntry(j)]),
      ),
      jabatanByKode: new Map(
        jabatans.filter((j) => j.kode).map((j) => [j.kode!, jabatanEntry(j)]),
      ),
      jabatanByNormalized: jabatans
        .filter((j) => j.namaNormalized)
        .map((j) => ({ id: j.id, namaNormalized: j.namaNormalized!, jenisJabatanId: j.jenisJabatanId })),
      golonganByKode: new Map(golongans.filter((g) => g.kode).map((g) => [g.kode!, g.id])),
      golonganByNama: simpleMap(golongans),
      pangkatByNama: simpleMap(pangkats),
      jenisAsnByNama: simpleMap(jenisAsns),
      kedudukanHukumByNama: simpleMap(kedudukanHukums),
      jenisKelaminByNama: simpleMap(jenisKelamins),
      agamaByNama: simpleMap(agamas),
      statusKawinByNama: simpleMap(statusKawins),
      pendidikanByNama: simpleMap(pendidikans),
      pendidikanTingkatByKode: new Map(pendidikanTingkat.filter((p) => p.kode).map((p) => [p.kode!, p.id])),
      pendidikanTingkatByNama: simpleMap(pendidikanTingkat),
      pendidikanTingkatIdByPendidikanNama: new Map(
        pendidikans
          .filter((p) => p.tingkatPendidikanId)
          .map((p) => [norm(p.nama), p.tingkatPendidikanId!]),
      ),
    };
  }

  private async preloadExistingAsnByNip(nips: string[]): Promise<Map<string, string>> {
    if (nips.length === 0) return new Map();
    const existing = await this.prisma.asn.findMany({
      where: { nip: { in: nips }, deletedAt: null },
      select: { id: true, nip: true },
    });
    return new Map(existing.map((a) => [a.nip, a.id]));
  }

  private resolveAsnMappedDataFromMaps(
    row: SidataAsnImportStagingRecord,
    maps: AsnReferenceMaps,
  ): SidataAsnMappedData {
    const raw = row.rawData && typeof row.rawData === 'object' && !Array.isArray(row.rawData)
      ? this.normalizeRawDataKeys(row.rawData as Record<string, unknown>)
      : {};
    const rawJabatanCode = this.pickRaw(raw, ['jabatan_id', 'id_jabatan', 'kd_jabatan_siasn', 'kd_jabatan', 'kode_jabatan']);
    const rawTingkatPendidikanCode = this.pickRaw(raw, ['tingkat_pendidikan_id', 'tingkat pendidikan id', 'id_tingkat_pendidikan']);
    const rawTingkatPendidikanName = this.pickRaw(raw, [
      'tingkat_pendidikan_nama',
      'tingkat pendidikan nama',
      'tingkat_pendidikan',
      'tingkat pendidikan',
    ]);

    const unitKerjaId = this.findUnitKerjaIdFromMaps(maps, {
      code: row.kdUnor,
      names: this.getUnitKerjaNameCandidates(row, raw),
    });

    const jabatanId = this.findJabatanIdFromMaps(maps, {
      code: row.kdJabatan ?? row.kdJabatanSiasn ?? rawJabatanCode,
      name: row.namaJabatan,
      jenisJabatanKode: null,
      jenisJabatanNama: row.jenisJabatan,
    });

    const norm = (v: string | null | undefined) => this.normalizeText(v ?? '');
    const fromMap = (map: Map<string, string>, code: string | null | undefined, name: string | null | undefined) => {
      if (code) { const v = map.get(code); if (v) return v; }
      if (name) { return map.get(norm(name)) ?? null; }
      return null;
    };

    return {
      unitKerjaId,
      jabatanId,
      golonganId: fromMap(maps.golonganByKode, row.kdGolongan ?? row.kdGolonganSiasn, null)
        ?? fromMap(maps.golonganByNama, null, row.namaGolongan),
      pangkatId: fromMap(maps.pangkatByNama, null, row.namaRuang),
      jenisAsnId: fromMap(maps.jenisAsnByNama, null, row.jenisAsn),
      kedudukanHukumId: fromMap(maps.kedudukanHukumByNama, null, row.kedudukanHukum),
      jenisKelaminId: fromMap(maps.jenisKelaminByNama, null, row.jenisKelamin),
      agamaId: fromMap(maps.agamaByNama, null, row.agama),
      statusKawinId: fromMap(maps.statusKawinByNama, null, row.statusKawin),
      pendidikanId: fromMap(maps.pendidikanByNama, null, row.pendidikanTerakhir),
      tingkatPendidikanId:
        fromMap(maps.pendidikanTingkatByKode, rawTingkatPendidikanCode, null)
        ?? fromMap(maps.pendidikanTingkatByNama, null, rawTingkatPendidikanName)
        ?? maps.pendidikanTingkatIdByPendidikanNama.get(norm(row.pendidikanTerakhir)) ?? null,
    };
  }

  private findUnitKerjaIdFromMaps(
    maps: AsnReferenceMaps,
    params: { code: string | null; names: (string | null)[] },
  ): string | null {
    const code = params.code?.trim() || null;
    if (code) {
      const byCode =
        maps.unitKerjaByKode.get(code) ??
        maps.unitKerjaByKode.get(this.normalizeUnitKerjaCode(code));
      if (byCode) return byCode;
    }
    const names = params.names.map((n) => n?.trim() || null).filter(Boolean) as string[];
    const contextNames = new Set(names.map((name) => this.normalizeText(name)));
    for (const name of names) {
      const normalized = this.normalizeText(name);
      const candidates = maps.unitKerjaCandidatesByNama.get(normalized) ?? [];
      if (candidates.length === 1) return candidates[0].id;

      const byParentContext = candidates.find((candidate) => {
        if (!candidate.parentId) return false;
        const parentName = maps.unitKerjaParentNameById.get(candidate.id);
        return parentName ? contextNames.has(this.normalizeText(parentName)) : false;
      });
      if (byParentContext) return byParentContext.id;

      if (candidates.length === 0) {
        const byName = maps.unitKerjaByNama.get(name);
        if (byName) return byName;
        const byNorm = maps.unitKerjaByNama.get(normalized);
        if (byNorm) return byNorm;
      }
    }
    return null;
  }

  private getUnitKerjaNameCandidates(
    row: SidataAsnImportStagingRecord,
    raw: Record<string, unknown>,
  ): string[] {
    const names: string[] = [];
    const push = (value: string | null | undefined) => {
      const cleaned = value?.trim();
      if (!cleaned) return;
      names.push(cleaned);
      for (const part of cleaned.split(/\s+-\s+/).map((item) => item.trim()).filter(Boolean)) {
        names.push(part);
      }
    };

    push(this.pickRaw(raw, ['unor_nama', 'nama_unor', 'unit_organisasi_nama']));
    push(this.pickRaw(raw, ['unor_induk_nama', 'nama_unor_induk']));
    push(this.pickRaw(raw, ['satuan_kerja_nama', 'satker_nama']));
    push(this.pickRaw(raw, ['instansi_kerja_nama', 'instansi_nama']));
    push(row.namaUnorEselon4);
    push(row.namaUnorEselon3);
    push(row.namaUnorEselon2);
    push(row.namaUnorEselon1);

    return [...new Set(names)];
  }

  private findJabatanIdFromMaps(
    maps: AsnReferenceMaps,
    params: { code: string | null; name: string | null; jenisJabatanKode: string | null; jenisJabatanNama: string | null },
  ): string | null {
    const code = params.code?.trim() || null;
    const name = params.name?.trim() || null;
    const jenisKode = this.normalizeJenisJabatanKode(params.jenisJabatanKode, params.jenisJabatanNama);
    const jenisJabatanId = jenisKode ? maps.jenisJabatanByKode.get(jenisKode) : undefined;

    const matchesJenis = (entry: { jenisJabatanId: string }) =>
      !jenisJabatanId || entry.jenisJabatanId === jenisJabatanId;

    if (code) {
      const bySiasnKode = maps.jabatanBySiasnKode.get(code);
      if (bySiasnKode && matchesJenis(bySiasnKode)) return bySiasnKode.id;
      const byKode = maps.jabatanByKode.get(code);
      if (byKode && matchesJenis(byKode)) return byKode.id;
      // Fallback without jenis filter
      if (jenisJabatanId) {
        if (bySiasnKode) return bySiasnKode.id;
        if (byKode) return byKode.id;
      }
    }

    if (name) {
      const normalized = this.normalizeText(name);
      const byNorm = maps.jabatanByNormalized.find(
        (j) => j.namaNormalized === normalized && matchesJenis(j),
      ) ?? maps.jabatanByNormalized.find((j) => j.namaNormalized === normalized);
      if (byNorm) return byNorm.id;

      const stripped = this.stripPunctuation(name);
      const byStripped = maps.jabatanByNormalized.find(
        (j) => this.stripPunctuation(j.namaNormalized) === stripped && matchesJenis(j),
      ) ?? maps.jabatanByNormalized.find((j) => this.stripPunctuation(j.namaNormalized) === stripped);
      if (byStripped) return byStripped.id;

      const guruLamaTarget = this.GURU_LAMA_MAP[name.trim().toUpperCase()];
      if (guruLamaTarget) {
        const normTarget = this.normalizeText(guruLamaTarget);
        const byGuru = maps.jabatanByNormalized.find((j) => j.namaNormalized === normTarget && matchesJenis(j))
          ?? maps.jabatanByNormalized.find((j) => j.namaNormalized === normTarget);
        if (byGuru) return byGuru.id;
      }

      const namaJenjangTarget = this.toNamaJenjangJabatan(name);
      if (namaJenjangTarget) {
        const normTarget = this.normalizeText(namaJenjangTarget);
        const byNJ = maps.jabatanByNormalized.find((j) => j.namaNormalized === normTarget && matchesJenis(j))
          ?? maps.jabatanByNormalized.find((j) => j.namaNormalized === normTarget);
        if (byNJ) return byNJ.id;
      }

      const abbrevTarget = this.toAsnAbbreviationJabatan(name);
      if (abbrevTarget) {
        const normTarget = this.normalizeText(abbrevTarget);
        const byAbbrev = maps.jabatanByNormalized.find((j) => j.namaNormalized === normTarget && matchesJenis(j))
          ?? maps.jabatanByNormalized.find((j) => j.namaNormalized === normTarget);
        if (byAbbrev) return byAbbrev.id;
      }
    }

    return null;
  }

  private async resolveAsnMappedDataInTx(
    tx: Prisma.TransactionClient,
    row: SidataAsnImportStagingRecord,
  ): Promise<SidataAsnMappedData> {
    const raw = row.rawData && typeof row.rawData === 'object' && !Array.isArray(row.rawData)
      ? this.normalizeRawDataKeys(row.rawData as Record<string, unknown>)
      : {};
    const rawJabatanCode = this.pickRaw(raw, [
      'jabatan_id',
      'id_jabatan',
      'kd_jabatan_siasn',
      'kd_jabatan',
      'kode_jabatan',
    ]);
    const rawTingkatPendidikanCode = this.pickRaw(raw, ['tingkat_pendidikan_id', 'tingkat pendidikan id', 'id_tingkat_pendidikan']);
    const rawTingkatPendidikanName = this.pickRaw(raw, [
      'tingkat_pendidikan_nama',
      'tingkat pendidikan nama',
      'tingkat_pendidikan',
      'tingkat pendidikan',
    ]);

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
      tingkatPendidikanIdByRaw,
    ] = await Promise.all([
      this.findUnitKerjaIdInTx(tx, {
        code: row.kdUnor,
        names: [row.namaUnorEselon4, row.namaUnorEselon3, row.namaUnorEselon2, row.namaUnorEselon1],
      }),
      this.findJabatanIdInTx(tx, {
        code: row.kdJabatan ?? row.kdJabatanSiasn ?? rawJabatanCode,
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
      this.findSimpleRefIdInTx(tx, {
        model: 'refPendidikanTingkat',
        code: rawTingkatPendidikanCode,
        name: rawTingkatPendidikanName ?? row.pendidikanTerakhir,
      }),
    ]);
    const tingkatPendidikanId =
      tingkatPendidikanIdByRaw
      ?? (pendidikanId ? await this.findPendidikanTingkatIdFromPendidikanInTx(tx, pendidikanId) : null);

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
      tingkatPendidikanId,
    };
  }

  private async findUnitKerjaIdInTx(
    tx: Prisma.TransactionClient,
    params: { code: string | null; names: (string | null)[] },
  ): Promise<string | null> {
    const code = params.code?.trim() || null;
    const names = params.names.map((n) => n?.trim() || null).filter(Boolean) as string[];

    if (code) {
      const byCode = await tx.unitKerja.findFirst({
        where: { kode: code, deletedAt: null },
        select: simpleIdSelect,
      });
      if (byCode) return byCode.id;
    }

    if (names.length > 0) {
      // Try exact match for each name (most specific first)
      for (const name of names) {
        const byName = await tx.unitKerja.findFirst({
          where: { nama: name, deletedAt: null },
          select: simpleIdSelect,
        });
        if (byName) return byName.id;
      }

      // Fuzzy normalized match — load all once, try each name
      const allUnits = await tx.unitKerja.findMany({
        where: { deletedAt: null },
        select: { id: true, nama: true },
        take: 5000,
      });
      for (const name of names) {
        const normalized = this.normalizeText(name);
        const fuzzy = allUnits.find((c) => this.normalizeText(c.nama) === normalized);
        if (fuzzy) return fuzzy.id;
      }
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

      // SIASN job IDs are authoritative and unique. Some PPPK rows have
      // inconsistent jenis jabatan metadata, so fall back to the ID alone.
      if (jenisJabatan) {
        const byAnySiasnCode = await tx.refJabatan.findFirst({
          where: { siasnKode: code, deletedAt: null },
          select: simpleIdSelect,
        });
        if (byAnySiasnCode) return byAnySiasnCode.id;

        const byAnyKode = await tx.refJabatan.findFirst({
          where: { kode: code, deletedAt: null },
          select: simpleIdSelect,
        });
        if (byAnyKode) return byAnyKode.id;
      }
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

      // Fuzzy fallback: strip punctuation (handles "Guru Madya Tingkat. I" vs "Guru Madya Tingkat I")
      const stripped = this.stripPunctuation(name);
      const allCandidates = await tx.refJabatan.findMany({
        where: { ...jenisFilter, deletedAt: null },
        select: { id: true, namaNormalized: true },
        take: 10000,
      });
      const fuzzy = allCandidates.find(
        (c) => c.namaNormalized && this.stripPunctuation(c.namaNormalized) === stripped,
      );
      if (fuzzy) return fuzzy.id;

      // GURU_LAMA_MAP fallback: nama jabatan lama SIASN → nama baru di ref_jabatan
      const guruLamaTarget = this.GURU_LAMA_MAP[name.trim().toUpperCase()];
      if (guruLamaTarget) {
        const normalized = this.normalizeText(guruLamaTarget);
        const byGuruLama = await tx.refJabatan.findFirst({
          where: { namaNormalized: normalized, ...jenisFilter, deletedAt: null },
          select: simpleIdSelect,
        });
        if (byGuruLama) return byGuruLama.id;
      }

      // PPPK SIASN sometimes sends "JENJANG - NAMA"; ref_jabatan stores "NAMA JENJANG".
      const namaJenjangTarget = this.toNamaJenjangJabatan(name);
      if (namaJenjangTarget) {
        const normalized = this.normalizeText(namaJenjangTarget);
        const byNamaJenjang = await tx.refJabatan.findFirst({
          where: { namaNormalized: normalized, ...jenisFilter, deletedAt: null },
          select: simpleIdSelect,
        });
        if (byNamaJenjang) return byNamaJenjang.id;
      }

      const asnAbbreviationTarget = this.toAsnAbbreviationJabatan(name);
      if (asnAbbreviationTarget) {
        const normalized = this.normalizeText(asnAbbreviationTarget);
        const byAsnAbbreviation = await tx.refJabatan.findFirst({
          where: { namaNormalized: normalized, ...jenisFilter, deletedAt: null },
          select: simpleIdSelect,
        });
        if (byAsnAbbreviation) return byAsnAbbreviation.id;
      }
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
        | 'refPendidikanTingkat'
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

  private async findPendidikanTingkatIdFromPendidikanInTx(
    tx: Prisma.TransactionClient,
    pendidikanId: string,
  ): Promise<string | null> {
    const pendidikan = await tx.refPendidikan.findFirst({
      where: { id: pendidikanId, deletedAt: null },
      select: { tingkatPendidikanId: true },
    });

    return pendidikan?.tingkatPendidikanId ?? null;
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
    skipClaim?: boolean;
  }): Promise<CommitSiasnAsnBatchResult> {
    if (!params.skipClaim) {
      const claimed = await this.claimAsnBatch(params.batchId);
      if (!claimed) throw new Error('BATCH_ALREADY_PROCESSING_OR_COMMITTED');
    }

    const batchRecord = await this.prisma.sidataAsnImportBatch.findUnique({
      where: { id: params.batchId },
      select: asnImportBatchSelect,
    });

    if (!batchRecord) throw new Error('ASN_BATCH_NOT_FOUND');

    const tipePegawai = this.tipePegawaiFromImportType(batchRecord.importType);
    const stagingRows = await this.prisma.sidataAsnImportStaging.findMany({
      where: { batchId: params.batchId },
      orderBy: { rowNumber: 'asc' },
      select: asnImportStagingSelect,
    });

    const unsafeRows = stagingRows.reduce(
      (summary, row) => {
        if (row.validationStatus === SIDATA_VALIDATION_STATUS.INVALID || !row.nip || !row.nama) {
          summary.invalidRows += 1;
        }
        if (row.mappingStatus === SIDATA_ASN_MAP_STATUS.NEEDS_REVIEW) {
          summary.needsReviewRows += 1;
        } else if (row.mappingStatus === SIDATA_ASN_MAP_STATUS.UNMAPPED || row.mappingStatus !== SIDATA_ASN_MAP_STATUS.MAPPED) {
          summary.unmappedRows += 1;
        }
        return summary;
      },
      { invalidRows: 0, needsReviewRows: 0, unmappedRows: 0 },
    );

    if (
      unsafeRows.invalidRows > 0
      || unsafeRows.needsReviewRows > 0
      || unsafeRows.unmappedRows > 0
    ) {
      await this.prisma.sidataAsnImportBatch.update({
        where: { id: params.batchId },
        data: {
          status: SIDATA_IMPORT_STATUS.VALIDATED,
          finishedAt: new Date(),
          errorMessage: 'Batch belum aman untuk commit: masih ada invalid/needs review/unmapped rows.',
        },
      });
      throw new Error('Batch belum aman untuk commit: masih ada invalid/needs review/unmapped rows.');
    }

    let eligibleRows = 0;
    let committedRows = 0;
    let createdRows = 0;
    let updatedRows = 0;
    let skippedRows = 0;
    let invalidRows = 0;
    let needsReviewRows = 0;
    let unmappedRows = 0;

    for (const chunk of this.chunkArray(stagingRows, SidataImportRepository.ASN_JOB_CHUNK_SIZE)) {
      const chunkResult = await this.prisma.$transaction(
        (tx) =>
          this.commitSiasnAsnRowsChunkInTx(tx, {
            rows: chunk,
            batchId: params.batchId,
            importType: batchRecord.importType,
            tipePegawai,
          }),
        { timeout: 60_000, maxWait: 10_000 },
      );

      eligibleRows += chunkResult.eligibleRows;
      committedRows += chunkResult.committedRows;
      createdRows += chunkResult.createdRows;
      updatedRows += chunkResult.updatedRows;
      skippedRows += chunkResult.skippedRows;
      invalidRows += chunkResult.invalidRows;
      needsReviewRows += chunkResult.needsReviewRows;
      unmappedRows += chunkResult.unmappedRows;

      await this.yieldToEventLoop();
    }

    await this.prisma.sidataAsnImportBatch.update({
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
      eligibleRows,
      committedRows,
      createdRows,
      updatedRows,
      skippedRows,
      invalidRows,
      needsReviewRows,
      unmappedRows,
    };

  }

  private async commitSiasnAsnRowsChunkInTx(
    tx: Prisma.TransactionClient,
    params: {
      rows: SidataAsnImportStagingRecord[];
      batchId: string;
      importType: string;
      tipePegawai: string | null;
    },
  ): Promise<{
    eligibleRows: number;
    committedRows: number;
    createdRows: number;
    updatedRows: number;
    skippedRows: number;
    invalidRows: number;
    needsReviewRows: number;
    unmappedRows: number;
  }> {
    let eligibleRows = 0;
    let committedRows = 0;
    let createdRows = 0;
    let updatedRows = 0;
    let skippedRows = 0;
    let invalidRows = 0;
    let needsReviewRows = 0;
    let unmappedRows = 0;

    for (const row of params.rows) {
      if (row.validationStatus === SIDATA_VALIDATION_STATUS.INVALID || !row.nip || !row.nama) {
        invalidRows += 1;
        skippedRows += 1;
        continue;
      }

      if (row.mappingStatus === SIDATA_ASN_MAP_STATUS.NEEDS_REVIEW) {
        needsReviewRows += 1;
        skippedRows += 1;
        continue;
      } else if (row.mappingStatus === SIDATA_ASN_MAP_STATUS.UNMAPPED) {
        unmappedRows += 1;
        skippedRows += 1;
        continue;
      } else if (row.mappingStatus !== SIDATA_ASN_MAP_STATUS.MAPPED) {
        unmappedRows += 1;
        skippedRows += 1;
        continue;
      }

      eligibleRows += 1;

      const mappedData = this.parseMappedData(row.mappedData);
      const commitResult = await this.upsertAsnFromStagingInTx(tx, {
        row,
        mappedData,
        tipePegawai: params.tipePegawai,
        batchId: params.batchId,
        importType: params.importType,
      });

      await tx.sidataAsnImportStaging.update({
        where: { id: row.id },
        data: {
          matchedAsnId: commitResult.asnId,
          mappingStatus: SIDATA_ASN_MAP_STATUS.MAPPED,
        },
      });

      if (commitResult.action === SIDATA_ASN_COMMIT_ACTION.SKIPPED) {
        skippedRows += 1;
        continue;
      }

      committedRows += 1;
      if (commitResult.action === SIDATA_ASN_COMMIT_ACTION.CREATED) createdRows += 1;
      if (commitResult.action === SIDATA_ASN_COMMIT_ACTION.UPDATED) updatedRows += 1;
    }

    return {
      eligibleRows,
      committedRows,
      createdRows,
      updatedRows,
      skippedRows,
      invalidRows,
      needsReviewRows,
      unmappedRows,
    };
  }

  private async upsertAsnFromStagingInTx(
    tx: Prisma.TransactionClient,
    params: {
      row: SidataAsnImportStagingRecord;
      mappedData: SiasnAsnMappedDataForCommit;
      tipePegawai: string | null;
      batchId: string;
      importType: string;
    },
  ): Promise<{ asnId: string; action: 'CREATED' | 'UPDATED' | 'SKIPPED' }> {
    const { row } = params;

    const existing = row.matchedAsnId
      ? await tx.asn.findFirst({
          where: { id: row.matchedAsnId, deletedAt: null },
          select: asnImportCompareSelect,
        })
      : await tx.asn.findFirst({
          where: { nip: row.nip ?? '', deletedAt: null },
          select: asnImportCompareSelect,
        });

    const safeData = this.buildAsnSafeDataFromStaging(params);

    if (existing) {
      if (this.hasProtectedLocalCorrectionConflict(existing, safeData)) {
        await tx.asn.update({
          where: { id: existing.id },
          data: {
            syncStatus: 'CONFLICT',
            needsReview: true,
            reviewNote:
              'Data SIASN terbaru berbeda dengan data SIDATA yang memiliki koreksi lokal. Review manual sebelum memperbarui master ASN.',
            lastSiasnBatchId: params.batchId,
            lastSiasnSyncedAt: new Date(),
            updatedAt: new Date(),
          },
          select: simpleIdSelect,
        });

        await this.createAsnChangeLogsInTx(tx, {
          asnId: existing.id,
          before: existing,
          after: safeData,
          source: 'SIASN_IMPORT',
          sourceBatchId: params.batchId,
          reason: 'Import SIASN mendeteksi konflik dengan koreksi lokal SIDATA.',
          metadata: {
            rowId: row.id,
            rowNumber: row.rowNumber,
            importType: params.importType,
            syncStatus: 'CONFLICT',
          },
        });

        return { asnId: existing.id, action: SIDATA_ASN_COMMIT_ACTION.SKIPPED };
      }

      const updated = await tx.asn.update({
        where: { id: existing.id },
        data: safeData,
        select: simpleIdSelect,
      });
      await this.createAsnChangeLogsInTx(tx, {
        asnId: updated.id,
        before: existing,
        after: safeData,
        source: 'SIASN_IMPORT',
        sourceBatchId: params.batchId,
        reason: 'Pemutakhiran dari import SIASN yang sudah melewati validasi dan mapping.',
        metadata: {
          rowId: row.id,
          rowNumber: row.rowNumber,
          importType: params.importType,
        },
      });
      await this.upsertAsnEnterpriseRecordsInTx(tx, {
        ...params,
        asnId: updated.id,
      });
      return { asnId: updated.id, action: SIDATA_ASN_COMMIT_ACTION.UPDATED };
    }

    const created = await tx.asn.create({
      data: { id: randomUUID(), ...safeData },
      select: simpleIdSelect,
    });
    await tx.asnChangeLog.create({
      data: {
        id: randomUUID(),
        asnId: created.id,
        fieldName: '*',
        oldValue: null,
        newValue: row.nip ?? row.nama ?? created.id,
        source: 'SIASN_IMPORT',
        sourceBatchId: params.batchId,
        reason: 'ASN baru dibuat dari import SIASN.',
        metadata: {
          rowId: row.id,
          rowNumber: row.rowNumber,
          importType: params.importType,
          action: SIDATA_ASN_COMMIT_ACTION.CREATED,
        },
      },
    });
    await this.upsertAsnEnterpriseRecordsInTx(tx, {
      ...params,
      asnId: created.id,
    });
    return { asnId: created.id, action: SIDATA_ASN_COMMIT_ACTION.CREATED };
  }

  private buildAsnSafeDataFromStaging(params: {
    row: SidataAsnImportStagingRecord;
    mappedData: SiasnAsnMappedDataForCommit;
    tipePegawai: string | null;
    batchId?: string;
    importType?: string;
  }) {
    const { row, mappedData, tipePegawai } = params;
    const raw = row.rawData && typeof row.rawData === 'object' && !Array.isArray(row.rawData)
      ? this.normalizeRawDataKeys(row.rawData as Record<string, unknown>)
      : {};
    const siasnJabatanId = row.kdJabatan ?? row.kdJabatanSiasn ?? this.rawString(raw, ['jabatan_id']);
    const siasnUnorId = row.kdUnor ?? this.rawString(raw, ['unor_id']);
    const siasnGolonganId = row.kdGolongan ?? row.kdGolonganSiasn ?? this.rawString(raw, ['gol_akhir_id', 'golongan_akhir_id']);
    const golonganAkhirNama = this.rawString(raw, ['gol_akhir_nama', 'golongan_akhir_nama']) ?? row.namaGolongan;
    const jenisAsnNama = row.jenisAsn ?? this.rawString(raw, ['jenis_pegawai_nama', 'jenis_asn_nama']);
    const kedudukanHukumNama = row.kedudukanHukum ?? this.rawString(raw, ['kedudukan_hukum_nama']);
    const masaKerjaSeluruh = this.parseMasaKerja(
      row.masaKerjaSeluruh
      ?? this.rawString(raw, ['masa_kerja_seluruh', 'masa kerja seluruh', 'masa_kerja_total', 'total_masa_kerja']),
    );
    const masaKerjaTahun = row.masaKerjaTahun ?? this.rawInt(raw, [
      'mk_tahun_seluruh',
      'mk_tahun',
      'masa_kerja_tahun',
      'masa kerja tahun',
      'masa_kerja_tahun_seluruh',
    ]) ?? masaKerjaSeluruh.tahun;
    const masaKerjaBulan = row.masaKerjaBulan ?? this.rawInt(raw, [
      'mk_bulan_seluruh',
      'mk_bulan',
      'masa_kerja_bulan',
      'masa kerja bulan',
      'masa_kerja_bulan_seluruh',
    ]) ?? masaKerjaSeluruh.bulan;
    const masaKerjaTotalBulan = masaKerjaTahun !== null || masaKerjaBulan !== null
      ? (masaKerjaTahun ?? 0) * 12 + (masaKerjaBulan ?? 0)
      : null;
    const tingkatPendidikanNama = this.rawString(raw, [
      'tingkat_pendidikan_nama',
      'tingkat pendidikan nama',
      'tingkat_pendidikan',
      'tingkat pendidikan',
    ]);
    const pendidikanNama = row.pendidikanTerakhir ?? this.rawString(raw, [
      'pendidikan_nama',
      'pendidikan nama',
      'pendidikan_terakhir',
      'pendidikan terakhir',
      'pendidikan',
    ]);
    const tahunLulus = row.tahunLulus ?? this.rawInt(raw, ['tahun_lulus', 'tahun lulus']);
    const detailStatusNama = this.rawString(raw, [
      'detail_status_nama',
      'detail status nama',
      'status_detail',
      'status detail',
      'status_pegawai',
      'status pegawai',
      'status_cpns_pns',
    ]) ?? row.statusKepegawaian ?? kedudukanHukumNama;

    const currentData = {
      siasnPnsId: this.rawString(raw, ['pns_id']),
      nip: row.nip ?? '',
      nipLama: row.nipLama,
      nik: this.rawString(raw, ['nik']),
      nama: row.nama ?? '',
      namaSearch: this.normalizeText(row.nama ?? ''),
      gelarDepan: this.rawString(raw, ['gelar_depan']),
      gelarBelakang: this.rawString(raw, ['gelar_belakang']),
      tipePegawai: tipePegawai ?? undefined,
      jenisAsnRefId: mappedData.jenisAsnId ?? null,
      jenisAsnNama,
      statusAsn: row.statusKepegawaian ?? kedudukanHukumNama,
      isActive: !row.tmtPensiun || new Date(row.tmtPensiun) > new Date(),
      kedudukanHukumRefId: mappedData.kedudukanHukumId ?? null,
      kedudukanHukumNama,
      tmtPensiun: row.tmtPensiun,
      unitKerjaId: mappedData.unitKerjaId ?? null,
      siasnUnorId,
      unorNama: row.unorNama ?? this.rawString(raw, ['unor_nama']),
      jabatanRefId: mappedData.jabatanId ?? null,
      siasnJabatanId,
      jenisJabatanNama: row.jenisJabatan,
      jabatanNama: row.namaJabatan,
      tmtJabatan: row.tmtJabatan,
      golonganRefId: mappedData.golonganId ?? null,
      siasnGolonganId,
      golonganNama: golonganAkhirNama,
      tmtGolongan: row.tmtGolongan,
      masaKerjaTahun,
      masaKerjaBulan,
      masaKerjaTotalBulan,
      kelasJabatan: this.rawInt(raw, ['kelas_jabatan', 'kelas jabatan']),
      siasnEselonId: row.siasnEselonId ?? this.rawString(raw, ['eselon_id', 'eselon id', 'id_eselon']),
      eselonNama: row.eselonNama
        ?? this.rawString(raw, ['eselon_nama', 'eselon nama', 'eselon'])
        ?? this.inferEselonNama(row.namaJabatan, row.jenisJabatan),
      namaUnorEselon1: row.namaUnorEselon1,
      namaUnorEselon2: row.namaUnorEselon2,
      namaUnorEselon3: row.namaUnorEselon3,
      namaUnorEselon4: row.namaUnorEselon4,
      pangkatNama: row.namaPangkat ?? row.namaRuang,
      ruangNama: row.namaRuang,
      nomorSk: row.nomorSkJabatan ?? row.noSk,
      tanggalSk: row.tanggalSkJabatan ?? row.tanggalSk,
      nomorPerjanjianKerja: row.nomorPerjanjianKerja,
      tmtPerjanjianKerja: row.tmtPerjanjianKerja,
      akhirPerjanjianKerja: row.akhirPerjanjianKerja,
      masaHubunganKerjaBulan: row.masaHubunganKerjaBulan,
      jenisPegawaiNama: jenisAsnNama,
      detailStatusNama,
      pendidikanRefId: mappedData.pendidikanId ?? null,
      pendidikanNama,
      tingkatPendidikanRefId: mappedData.tingkatPendidikanId ?? null,
      tingkatPendidikanNama,
      tahunLulus,
      namaSekolah: row.namaSekolah,
      sourceBatchId: params.batchId ?? null,
      syncStatus: 'SYNCED',
      lastSiasnBatchId: params.batchId ?? null,
      lastSiasnSyncedAt: new Date(),
      needsReview: false,
      reviewNote: null,
      deletedAt: null,
    };

    return {
      ...currentData,
      syncedAt: new Date(),
      checksum: this.checksumJson(currentData),
    };
  }

  private hasProtectedLocalCorrectionConflict(
    existing: AsnImportCompareRecord,
    incoming: Record<string, unknown>,
  ): boolean {
    if (
      existing.syncStatus !== 'LOCAL_CORRECTION'
      && existing.syncStatus !== 'PENDING_SIASN_UPDATE'
    ) {
      return false;
    }

    return Boolean(existing.checksum && incoming.checksum && existing.checksum !== incoming.checksum);
  }

  private async createAsnChangeLogsInTx(
    tx: Prisma.TransactionClient,
    params: {
      asnId: string;
      before: AsnImportCompareRecord;
      after: Record<string, unknown>;
      source: string;
      sourceBatchId?: string | null;
      reason?: string | null;
      metadata?: Record<string, unknown>;
    },
  ): Promise<void> {
    const changes = this.getTrackedAsnFieldChanges(params.before, params.after);

    if (changes.length === 0) {
      return;
    }

    await tx.asnChangeLog.createMany({
      data: changes.map((change) => ({
        id: randomUUID(),
        asnId: params.asnId,
        fieldName: change.fieldName,
        oldValue: change.oldValue,
        newValue: change.newValue,
        source: params.source,
        sourceBatchId: params.sourceBatchId ?? null,
        reason: params.reason ?? null,
        metadata: params.metadata
          ? (params.metadata as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      })),
    });
  }

  private getTrackedAsnFieldChanges(
    before: AsnImportCompareRecord,
    after: Record<string, unknown>,
  ): Array<{ fieldName: string; oldValue: string | null; newValue: string | null }> {
    const fields: Array<keyof AsnImportCompareRecord> = [
      'nip',
      'nipLama',
      'nik',
      'nama',
      'tipePegawai',
      'statusAsn',
      'isActive',
      'kedudukanHukumRefId',
      'kedudukanHukumNama',
      'tmtPensiun',
      'unitKerjaId',
      'siasnUnorId',
      'unorNama',
      'jabatanRefId',
      'siasnJabatanId',
      'jabatanNama',
      'jenisJabatanNama',
      'tmtJabatan',
      'golonganRefId',
      'siasnGolonganId',
      'golonganNama',
      'tmtGolongan',
      'pendidikanRefId',
      'pendidikanNama',
      'tingkatPendidikanRefId',
      'tingkatPendidikanNama',
      'tmtPerjanjianKerja',
      'akhirPerjanjianKerja',
    ];

    return fields.flatMap((fieldName) => {
      const oldValue = this.stringifyAsnChangeValue(before[fieldName]);
      const newValue = this.stringifyAsnChangeValue(
        after[fieldName as keyof typeof after],
      );

      return oldValue === newValue
        ? []
        : [{ fieldName: String(fieldName), oldValue, newValue }];
    });
  }

  private stringifyAsnChangeValue(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    return String(value);
  }

  private async upsertAsnEnterpriseRecordsInTx(
    tx: Prisma.TransactionClient,
    params: {
      asnId: string;
      batchId: string;
      importType: string;
      row: SidataAsnImportStagingRecord;
      mappedData: SiasnAsnMappedDataForCommit;
      tipePegawai: string | null;
    },
  ): Promise<void> {
    const { asnId, batchId, importType, row, mappedData, tipePegawai } = params;
    const raw = row.rawData && typeof row.rawData === 'object' && !Array.isArray(row.rawData)
      ? this.normalizeRawDataKeys(row.rawData as Record<string, unknown>)
      : {};
    const rawData = row.rawData as Prisma.InputJsonValue;
    const mappedJson = row.mappedData
      ? (row.mappedData as Prisma.InputJsonValue)
      : Prisma.JsonNull;
    const profileData = this.buildSiasnProfileData(row, mappedData, tipePegawai, raw);
    const rawChecksum = this.checksumJson({ rawData: row.rawData, mappedData: row.mappedData });
    const now = new Date();
    const siasnPnsId = this.rawString(raw, ['pns_id']);
    const siasnUnorId = row.kdUnor ?? this.rawString(raw, ['unor_id']);
    const siasnJabatanId = row.kdJabatan ?? row.kdJabatanSiasn ?? this.rawString(raw, ['jabatan_id']);
    const siasnGolonganId = row.kdGolongan ?? row.kdGolonganSiasn ?? this.rawString(raw, ['gol_akhir_id', 'golongan_akhir_id']);
    const golonganAkhirNama = this.rawString(raw, ['gol_akhir_nama', 'golongan_akhir_nama']) ?? row.namaGolongan;
    const siasnPendidikanId = this.rawString(raw, ['pendidikan_id']);
    const siasnTingkatPendidikanId = this.rawString(raw, ['tingkat_pendidikan_id']);
    const tingkatPendidikanNama = this.rawString(raw, [
      'tingkat_pendidikan_nama',
      'tingkat pendidikan nama',
      'tingkat_pendidikan',
      'tingkat pendidikan',
    ]);
    const pendidikanNama = row.pendidikanTerakhir ?? this.rawString(raw, [
      'pendidikan_nama',
      'pendidikan nama',
      'pendidikan_terakhir',
      'pendidikan terakhir',
      'pendidikan',
    ]);
    const tahunLulus = row.tahunLulus ?? this.rawInt(raw, ['tahun_lulus', 'tahun lulus']);

    await tx.asnSiasnProfile.upsert({
      where: { asnId },
      create: {
        id: randomUUID(),
        asnId,
        sourceBatchId: batchId,
        siasnPnsId,
        email: row.email ?? this.rawString(raw, ['email']),
        emailGov: row.emailGov ?? this.rawString(raw, ['email_gov']),
        phone: row.nomorHp ?? this.rawString(raw, ['nomor_hp', 'no_hp', 'phone']),
        alamat: row.alamat ?? this.rawString(raw, ['alamat']),
        npwpNomor: row.npwpNomor ?? this.rawString(raw, ['npwp_nomor', 'npwp']),
        bpjsNomor: row.bpjsNomor ?? this.rawString(raw, ['bpjs', 'bpjs_nomor']),
        tempatLahirId: this.rawString(raw, ['tempat_lahir_id']),
        tempatLahirNama: row.tempatLahir ?? this.rawString(raw, ['tempat_lahir_nama']),
        tanggalLahir: row.tanggalLahir,
        jenisKelaminRefId: mappedData.jenisKelaminId ?? null,
        siasnJenisKelaminId: this.rawString(raw, ['jenis_kelamin_id']),
        jenisKelaminNama: row.jenisKelamin,
        agamaRefId: mappedData.agamaId ?? null,
        siasnAgamaId: this.rawString(raw, ['agama_id']),
        agamaNama: row.agama ?? this.rawString(raw, ['agama_nama']),
        statusKawinRefId: mappedData.statusKawinId ?? null,
        siasnStatusKawinId: this.rawString(raw, ['jenis_kawin_id', 'status_kawin_id']),
        statusKawinNama: row.statusKawin,
        siasnJenisPegawaiId: this.rawString(raw, ['jenis_pegawai_id', 'jenis_asn_id']),
        jenisPegawaiNama: row.jenisAsn ?? this.rawString(raw, ['jenis_pegawai_nama', 'jenis_asn_nama']),
        kedudukanHukumRefId: mappedData.kedudukanHukumId ?? null,
        siasnKedudukanHukumId: this.rawString(raw, ['kedudukan_hukum_id']),
        kedudukanHukumNama: row.kedudukanHukum ?? this.rawString(raw, ['kedudukan_hukum_nama']),
        statusCpnsPns: this.rawString(raw, ['status_cpns_pns']),
        kartuAsnVirtual: this.rawString(raw, ['kartu_asn_virtual']),
        nomorSkCpns: this.rawString(raw, ['nomor_sk_cpns']),
        tanggalSkCpns: this.rawDate(raw, ['tanggal_sk_cpns']),
        tmtCpns: this.rawDate(raw, ['tmt_cpns']),
        nomorSkPns: this.rawString(raw, ['nomor_sk_pns']) ?? row.noSk,
        tanggalSkPns: this.rawDate(raw, ['tanggal_sk_pns']) ?? row.tanggalSk,
        tmtPns: row.tmtPns,
        tmtPensiun: row.tmtPensiun,
        kpknId: this.rawString(raw, ['kpkn_id']),
        kpknNama: this.rawString(raw, ['kpkn_nama']),
        lokasiKerjaId: this.rawString(raw, ['lokasi_kerja_id']),
        lokasiKerjaNama: this.rawString(raw, ['lokasi_kerja_nama']),
        siasnUnorId,
        unorNama: row.unorNama ?? this.rawString(raw, ['unor_nama']),
        instansiIndukId: this.rawString(raw, ['instansi_induk_id']),
        instansiIndukNama: this.rawString(raw, ['instansi_induk_nama']),
        instansiKerjaId: this.rawString(raw, ['instansi_kerja_id']),
        instansiKerjaNama: this.rawString(raw, ['instansi_kerja_nama']),
        satuanKerjaIndukId: this.rawString(raw, ['satuan_kerja_induk_id']),
        satuanKerjaIndukNama: this.rawString(raw, ['satuan_kerja_induk_nama']),
        satuanKerjaKerjaId: this.rawString(raw, ['satuan_kerja_kerja_id']),
        satuanKerjaKerjaNama: this.rawString(raw, ['satuan_kerja_kerja_nama']),
        isValidNik: this.rawString(raw, ['is_valid_nik']),
        flagIkd: this.rawString(raw, ['flag_ikd']),
        profileData,
        rawData,
        checksum: rawChecksum,
        syncedAt: now,
        deletedAt: null,
      },
      update: {
        sourceBatchId: batchId,
        siasnPnsId,
        email: row.email ?? this.rawString(raw, ['email']),
        emailGov: row.emailGov ?? this.rawString(raw, ['email_gov']),
        phone: row.nomorHp ?? this.rawString(raw, ['nomor_hp', 'no_hp', 'phone']),
        alamat: row.alamat ?? this.rawString(raw, ['alamat']),
        npwpNomor: row.npwpNomor ?? this.rawString(raw, ['npwp_nomor', 'npwp']),
        bpjsNomor: row.bpjsNomor ?? this.rawString(raw, ['bpjs', 'bpjs_nomor']),
        tempatLahirId: this.rawString(raw, ['tempat_lahir_id']),
        tempatLahirNama: row.tempatLahir ?? this.rawString(raw, ['tempat_lahir_nama']),
        tanggalLahir: row.tanggalLahir,
        jenisKelaminRefId: mappedData.jenisKelaminId ?? null,
        siasnJenisKelaminId: this.rawString(raw, ['jenis_kelamin_id']),
        jenisKelaminNama: row.jenisKelamin,
        agamaRefId: mappedData.agamaId ?? null,
        siasnAgamaId: this.rawString(raw, ['agama_id']),
        agamaNama: row.agama ?? this.rawString(raw, ['agama_nama']),
        statusKawinRefId: mappedData.statusKawinId ?? null,
        siasnStatusKawinId: this.rawString(raw, ['jenis_kawin_id', 'status_kawin_id']),
        statusKawinNama: row.statusKawin,
        siasnJenisPegawaiId: this.rawString(raw, ['jenis_pegawai_id', 'jenis_asn_id']),
        jenisPegawaiNama: row.jenisAsn ?? this.rawString(raw, ['jenis_pegawai_nama', 'jenis_asn_nama']),
        kedudukanHukumRefId: mappedData.kedudukanHukumId ?? null,
        siasnKedudukanHukumId: this.rawString(raw, ['kedudukan_hukum_id']),
        kedudukanHukumNama: row.kedudukanHukum ?? this.rawString(raw, ['kedudukan_hukum_nama']),
        statusCpnsPns: this.rawString(raw, ['status_cpns_pns']),
        kartuAsnVirtual: this.rawString(raw, ['kartu_asn_virtual']),
        nomorSkCpns: this.rawString(raw, ['nomor_sk_cpns']),
        tanggalSkCpns: this.rawDate(raw, ['tanggal_sk_cpns']),
        tmtCpns: this.rawDate(raw, ['tmt_cpns']),
        nomorSkPns: this.rawString(raw, ['nomor_sk_pns']) ?? row.noSk,
        tanggalSkPns: this.rawDate(raw, ['tanggal_sk_pns']) ?? row.tanggalSk,
        tmtPns: row.tmtPns,
        tmtPensiun: row.tmtPensiun,
        kpknId: this.rawString(raw, ['kpkn_id']),
        kpknNama: this.rawString(raw, ['kpkn_nama']),
        lokasiKerjaId: this.rawString(raw, ['lokasi_kerja_id']),
        lokasiKerjaNama: this.rawString(raw, ['lokasi_kerja_nama']),
        siasnUnorId,
        unorNama: row.unorNama ?? this.rawString(raw, ['unor_nama']),
        instansiIndukId: this.rawString(raw, ['instansi_induk_id']),
        instansiIndukNama: this.rawString(raw, ['instansi_induk_nama']),
        instansiKerjaId: this.rawString(raw, ['instansi_kerja_id']),
        instansiKerjaNama: this.rawString(raw, ['instansi_kerja_nama']),
        satuanKerjaIndukId: this.rawString(raw, ['satuan_kerja_induk_id']),
        satuanKerjaIndukNama: this.rawString(raw, ['satuan_kerja_induk_nama']),
        satuanKerjaKerjaId: this.rawString(raw, ['satuan_kerja_kerja_id']),
        satuanKerjaKerjaNama: this.rawString(raw, ['satuan_kerja_kerja_nama']),
        isValidNik: this.rawString(raw, ['is_valid_nik']),
        flagIkd: this.rawString(raw, ['flag_ikd']),
        profileData,
        rawData,
        checksum: rawChecksum,
        syncedAt: now,
        deletedAt: null,
      },
    });

    await tx.asnImportSnapshot.upsert({
      where: { asnId_sourceBatchId: { asnId, sourceBatchId: batchId } },
      create: {
        id: randomUUID(),
        asnId,
        sourceBatchId: batchId,
        rowNumber: row.rowNumber,
        importType,
        nip: row.nip,
        rawData,
        mappedData: mappedJson,
        checksum: rawChecksum,
        syncedAt: now,
        deletedAt: null,
      },
      update: {
        rowNumber: row.rowNumber,
        importType,
        nip: row.nip,
        rawData,
        mappedData: mappedJson,
        checksum: rawChecksum,
        syncedAt: now,
        deletedAt: null,
      },
    });

    const assignmentRawData = this.buildAssignmentHistoryData(row, mappedData, raw);
    const assignmentChecksum = this.checksumJson(assignmentRawData);
    const assignmentData = {
      unitKerjaId: mappedData.unitKerjaId ?? null,
      siasnUnorId,
      unorNama: row.unorNama ?? this.rawString(raw, ['unor_nama']),
      jabatanRefId: mappedData.jabatanId ?? null,
      siasnJabatanId,
      jabatanNama: row.namaJabatan,
      jenisJabatanRefId: null,
      siasnJenisJabatanId: this.rawString(raw, ['jenis_jabatan_id']),
      jenisJabatanNama: row.jenisJabatan,
      tmtJabatan: row.tmtJabatan,
      effectiveDate: row.tmtJabatan,
      nomorSk: row.nomorSkJabatan ?? row.noSk,
      tanggalSk: row.tanggalSkJabatan ?? row.tanggalSk,
      siasnEselonId: row.siasnEselonId ?? this.rawString(raw, ['eselon_id']),
      eselonNama: row.eselonNama ?? this.rawString(raw, ['eselon_nama', 'eselon']),
      rawData: assignmentRawData,
      checksum: assignmentChecksum,
      syncedAt: now,
      deletedAt: null,
    };
    const assignmentInBatch = await tx.asnAssignmentHistory.findUnique({
      where: { asnId_sourceBatchId: { asnId, sourceBatchId: batchId } },
      select: simpleIdSelect,
    });
    if (assignmentInBatch) {
      await tx.asnAssignmentHistory.update({
        where: { id: assignmentInBatch.id },
        data: assignmentData,
      });
    } else {
      const duplicateAssignment = await tx.asnAssignmentHistory.findFirst({
        where: { asnId, checksum: assignmentChecksum, deletedAt: null },
        select: simpleIdSelect,
      });
      if (!duplicateAssignment) {
        await tx.asnAssignmentHistory.create({
          data: {
            id: randomUUID(),
            asnId,
            sourceBatchId: batchId,
            ...assignmentData,
          },
        });
      }
    }

    const golonganRawData = this.buildGolonganHistoryData(row, raw);
    const golonganChecksum = this.checksumJson(golonganRawData);
    const golonganData = {
      golonganRefId: mappedData.golonganId ?? null,
      siasnGolonganId,
      golonganNama: golonganAkhirNama,
      pangkatNama: row.namaPangkat ?? row.namaRuang,
      ruangNama: row.namaRuang,
      siasnGolonganAwalId: this.rawString(raw, ['gol_awal_id', 'golongan_awal_id']),
      golonganAwalNama: this.rawString(raw, ['gol_awal_nama', 'golongan_awal_nama']),
      siasnGolonganAkhirId: this.rawString(raw, ['gol_akhir_id', 'golongan_akhir_id']),
      golonganAkhirNama,
      tmtGolongan: row.tmtGolongan,
      mkTahun: this.rawInt(raw, ['mk_tahun']) ?? this.parseMasaKerja(row.masaKerjaGolongan).tahun,
      mkBulan: this.rawInt(raw, ['mk_bulan']) ?? this.parseMasaKerja(row.masaKerjaGolongan).bulan,
      effectiveDate: row.tmtGolongan,
      nomorSk: row.nomorSkGolongan ?? row.noSk,
      tanggalSk: row.tanggalSkGolongan ?? row.tanggalSk,
      rawData: golonganRawData,
      checksum: golonganChecksum,
      syncedAt: now,
      deletedAt: null,
    };
    const golonganInBatch = await tx.asnGolonganHistory.findUnique({
      where: { asnId_sourceBatchId: { asnId, sourceBatchId: batchId } },
      select: simpleIdSelect,
    });
    if (golonganInBatch) {
      await tx.asnGolonganHistory.update({
        where: { id: golonganInBatch.id },
        data: golonganData,
      });
    } else {
      const duplicateGolongan = await tx.asnGolonganHistory.findFirst({
        where: { asnId, checksum: golonganChecksum, deletedAt: null },
        select: simpleIdSelect,
      });
      if (!duplicateGolongan) {
        await tx.asnGolonganHistory.create({
          data: {
            id: randomUUID(),
            asnId,
            sourceBatchId: batchId,
            ...golonganData,
          },
        });
      }
    }

    const pendidikanRawData = this.buildPendidikanHistoryData(row, raw);
    const pendidikanChecksum = this.checksumJson(pendidikanRawData);
    const pendidikanData = {
      pendidikanRefId: mappedData.pendidikanId ?? null,
      siasnPendidikanId,
      pendidikanNama,
      tingkatPendidikanRefId: mappedData.tingkatPendidikanId ?? null,
      siasnTingkatPendidikanId,
      tingkatPendidikanNama,
      tahunLulus,
      namaSekolah: row.namaSekolah,
      effectiveDate: this.rawDate(raw, ['tanggal_lulus', 'tgl_lulus']),
      rawData: pendidikanRawData,
      checksum: pendidikanChecksum,
      syncedAt: now,
      deletedAt: null,
    };
    const pendidikanInBatch = await tx.asnPendidikanHistory.findUnique({
      where: { asnId_sourceBatchId: { asnId, sourceBatchId: batchId } },
      select: simpleIdSelect,
    });
    if (pendidikanInBatch) {
      await tx.asnPendidikanHistory.update({
        where: { id: pendidikanInBatch.id },
        data: pendidikanData,
      });
    } else {
      const duplicatePendidikan = await tx.asnPendidikanHistory.findFirst({
        where: { asnId, checksum: pendidikanChecksum, deletedAt: null },
        select: simpleIdSelect,
      });
      if (!duplicatePendidikan) {
        await tx.asnPendidikanHistory.create({
          data: {
            id: randomUUID(),
            asnId,
            sourceBatchId: batchId,
            ...pendidikanData,
          },
        });
      }
    }
  }

  private buildSiasnProfileData(
    row: SidataAsnImportStagingRecord,
    mappedData: SiasnAsnMappedDataForCommit,
    tipePegawai: string | null,
    raw: Record<string, unknown>,
  ): Prisma.InputJsonValue {
    const golonganAkhirNama = this.rawString(raw, ['gol_akhir_nama', 'golongan_akhir_nama']) ?? row.namaGolongan;

    return {
      identity: {
        nip: row.nip,
        nipLama: row.nipLama,
        nik: this.rawString(raw, ['nik']),
        nama: row.nama,
        gelarDepan: this.rawString(raw, ['gelar_depan']),
        gelarBelakang: this.rawString(raw, ['gelar_belakang']),
      },
      contact: {
        email: row.email ?? this.rawString(raw, ['email']),
        emailGov: row.emailGov ?? this.rawString(raw, ['email_gov']),
        phone: row.nomorHp ?? this.rawString(raw, ['nomor_hp', 'no_hp', 'phone']),
        alamat: row.alamat ?? this.rawString(raw, ['alamat']),
      },
      employment: {
        tipePegawai,
        jenisAsn: row.jenisAsn ?? this.rawString(raw, ['jenis_pegawai_nama', 'jenis_asn_nama']),
        statusAsn: row.statusKepegawaian ?? row.kedudukanHukum ?? this.rawString(raw, ['kedudukan_hukum_nama']),
        kedudukanHukumId: this.rawString(raw, ['kedudukan_hukum_id']),
        kedudukanHukumNama: row.kedudukanHukum ?? this.rawString(raw, ['kedudukan_hukum_nama']),
        statusCpnsPns: this.rawString(raw, ['status_cpns_pns']),
      },
      assignment: {
        unitKerjaId: mappedData.unitKerjaId ?? null,
        siasnUnorId: row.kdUnor ?? this.rawString(raw, ['unor_id']),
        unorNama: row.unorNama ?? this.rawString(raw, ['unor_nama']),
        siasnJabatanId: row.kdJabatan ?? row.kdJabatanSiasn ?? this.rawString(raw, ['jabatan_id']),
        jabatanNama: row.namaJabatan,
        jenisJabatanNama: row.jenisJabatan,
        tmtJabatan: row.tmtJabatan?.toISOString() ?? null,
      },
      golongan: {
        golAwalId: this.rawString(raw, ['gol_awal_id', 'golongan_awal_id']),
        golAwalNama: this.rawString(raw, ['gol_awal_nama', 'golongan_awal_nama']),
        golAkhirId: this.rawString(raw, ['gol_akhir_id', 'golongan_akhir_id']),
        golAkhirNama: golonganAkhirNama,
        tmtGolongan: row.tmtGolongan?.toISOString() ?? null,
        mkTahun: this.rawInt(raw, ['mk_tahun']) ?? this.parseMasaKerja(row.masaKerjaGolongan).tahun,
        mkBulan: this.rawInt(raw, ['mk_bulan']) ?? this.parseMasaKerja(row.masaKerjaGolongan).bulan,
      },
      education: {
        tingkatPendidikanId: this.rawString(raw, ['tingkat_pendidikan_id']),
        tingkatPendidikanNama: this.rawString(raw, ['tingkat_pendidikan_nama']),
        pendidikanId: this.rawString(raw, ['pendidikan_id']),
        pendidikanNama: row.pendidikanTerakhir,
        tahunLulus: row.tahunLulus ?? this.rawInt(raw, ['tahun_lulus']),
        namaSekolah: row.namaSekolah,
      },
      mappedReference: mappedData as Record<string, string | null | undefined>,
    } as Prisma.InputJsonValue;
  }

  private buildAssignmentHistoryData(
    row: SidataAsnImportStagingRecord,
    mappedData: SiasnAsnMappedDataForCommit,
    raw: Record<string, unknown>,
  ): Prisma.InputJsonValue {
    return {
      unitKerjaId: mappedData.unitKerjaId ?? null,
      siasnUnorId: row.kdUnor ?? this.rawString(raw, ['unor_id']),
      unorNama: row.unorNama ?? this.rawString(raw, ['unor_nama']),
      siasnJabatanId: row.kdJabatan ?? row.kdJabatanSiasn ?? this.rawString(raw, ['jabatan_id']),
      jabatanNama: row.namaJabatan,
      jenisJabatanNama: row.jenisJabatan,
      tmtJabatan: row.tmtJabatan?.toISOString() ?? null,
    } as Prisma.InputJsonValue;
  }

  private buildGolonganHistoryData(
    row: SidataAsnImportStagingRecord,
    raw: Record<string, unknown>,
  ): Prisma.InputJsonValue {
    return {
      golAwalId: this.rawString(raw, ['gol_awal_id', 'golongan_awal_id']),
      golAwalNama: this.rawString(raw, ['gol_awal_nama', 'golongan_awal_nama']),
      golAkhirId: this.rawString(raw, ['gol_akhir_id', 'golongan_akhir_id']),
      golAkhirNama: this.rawString(raw, ['gol_akhir_nama', 'golongan_akhir_nama']) ?? row.namaGolongan,
      tmtGolongan: row.tmtGolongan?.toISOString() ?? null,
      mkTahun: this.rawInt(raw, ['mk_tahun']) ?? this.parseMasaKerja(row.masaKerjaGolongan).tahun,
      mkBulan: this.rawInt(raw, ['mk_bulan']) ?? this.parseMasaKerja(row.masaKerjaGolongan).bulan,
    } as Prisma.InputJsonValue;
  }

  private buildPendidikanHistoryData(
    row: SidataAsnImportStagingRecord,
    raw: Record<string, unknown>,
  ): Prisma.InputJsonValue {
    return {
      tingkatPendidikanId: this.rawString(raw, ['tingkat_pendidikan_id']),
      tingkatPendidikanNama: this.rawString(raw, [
        'tingkat_pendidikan_nama',
        'tingkat pendidikan nama',
        'tingkat_pendidikan',
        'tingkat pendidikan',
      ]),
      pendidikanId: this.rawString(raw, ['pendidikan_id']),
      pendidikanNama: row.pendidikanTerakhir ?? this.rawString(raw, [
        'pendidikan_nama',
        'pendidikan nama',
        'pendidikan_terakhir',
        'pendidikan terakhir',
        'pendidikan',
      ]),
      tahunLulus: this.rawInt(raw, ['tahun_lulus', 'tahun lulus']),
      namaSekolah: row.namaSekolah,
    } as Prisma.InputJsonValue;
  }

  private tipePegawaiFromImportType(importType: string): string | null {
    if (importType === 'SIASN_ASN_PNS') return 'PNS';
    if (importType === 'SIASN_ASN_PPPK') return 'PPPK';
    if (importType === 'SIASN_ASN_PPPK_PARUH_WAKTU') return 'PPPK_PARUH_WAKTU';
    return null;
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
      tingkatPendidikanId: this.toNullableStringFromJson(record['tingkatPendidikanId']),
    };
  }

  private toNullableStringFromJson(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const normalized = value.trim();
    return normalized || null;
  }

  private checksumJson(value: unknown): string {
    return createHash('sha256')
      .update(this.stableStringify(value))
      .digest('hex');
  }

  private stableStringify(value: unknown): string {
    if (value instanceof Date) return JSON.stringify(this.formatDateOnlyForChecksum(value));
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map((item) => this.stableStringify(item)).join(',')}]`;

    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${this.stableStringify(record[key])}`)
      .join(',')}}`;
  }

  private formatDateOnlyForChecksum(value: Date): string {
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, '0');
    const day = String(value.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private chunkArray<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
      chunks.push(items.slice(index, index + size));
    }
    return chunks;
  }

  private yieldToEventLoop(): Promise<void> {
    return new Promise((resolve) => setImmediate(resolve));
  }

  private rawString(raw: Record<string, unknown>, candidates: string[]): string | null {
    const value = this.pickRaw(raw, candidates);
    if (!value) return null;
    const cleaned = value.replace(/^'+/, '').trim();
    return cleaned || null;
  }

  private rawInt(raw: Record<string, unknown>, candidates: string[]): number | null {
    const value = this.rawString(raw, candidates);
    if (!value) return null;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private rawDate(raw: Record<string, unknown>, candidates: string[]): Date | null {
    const value = this.rawString(raw, candidates);
    return this.parseDateOnly(value);
  }

  private parseDateOnly(value: unknown): Date | null {
    if (value === null || value === undefined) return null;
    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) return null;
      return this.dateOnlyUtc(value.getFullYear(), value.getMonth() + 1, value.getDate());
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      const excelEpoch = Date.UTC(1899, 11, 30, 12, 0, 0);
      const date = new Date(excelEpoch + Math.trunc(value) * 86_400_000);
      return this.dateOnlyUtc(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
    }
    if (typeof value !== 'string') return null;

    const normalized = value.trim();
    if (!normalized) return null;
    if (/^\d+(\.\d+)?$/.test(normalized)) return this.parseDateOnly(Number(normalized));

    const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/.exec(normalized);
    if (iso) return this.buildDateFromParts(iso[1], iso[2], iso[3]);

    const dayFirst = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2}|\d{4})$/.exec(normalized);
    if (dayFirst) {
      const year = dayFirst[3].length === 2 ? `20${dayFirst[3]}` : dayFirst[3];
      return this.buildDateFromParts(year, dayFirst[2], dayFirst[1]);
    }

    return this.parseIndonesianDateString(normalized);
  }

  private dateOnlyUtc(year: number, month: number, day: number): Date {
    return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  }

  private buildDateFromParts(yearValue: string, monthValue: string, dayValue: string): Date | null {
    const year = Number.parseInt(yearValue, 10);
    const month = Number.parseInt(monthValue, 10);
    const day = Number.parseInt(dayValue, 10);
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;

    const date = this.dateOnlyUtc(year, month, day);
    return date.getUTCFullYear() === year
      && date.getUTCMonth() === month - 1
      && date.getUTCDate() === day
      ? date
      : null;
  }

  private parseIndonesianDateString(value: string): Date | null {
    const match = /^(\d{1,2})\s+([A-Za-zÀ-ÿ.]+)\s+(\d{4})$/i.exec(value.replace(/,/g, ' '));
    if (!match) return null;

    const monthName = match[2].toLowerCase().replace(/\./g, '');
    const monthMap: Record<string, number> = {
      januari: 1,
      jan: 1,
      februari: 2,
      feb: 2,
      maret: 3,
      mar: 3,
      april: 4,
      apr: 4,
      mei: 5,
      juni: 6,
      jun: 6,
      juli: 7,
      jul: 7,
      agustus: 8,
      agu: 8,
      agt: 8,
      aug: 8,
      september: 9,
      sep: 9,
      oktober: 10,
      okt: 10,
      oct: 10,
      november: 11,
      nov: 11,
      desember: 12,
      des: 12,
      dec: 12,
    };

    const month = monthMap[monthName];
    if (!month) return null;

    return this.buildDateFromParts(match[3], String(month), match[1]);
  }

  private parseMasaKerja(value: string | null | undefined): { tahun: number | null; bulan: number | null } {
    if (!value) return { tahun: null, bulan: null };
    const tahunMatch = /(\d+)\s*tahun/i.exec(value);
    const bulanMatch = /(\d+)\s*bulan/i.exec(value);
    return {
      tahun: tahunMatch ? Number.parseInt(tahunMatch[1], 10) : null,
      bulan: bulanMatch ? Number.parseInt(bulanMatch[1], 10) : null,
    };
  }

  private inferEselonNama(
    jabatanNama: string | null | undefined,
    jenisJabatan: string | null | undefined,
  ): string | null {
    const jenis = this.normalizeText(jenisJabatan ?? '').toUpperCase();
    if (!jenis.includes('STRUKTURAL')) return null;

    const jabatan = this.normalizeText(jabatanNama ?? '').toUpperCase();
    if (!jabatan) return null;

    if (jabatan.startsWith('SEKRETARIS DAERAH')) return 'II.a';
    if (
      jabatan.startsWith('KEPALA DINAS')
      || jabatan.startsWith('KEPALA BADAN')
      || jabatan.startsWith('KEPALA SATUAN')
      || jabatan.startsWith('INSPEKTUR')
      || jabatan.startsWith('SEKRETARIS DPRD')
    ) return 'II.b';
    if (
      jabatan.startsWith('ASISTEN')
      || jabatan.startsWith('STAF AHLI')
      || jabatan.startsWith('SEKRETARIS DINAS')
      || jabatan.startsWith('SEKRETARIS BADAN')
      || jabatan.startsWith('SEKRETARIS INSPEKTORAT')
      || jabatan.startsWith('KEPALA BAGIAN')
      || jabatan.startsWith('CAMAT')
    ) return 'III.a';
    if (
      jabatan.startsWith('KEPALA BIDANG')
      || jabatan.startsWith('INSPEKTUR PEMBANTU')
      || jabatan.startsWith('SEKRETARIS CAMAT')
    ) return 'III.b';
    if (
      jabatan.startsWith('KEPALA SUB BAGIAN')
      || jabatan.startsWith('KEPALA SUBBAGIAN')
      || jabatan.startsWith('KEPALA SUB BIDANG')
      || jabatan.startsWith('KEPALA SUBBIDANG')
      || jabatan.startsWith('KEPALA SEKSI')
      || jabatan.startsWith('LURAH')
      || jabatan.startsWith('SEKRETARIS LURAH')
    ) return 'IV.a';

    return null;
  }

  private isMissingReferenceMessage(message: string): boolean {
    return /^Referensi .+ belum termapping$/.test(message);
  }

  private getMissingReferenceMessages(
    row: SidataAsnImportStagingRecord,
    mappedData: SidataAsnMappedData,
  ): string[] {
    const errors: string[] = [];

    const hasUnorInfo = row.kdUnor || row.namaUnorEselon1 || row.namaUnorEselon2 || row.namaUnorEselon3 || row.namaUnorEselon4;
    if (hasUnorInfo && !mappedData.unitKerjaId) {
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

  // ─── Phase 12: Extract References from ASN Batch ──────────────────────────────

  async extractReferencesFromAsnBatch(
    batchId: string,
  ): Promise<import('./sidata-import.types').ExtractReferencesResult> {
    const stagingRows = await this.prisma.sidataAsnImportStaging.findMany({
      where: { batchId },
      select: {
        rawData: true,
        namaJabatan: true,
        jenisJabatan: true,
        kdJabatan: true,
        kdJabatanSiasn: true,
      },
    });

    type RefPair = { kode: string | null; nama: string };
    type PendidikanPair = { kode: string | null; nama: string; tingkatNama: string | null; tingkatKode: string | null };
    const agama = new Map<string, RefPair>();
    const statusKawin = new Map<string, RefPair>();
    const jenisKelamin = new Map<string, RefPair>();
    const jenisAsn = new Map<string, RefPair>();
    const kedudukanHukum = new Map<string, RefPair>();
    const golongan = new Map<string, RefPair>();
    const pendidikanTingkat = new Map<string, RefPair>();
    const pendidikan = new Map<string, PendidikanPair>();
    const jenisJabatan = new Map<string, RefPair>();
    const jabatan = new Map<string, ExtractedAsnJabatanPair>();

    for (const row of stagingRows) {
      const raw = this.normalizeRawDataKeys(row.rawData as Record<string, unknown>);

      this.collectPair(raw, agama, ['agama_id', 'id_agama'], ['agama_nama', 'nama_agama', 'agama']);
      this.collectPair(raw, statusKawin, ['jenis_kawin_id', 'kawin_id', 'status_kawin_id'], ['jenis_kawin_nama', 'kawin_nama', 'status_kawin_nama', 'status_kawin']);
      this.collectPair(raw, jenisKelamin, ['jenis_kelamin_id'], ['jenis_kelamin_nama', 'jenis_kelamin', 'kelamin']);
      this.collectPair(raw, jenisAsn, ['jenis_pegawai_id', 'jenis_asn_id'], ['jenis_pegawai_nama', 'jenis_asn_nama', 'jenis_asn', 'jenis_pegawai']);
      this.collectPair(raw, kedudukanHukum, ['kedudukan_hukum_id'], ['kedudukan_hukum_nama', 'kedudukan_hukum']);
      this.collectPair(raw, golongan, ['gol_awal_id', 'golongan_awal_id', 'kd_golongan', 'gol_id'], ['gol_awal_nama', 'golongan_awal_nama', 'nama_golongan', 'golongan']);
      this.collectPair(raw, golongan, ['gol_akhir_id', 'golongan_akhir_id'], ['gol_akhir_nama', 'golongan_akhir_nama']);
      this.collectPair(raw, jenisJabatan, ['jenis_jabatan_id'], ['jenis_jabatan_nama', 'jenis_jabatan']);
      this.collectJabatanFromAsnRow(row, raw, jabatan);

      const tNama = this.pickRaw(raw, ['tingkat_pendidikan_nama', 'tingkat_pendidikan']);
      const tKode = this.pickRaw(raw, ['tingkat_pendidikan_id']);
      if (tNama) {
        const key = this.normalizeText(tNama);
        if (!pendidikanTingkat.has(key)) pendidikanTingkat.set(key, { kode: tKode, nama: tNama });
      }

      const pNama = this.pickRaw(raw, ['pendidikan_nama', 'pendidikan_terakhir']);
      const pKode = this.pickRaw(raw, ['pendidikan_id']);
      if (pNama) {
        const key = this.normalizeText(pNama);
        if (!pendidikan.has(key)) {
          pendidikan.set(key, { kode: pKode, nama: pNama, tingkatNama: tNama, tingkatKode: tKode });
        }
      }
    }

    const [a, sk, jk, ja, kh, gol, jj] = await Promise.all([
      this.upsertSimpleRefBulk('refAgama', agama),
      this.upsertSimpleRefBulk('refStatusKawin', statusKawin),
      this.upsertSimpleRefBulk('refJenisKelamin', jenisKelamin),
      this.upsertSimpleRefBulk('refJenisAsn', jenisAsn),
      this.upsertSimpleRefBulk('refKedudukanHukum', kedudukanHukum),
      this.upsertSimpleRefBulk('refGolongan', golongan),
      this.upsertJenisJabatanBulk(jenisJabatan),
    ]);

    const pt = await this.upsertPendidikanTingkatBulk(pendidikanTingkat);
    const pend = await this.upsertPendidikanBulk(pendidikan, pt.idMap);
    const jab = await this.upsertJabatanFromAsnBulk(jabatan);

    const extracted = {
      agama: a,
      statusKawin: sk,
      jenisKelamin: jk,
      jenisAsn: ja,
      kedudukanHukum: kh,
      golongan: gol,
      pendidikanTingkat: pt.created,
      pendidikan: pend,
      jenisJabatan: jj,
      jabatan: jab,
    };

    return {
      batchId,
      extracted,
      totalExtracted: Object.values(extracted).reduce((s, n) => s + n, 0),
    };
  }

  private normalizeRawDataKeys(raw: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(raw)) {
      out[k.trim().toLowerCase().replace(/\s+/g, '_')] = v;
    }
    return out;
  }

  private pickRaw(raw: Record<string, unknown>, candidates: string[]): string | null {
    for (const key of candidates) {
      const val = raw[key.trim().toLowerCase().replace(/\s+/g, '_')];
      if (val !== null && val !== undefined) {
        const str = String(val).trim();
        if (str && str !== 'null' && str !== 'undefined') return str;
      }
    }
    return null;
  }

  private collectPair(
    raw: Record<string, unknown>,
    map: Map<string, { kode: string | null; nama: string }>,
    idCandidates: string[],
    namaCandidates: string[],
  ) {
    const nama = this.pickRaw(raw, namaCandidates);
    if (!nama) return;
    const kode = this.pickRaw(raw, idCandidates);
    const key = this.normalizeText(nama);
    if (!map.has(key)) map.set(key, { kode, nama });
  }

  private collectJabatanFromAsnRow(
    row: {
      namaJabatan: string | null;
      jenisJabatan: string | null;
      kdJabatan: string | null;
      kdJabatanSiasn: string | null;
    },
    raw: Record<string, unknown>,
    map: Map<string, ExtractedAsnJabatanPair>,
  ) {
    const nama = row.namaJabatan ?? this.pickRaw(raw, [
      'jabatan_nama',
      'nama_jabatan',
      'jabatan',
      'nama_jabatan_siasn',
    ]);
    if (!nama) return;

    const jenisNama = row.jenisJabatan ?? this.pickRaw(raw, [
      'jenis_jabatan_nama',
      'jenis_jabatan',
    ]);
    const jenisKodeRaw = this.pickRaw(raw, [
      'jenis_jabatan_id',
      'jenis_jabatan_kode',
      'kd_jenis_jabatan',
      'kode_jenis_jabatan',
    ]);
    const jenisKode = this.normalizeJenisJabatanKode(jenisKodeRaw, jenisNama);
    if (!jenisKode) return;

    const kode = row.kdJabatan ?? row.kdJabatanSiasn ?? this.pickRaw(raw, [
      'jabatan_id',
      'id_jabatan',
      'kd_jabatan_siasn',
      'kd_jabatan',
      'kode_jabatan',
    ]);
    const key = `${jenisKode}|${this.normalizeText(nama)}`;
    const existing = map.get(key);
    if (!existing || (!existing.kode && kode)) {
      map.set(key, { kode, nama, jenisKode, jenisNama });
    }
  }

  private async upsertSimpleRefBulk(
    model:
      | 'refAgama'
      | 'refStatusKawin'
      | 'refJenisKelamin'
      | 'refJenisAsn'
      | 'refKedudukanHukum'
      | 'refGolongan'
      | 'refPendidikan',
    pairs: Map<string, { kode: string | null; nama: string }>,
  ): Promise<number> {
    if (pairs.size === 0) return 0;

    const delegate = (this.prisma[model] as unknown) as {
      findMany(args: { select: { nama: true } }): Promise<{ nama: string }[]>;
      createMany(args: { data: Array<{ id: string; kode: string | null; nama: string; isActive: boolean }> }): Promise<{ count: number }>;
    };

    const existing = await delegate.findMany({ select: { nama: true } });
    const existingNames = new Set(existing.map((r) => this.normalizeText(r.nama)));

    const newPairs = [...pairs.values()].filter(
      (p) => !existingNames.has(this.normalizeText(p.nama)),
    );

    if (newPairs.length === 0) return 0;

    await delegate.createMany({
      data: newPairs.map((p) => ({
        id: randomUUID(),
        kode: p.kode,
        nama: p.nama,
        isActive: true,
      })),
    });

    return newPairs.length;
  }

  private async upsertJabatanFromAsnBulk(
    pairs: Map<string, ExtractedAsnJabatanPair>,
  ): Promise<number> {
    if (pairs.size === 0) return 0;

    const jenisJabatans = await this.prisma.refJenisJabatan.findMany({
      where: { deletedAt: null },
      select: { id: true, kode: true },
    });
    const jenisIdByKode = new Map(jenisJabatans.map((jenis) => [jenis.kode, jenis.id]));

    const existingJabatans = await this.prisma.refJabatan.findMany({
      where: { deletedAt: null },
      select: {
        jenisJabatanId: true,
        kode: true,
        siasnKode: true,
        namaNormalized: true,
      },
      take: 20_000,
    });
    const existingKeys = new Set<string>();
    for (const jabatan of existingJabatans) {
      if (jabatan.namaNormalized) {
        existingKeys.add(`${jabatan.jenisJabatanId}|name|${jabatan.namaNormalized}`);
      }
      if (jabatan.kode) {
        existingKeys.add(`${jabatan.jenisJabatanId}|code|${jabatan.kode}`);
      }
      if (jabatan.siasnKode) {
        existingKeys.add(`${jabatan.jenisJabatanId}|code|${jabatan.siasnKode}`);
      }
    }

    const data: Prisma.RefJabatanCreateManyInput[] = [];
    for (const pair of pairs.values()) {
      const jenisJabatanId = jenisIdByKode.get(pair.jenisKode);
      if (!jenisJabatanId) continue;

      const namaNormalized = this.normalizeText(pair.nama);
      const codeKey = pair.kode ? `${jenisJabatanId}|code|${pair.kode}` : null;
      const nameKey = `${jenisJabatanId}|name|${namaNormalized}`;
      if (existingKeys.has(nameKey) || (codeKey && existingKeys.has(codeKey))) continue;

      data.push({
        id: randomUUID(),
        jenisJabatanId,
        kode: pair.kode,
        nama: pair.nama,
        namaNormalized,
        siasnId: pair.kode,
        siasnKode: pair.kode,
        siasnNama: pair.nama,
        source: 'SIASN_ASN_EXTRACT',
        isActive: true,
      });
      existingKeys.add(nameKey);
      if (codeKey) existingKeys.add(codeKey);
    }

    if (data.length === 0) return 0;

    const result = await this.prisma.refJabatan.createMany({ data });
    return result.count;
  }

  private async upsertUnitKerjaBulk(
    pairs: Map<string, { kode: string | null; nama: string }>,
  ): Promise<number> {
    if (pairs.size === 0) return 0;

    let created = 0;
    for (const [, pair] of pairs) {
      const kode = pair.kode ?? this.normalizeText(pair.nama);
      const existing = await this.prisma.unitKerja.findFirst({
        where: { OR: [{ kode }, { nama: pair.nama }], deletedAt: null },
        select: { id: true },
      });
      if (!existing) {
        await this.prisma.unitKerja.create({
          data: { id: randomUUID(), kode, nama: pair.nama, level: 1, isActive: true },
        });
        created++;
      }
    }
    return created;
  }

  private readonly SIASN_JENIS_JABATAN_CODE_MAP: Record<string, string> = {
    '1': 'STRUKTURAL',
    '2': 'FUNGSIONAL',
    '3': 'FUNGSIONAL',
    '4': 'PELAKSANA',
    'struktural': 'STRUKTURAL',
    'fungsional': 'FUNGSIONAL',
    'pelaksana': 'PELAKSANA',
  };

  private async upsertJenisJabatanBulk(
    pairs: Map<string, { kode: string | null; nama: string }>,
  ): Promise<number> {
    if (pairs.size === 0) return 0;

    const existing = await this.prisma.refJenisJabatan.findMany({
      select: { kode: true, nama: true },
    });
    const existingNames = new Set(existing.map((r) => this.normalizeText(r.nama)));
    const existingCodes = new Set(existing.map((r) => r.kode));

    let created = 0;
    for (const [, pair] of pairs) {
      // Map SIASN numeric/raw codes to canonical codes
      const rawKode = pair.kode?.trim().toLowerCase() ?? '';
      const canonicalKode =
        this.SIASN_JENIS_JABATAN_CODE_MAP[rawKode] ??
        this.normalizeText(pair.nama).toUpperCase().replace(/\s+/g, '_');

      if (existingCodes.has(canonicalKode) || existingNames.has(this.normalizeText(pair.nama))) continue;

      await this.prisma.refJenisJabatan.upsert({
        where: { kode: canonicalKode },
        update: {},
        create: { id: randomUUID(), kode: canonicalKode, nama: pair.nama, isActive: true },
      });
      created++;
    }
    return created;
  }

  private async upsertPendidikanTingkatBulk(
    pairs: Map<string, { kode: string | null; nama: string }>,
  ): Promise<{ created: number; idMap: Map<string, string> }> {
    const idMap = new Map<string, string>();

    if (pairs.size === 0) return { created: 0, idMap };

    const existing = await this.prisma.refPendidikanTingkat.findMany({
      select: { id: true, nama: true },
    });

    for (const r of existing) {
      idMap.set(this.normalizeText(r.nama), r.id);
    }

    let created = 0;
    for (const [normalizedNama, pair] of pairs) {
      if (idMap.has(normalizedNama)) continue;

      const record = await this.prisma.refPendidikanTingkat.create({
        data: { id: randomUUID(), kode: pair.kode, nama: pair.nama, isActive: true },
        select: { id: true },
      });
      idMap.set(normalizedNama, record.id);
      created++;
    }

    return { created, idMap };
  }

  private async upsertPendidikanBulk(
    pairs: Map<string, { kode: string | null; nama: string; tingkatNama: string | null; tingkatKode: string | null }>,
    tingkatIdMap: Map<string, string>,
  ): Promise<number> {
    if (pairs.size === 0) return 0;

    const existing = await this.prisma.refPendidikan.findMany({
      select: { id: true, nama: true, tingkatPendidikanId: true },
    });
    const existingMap = new Map(existing.map((r) => [this.normalizeText(r.nama), r]));

    let created = 0;
    for (const [normalizedNama, pair] of pairs) {
      const tingkatId = pair.tingkatNama
        ? (tingkatIdMap.get(this.normalizeText(pair.tingkatNama)) ?? null)
        : null;

      const existingRow = existingMap.get(normalizedNama);
      if (existingRow) {
        if (tingkatId && !existingRow.tingkatPendidikanId) {
          await this.prisma.refPendidikan.update({
            where: { id: existingRow.id },
            data: { tingkatPendidikanId: tingkatId },
          });
        }
        continue;
      }

      await this.prisma.refPendidikan.create({
        data: {
          id: randomUUID(),
          kode: pair.kode,
          nama: pair.nama,
          tingkatPendidikanId: tingkatId,
          isActive: true,
        },
      });
      created++;
    }

    return created;
  }
}
