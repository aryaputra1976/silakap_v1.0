import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const matchingRunSelect = {
  id: true,
  periodId: true,
  batchId: true,
  status: true,
  totalBkpsdm: true,
  totalBpkad: true,
  totalMatched: true,
  totalR01: true,
  totalR02: true,
  totalR03: true,
  totalR04: true,
  totalR05: true,
  totalR06: true,
  totalR08: true,
  totalR09: true,
  totalFindings: true,
  runAt: true,
  runById: true,
  errorMessage: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ReconciliationMatchingRunSelect;

const findingSelect = {
  id: true,
  matchingRunId: true,
  periodId: true,
  findingCode: true,
  priority: true,
  status: true,
  nip: true,
  namaBkpsdm: true,
  namaBpkad: true,
  bkpsdmValue: true,
  bpkadValue: true,
  description: true,
  asnId: true,
  bpkadRowId: true,
  notes: true,
  rtlPic: true,
  rtlDeadline: true,
  rtlAction: true,
  rtlNotes: true,
  resolvedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ReconciliationFindingSelect;

const beritaAcaraSelect = {
  id: true,
  periodId: true,
  matchingRunId: true,
  status: true,
  nomorBA: true,
  tanggalBA: true,
  totalTemuan: true,
  totalResolved: true,
  totalPending: true,
  summaryJson: true,
  draftedById: true,
  draftedAt: true,
  finalizedById: true,
  finalizedAt: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ReconciliationBeritaAcaraSelect;

const periodSelect = {
  id: true,
  periodYear: true,
  periodMonth: true,
  periodQuarter: true,
  periodType: true,
  title: true,
  status: true,
  cutOffDate: true,
  notes: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ReconciliationPeriodSelect;

const importBatchSelect = {
  id: true,
  periodId: true,
  source: true,
  importType: true,
  fileName: true,
  originalFileName: true,
  mimeType: true,
  sizeBytes: true,
  fileChecksum: true,
  sheetName: true,
  status: true,
  totalRows: true,
  validRows: true,
  invalidRows: true,
  duplicateRows: true,
  warningRows: true,
  requiredColumnsJson: true,
  missingColumnsJson: true,
  uploadedById: true,
  uploadedAt: true,
  errorMessage: true,
  createdAt: true,
  updatedAt: true,
  period: {
    select: periodSelect,
  },
} satisfies Prisma.ReconciliationImportBatchSelect;

const payrollRowSelect = {
  id: true,
  batchId: true,
  rowNumber: true,
  tglGaji: true,
  nip: true,
  nipLama: true,
  nama: true,
  kdSkpd: true,
  kdSatker: true,
  nmSkpd: true,
  nmSatker: true,
  kdStapeg: true,
  tmtStop: true,
  kdPangkat: true,
  gapok: true,
  kotor: true,
  potongan: true,
  bersih: true,
  npwp: true,
  noKtp: true,
  validationStatus: true,
  validationErrors: true,
  rawData: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ReconciliationBpkadPayrollRecordSelect;

export type ReconciliationPeriodRecord =
  Prisma.ReconciliationPeriodGetPayload<{ select: typeof periodSelect }>;

export type ReconciliationImportBatchRecord =
  Prisma.ReconciliationImportBatchGetPayload<{ select: typeof importBatchSelect }>;

export type ReconciliationPayrollRowRecord =
  Prisma.ReconciliationBpkadPayrollRecordGetPayload<{
    select: typeof payrollRowSelect;
  }>;

export type ReconciliationMatchingRunRecord =
  Prisma.ReconciliationMatchingRunGetPayload<{ select: typeof matchingRunSelect }>;

export type ReconciliationFindingRecord =
  Prisma.ReconciliationFindingGetPayload<{ select: typeof findingSelect }>;

export type ReconciliationBeritaAcaraRecord =
  Prisma.ReconciliationBeritaAcaraGetPayload<{ select: typeof beritaAcaraSelect }>;

@Injectable()
export class ReconciliationBpkadRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  findPeriods() {
    return this.prisma.reconciliationPeriod.findMany({
      select: periodSelect,
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    });
  }

  createPeriod(data: Prisma.ReconciliationPeriodUncheckedCreateInput) {
    return this.prisma.reconciliationPeriod.create({
      data,
      select: periodSelect,
    });
  }

  findPeriodById(id: string) {
    return this.prisma.reconciliationPeriod.findUnique({
      where: { id },
      select: periodSelect,
    });
  }

  findImportBatchByChecksum(fileChecksum: string) {
    return this.prisma.reconciliationImportBatch.findFirst({
      where: {
        fileChecksum,
        source: 'BPKAD',
        importType: 'BPKAD_PAYROLL',
      },
      select: importBatchSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBpkadImportBatches(params: {
    page: number;
    limit: number;
    status?: string;
    q?: string;
  }) {
    const where: Prisma.ReconciliationImportBatchWhereInput = {
      source: 'BPKAD',
      importType: 'BPKAD_PAYROLL',
      ...(params.status ? { status: params.status } : {}),
      ...(params.q
        ? {
            OR: [
              { fileName: { contains: params.q } },
              { originalFileName: { contains: params.q } },
              { sheetName: { contains: params.q } },
            ],
          }
        : {}),
    };

    const skip = (params.page - 1) * params.limit;
    const [items, total] = await Promise.all([
      this.prisma.reconciliationImportBatch.findMany({
        where,
        select: importBatchSelect,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: params.limit,
      }),
      this.prisma.reconciliationImportBatch.count({ where }),
    ]);

    return { items, total, page: params.page, limit: params.limit };
  }

  findImportBatchById(id: string) {
    return this.prisma.reconciliationImportBatch.findUnique({
      where: { id },
      select: importBatchSelect,
    });
  }

  createImportBatch(data: Prisma.ReconciliationImportBatchUncheckedCreateInput) {
    return this.prisma.reconciliationImportBatch.create({
      data,
      select: importBatchSelect,
    });
  }

  updateImportBatch(
    id: string,
    data: Prisma.ReconciliationImportBatchUncheckedUpdateInput,
  ) {
    return this.prisma.reconciliationImportBatch.update({
      where: { id },
      data,
      select: importBatchSelect,
    });
  }

  createPayrollRows(rows: Prisma.ReconciliationBpkadPayrollRecordCreateManyInput[]) {
    return this.prisma.reconciliationBpkadPayrollRecord.createMany({
      data: rows,
      skipDuplicates: true,
    });
  }

  async findPayrollRowsByBatchId(params: {
    batchId: string;
    page: number;
    limit: number;
    q?: string;
    status?: string;
  }) {
    const where: Prisma.ReconciliationBpkadPayrollRecordWhereInput = {
      batchId: params.batchId,
      ...(params.status ? { validationStatus: params.status } : {}),
      ...(params.q
        ? {
            OR: [
              { nip: { contains: params.q } },
              { nipLama: { contains: params.q } },
              { nama: { contains: params.q } },
              { kdSkpd: { contains: params.q } },
              { nmSkpd: { contains: params.q } },
              { nmSatker: { contains: params.q } },
            ],
          }
        : {}),
    };
    const skip = (params.page - 1) * params.limit;
    const [items, total] = await Promise.all([
      this.prisma.reconciliationBpkadPayrollRecord.findMany({
        where,
        select: payrollRowSelect,
        orderBy: { rowNumber: 'asc' },
        skip,
        take: params.limit,
      }),
      this.prisma.reconciliationBpkadPayrollRecord.count({ where }),
    ]);

    return { items, total, page: params.page, limit: params.limit };
  }

  createAuditLog(data: Prisma.ReconciliationAuditLogUncheckedCreateInput) {
    return this.prisma.reconciliationAuditLog.create({ data });
  }

  createMatchingRun(data: Prisma.ReconciliationMatchingRunUncheckedCreateInput) {
    return this.prisma.reconciliationMatchingRun.create({
      data,
      select: matchingRunSelect,
    });
  }

  updateMatchingRun(
    id: string,
    data: Prisma.ReconciliationMatchingRunUncheckedUpdateInput,
  ) {
    return this.prisma.reconciliationMatchingRun.update({
      where: { id },
      data,
      select: matchingRunSelect,
    });
  }

  findLatestMatchingRunByPeriod(periodId: string) {
    return this.prisma.reconciliationMatchingRun.findFirst({
      where: { periodId },
      select: matchingRunSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  findMatchingRunById(id: string) {
    return this.prisma.reconciliationMatchingRun.findUnique({
      where: { id },
      select: matchingRunSelect,
    });
  }

  createFindings(data: Prisma.ReconciliationFindingCreateManyInput[]) {
    return this.prisma.reconciliationFinding.createMany({
      data,
      skipDuplicates: true,
    });
  }

  deleteAllFindingsByMatchingRunId(matchingRunId: string) {
    return this.prisma.reconciliationFinding.deleteMany({
      where: { matchingRunId },
    });
  }

  async findFindings(params: {
    periodId: string;
    matchingRunId?: string;
    findingCode?: string;
    priority?: string;
    status?: string;
    q?: string;
    page: number;
    limit: number;
  }) {
    const where: Prisma.ReconciliationFindingWhereInput = {
      periodId: params.periodId,
      ...(params.matchingRunId ? { matchingRunId: params.matchingRunId } : {}),
      ...(params.findingCode ? { findingCode: params.findingCode } : {}),
      ...(params.priority ? { priority: params.priority } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.q
        ? {
            OR: [
              { nip: { contains: params.q } },
              { namaBkpsdm: { contains: params.q } },
              { namaBpkad: { contains: params.q } },
              { description: { contains: params.q } },
            ],
          }
        : {}),
    };

    const skip = (params.page - 1) * params.limit;
    const [items, total] = await Promise.all([
      this.prisma.reconciliationFinding.findMany({
        where,
        select: findingSelect,
        orderBy: [{ priority: 'asc' }, { findingCode: 'asc' }, { nip: 'asc' }],
        skip,
        take: params.limit,
      }),
      this.prisma.reconciliationFinding.count({ where }),
    ]);

    return { items, total, page: params.page, limit: params.limit };
  }

  findAllFindings(params: {
    periodId: string;
    matchingRunId?: string;
    findingCode?: string;
    status?: string;
  }) {
    const where: Prisma.ReconciliationFindingWhereInput = {
      periodId: params.periodId,
      ...(params.matchingRunId ? { matchingRunId: params.matchingRunId } : {}),
      ...(params.findingCode ? { findingCode: params.findingCode } : {}),
      ...(params.status ? { status: params.status } : {}),
    };
    return this.prisma.reconciliationFinding.findMany({
      where,
      select: findingSelect,
      orderBy: [{ priority: 'asc' }, { findingCode: 'asc' }, { nip: 'asc' }],
      take: 5000,
    });
  }

  async findFindingsSummary(periodId: string, matchingRunId?: string) {
    const where: Prisma.ReconciliationFindingWhereInput = {
      periodId,
      ...(matchingRunId ? { matchingRunId } : {}),
    };

    const rows = await this.prisma.reconciliationFinding.groupBy({
      by: ['findingCode', 'priority'],
      where,
      _count: { id: true },
      orderBy: { findingCode: 'asc' },
    });

    return rows.map((row) => ({
      findingCode: row.findingCode,
      priority: row.priority,
      count: row._count.id,
    }));
  }

  findAllPayrollRowsByBatchId(batchId: string) {
    return this.prisma.reconciliationBpkadPayrollRecord.findMany({
      where: {
        batchId,
        validationStatus: { not: 'INVALID' },
      },
      select: {
        id: true,
        nip: true,
        nipLama: true,
        nama: true,
        kdSkpd: true,
        kdSatker: true,
        nmSkpd: true,
        nmSatker: true,
        kdStapeg: true,
        kdPangkat: true,
        tmtStop: true,
        validationStatus: true,
        validationErrors: true,
      },
    });
  }

  findAllAsnForMatching() {
    return this.prisma.asn.findMany({
      where: { isActive: true, deletedAt: null },
      select: {
        id: true,
        nip: true,
        nipLama: true,
        nama: true,
        statusAsn: true,
        kedudukanHukumNama: true,
        tmtPensiun: true,
        golonganNama: true,
        tmtGolongan: true,
        jabatanNama: true,
        jenisJabatanNama: true,
        tmtJabatan: true,
        unorNama: true,
        siasnUnorId: true,
      },
    });
  }

  updateFinding(id: string, data: Prisma.ReconciliationFindingUncheckedUpdateInput) {
    return this.prisma.reconciliationFinding.update({
      where: { id },
      data,
      select: findingSelect,
    });
  }

  findFindingById(id: string) {
    return this.prisma.reconciliationFinding.findUnique({
      where: { id },
      select: findingSelect,
    });
  }

  async countFindingsByStatus(periodId: string, matchingRunId?: string) {
    const where: Prisma.ReconciliationFindingWhereInput = {
      periodId,
      ...(matchingRunId ? { matchingRunId } : {}),
    };

    const rows = await this.prisma.reconciliationFinding.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    });

    return Object.fromEntries(rows.map((r) => [r.status, r._count.id])) as Record<string, number>;
  }

  createBeritaAcara(data: Prisma.ReconciliationBeritaAcaraUncheckedCreateInput) {
    return this.prisma.reconciliationBeritaAcara.create({
      data,
      select: beritaAcaraSelect,
    });
  }

  updateBeritaAcara(id: string, data: Prisma.ReconciliationBeritaAcaraUncheckedUpdateInput) {
    return this.prisma.reconciliationBeritaAcara.update({
      where: { id },
      data,
      select: beritaAcaraSelect,
    });
  }

  findLatestBeritaAcaraByPeriod(periodId: string) {
    return this.prisma.reconciliationBeritaAcara.findFirst({
      where: { periodId },
      select: beritaAcaraSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  findBeritaAcaraById(id: string) {
    return this.prisma.reconciliationBeritaAcara.findUnique({
      where: { id },
      select: beritaAcaraSelect,
    });
  }
}
