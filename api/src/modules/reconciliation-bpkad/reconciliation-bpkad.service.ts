import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';
import * as path from 'node:path';
import * as XLSX from 'xlsx';
import { AuthUser } from '../auth/auth.types';
import {
  CreateBeritaAcaraDto,
  CreateReconciliationPeriodDto,
  FinalizeBeritaAcaraDto,
  FindingsQueryDto,
  PatchFindingDto,
  ReconciliationQueryDto,
  RunMatchingDto,
  UploadBpkadSimgajiDto,
} from './dto/reconciliation-query.dto';
import {
  ReconciliationBpkadRepository,
  ReconciliationBeritaAcaraRecord,
  ReconciliationFindingRecord,
  ReconciliationImportBatchRecord,
  ReconciliationMatchingRunRecord,
  ReconciliationPayrollRowRecord,
  ReconciliationPeriodRecord,
} from './reconciliation-bpkad.repository';
import {
  BpkadPayrollMappedRow,
  ReconciliationBufferedFile,
  ReconciliationSummary,
} from './reconciliation-bpkad.types';

const FINDING_PRIORITY: Record<string, string> = {
  R01: 'SEGERA',
  R02: 'SEGERA',
  R03: 'SEGERA',
  R04: 'SEGERA',
  R05: 'BULAN_INI',
  R06: 'BULAN_INI',
  R07: 'BULAN_INI',
  R08: 'SEGERA',
  R09: 'SEGERA',
  R10: 'BULAN_INI',
};

const FINDING_DESCRIPTION: Record<string, string> = {
  R01: 'Ada di BKPSDM, tidak ada di BPKAD',
  R02: 'Ada di BPKAD, tidak ada di BKPSDM',
  R03: 'Status kepegawaian berbeda',
  R04: 'Pangkat/golongan berbeda',
  R05: 'Jabatan berbeda',
  R06: 'Unit kerja/OPD berbeda',
  R07: 'TMT pangkat/jabatan berbeda',
  R08: 'Nama/NIP bermasalah',
  R09: 'ASN ganda di Simgaji',
  R10: 'Komponen pembayaran tidak sesuai',
};

const INACTIVE_STATUS_KEYWORDS = [
  'pensiun', 'berhenti', 'meninggal', 'cltn', 'tugas belajar', 'nonaktif',
  'diberhentikan', 'wafat',
];

const MATCHING_ROLES = [
  'SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID', 'ANALIS_MADYA', 'ANALIS_MUDA',
];

const INTERNAL_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
  'ANALIS_PERTAMA',
  'PENELAAH',
  'PPPK',
];

const UPLOAD_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
  'ANALIS_PERTAMA',
  'PENELAAH',
  'PPPK',
];

const PERIOD_WRITE_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
];

const REQUIRED_BPKAD_COLUMNS = [
  'tglgaji',
  'nip',
  'nama',
  'kdskpd',
  'kdsatker',
  'kdstapeg',
  'kdpangkat',
  'gapok',
  'kotor',
  'potongan',
  'bersih',
];

const OPTIONAL_BPKAD_COLUMNS = [
  'niplama',
  'nmskpd',
  'nmsatker',
  'npwp',
  'noktp',
  'tmtstop',
  'kdeselon',
  'kdfungsi',
  'kdstruk',
];

const MAX_IMPORT_ROWS = 20_000;

@Injectable()
export class ReconciliationBpkadService {
  private static readonly MATCHING_TIMEOUT_MS = 5 * 60 * 1000;

  constructor(
    @Inject(ReconciliationBpkadRepository)
    private readonly repo: ReconciliationBpkadRepository,
  ) {}

  async findPeriods(user: AuthUser) {
    this.ensureInternal(user);
    const items = await this.repo.findPeriods();
    return items.map((item) => this.toPeriodResponse(item));
  }

  async createPeriod(dto: CreateReconciliationPeriodDto, user: AuthUser) {
    this.ensureRole(user, PERIOD_WRITE_ROLES, 'membuat periode rekonsiliasi');
    const now = new Date();
    const periodYear = this.normalizeInt(dto.periodYear, now.getFullYear());
    const periodMonth = dto.periodMonth
      ? this.normalizeInt(dto.periodMonth, now.getMonth() + 1)
      : now.getMonth() + 1;
    const periodQuarter = dto.periodQuarter
      ? this.normalizeInt(dto.periodQuarter, Math.ceil(periodMonth / 3))
      : Math.ceil(periodMonth / 3);
    const periodType = this.normalizePeriodType(dto.periodType);
    const title =
      this.normalizeOptional(dto.title) ??
      this.buildPeriodTitle(periodType, periodYear, periodMonth, periodQuarter);

    const period = await this.repo.createPeriod({
      periodYear,
      periodMonth: periodType === 'MONTHLY' ? periodMonth : null,
      periodQuarter: periodType === 'QUARTERLY' ? periodQuarter : null,
      periodType,
      title,
      cutOffDate: this.normalizeDate(dto.cutOffDate),
      notes: this.normalizeOptional(dto.notes),
      createdById: user.id,
      status: 'DRAFT',
    });

    await this.repo.createAuditLog({
      periodId: period.id,
      action: 'CREATE_PERIOD',
      actorId: user.id,
      actorRole: this.primaryRole(user),
      metadata: this.toJsonObject({ title: period.title, periodType }),
    });

    return this.toPeriodResponse(period);
  }

  async findBpkadImportBatches(query: ReconciliationQueryDto, user: AuthUser) {
    this.ensureInternal(user);
    const pagination = this.normalizePagination(query);
    const result = await this.repo.findBpkadImportBatches({
      ...pagination,
      status: this.normalizeOptional(query.status),
      q: this.normalizeOptional(query.q),
    });

    return {
      ...result,
      items: result.items.map((item) => this.toBatchResponse(item)),
    };
  }

  async findBpkadImportBatch(id: string, user: AuthUser) {
    this.ensureInternal(user);
    const batch = await this.getBatchOrThrow(id);
    return this.toBatchResponse(batch);
  }

  async findBpkadImportRows(
    id: string,
    query: ReconciliationQueryDto,
    user: AuthUser,
  ) {
    this.ensureInternal(user);
    await this.getBatchOrThrow(id);
    const result = await this.repo.findPayrollRowsByBatchId({
      batchId: id,
      ...this.normalizePagination(query),
      status: this.normalizeOptional(query.status),
      q: this.normalizeOptional(query.q),
    });

    return {
      ...result,
      items: result.items.map((item) => this.toPayrollRowResponse(item)),
    };
  }

  async uploadBpkadSimgaji(
    file: ReconciliationBufferedFile | undefined,
    dto: UploadBpkadSimgajiDto,
    user: AuthUser,
  ) {
    this.ensureRole(user, UPLOAD_ROLES, 'mengunggah data Simgaji BPKAD');
    const validatedFile = this.validateExcelFile(file);

    if (dto.periodId) {
      const period = await this.repo.findPeriodById(dto.periodId);
      if (!period) {
        throw new BadRequestException('Periode rekonsiliasi tidak ditemukan');
      }
    }

    const fileChecksum = createHash('sha256')
      .update(validatedFile.buffer)
      .digest('hex');
    const existing = await this.repo.findImportBatchByChecksum(fileChecksum);

    if (existing && existing.status !== 'CANCELLED') {
      throw new BadRequestException(
        `File ini sudah pernah diupload pada batch ${existing.id}`,
      );
    }

    const workbook = XLSX.read(validatedFile.buffer, {
      type: 'buffer',
      cellDates: true,
    });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      throw new BadRequestException('Workbook tidak memiliki sheet');
    }

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      throw new BadRequestException('Sheet pertama tidak dapat dibaca');
    }

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: null,
      raw: true,
    });

    if (rows.length > MAX_IMPORT_ROWS) {
      throw new BadRequestException(
        `File terlalu besar untuk preview awal. Maksimal ${MAX_IMPORT_ROWS} baris.`,
      );
    }

    const columns = this.extractColumns(rows);
    const missingColumns = REQUIRED_BPKAD_COLUMNS.filter(
      (column) => !columns.includes(column),
    );
    const mappedRows = this.mapPayrollRows(rows);
    const summary = this.buildSummary(mappedRows, missingColumns);
    const status = missingColumns.length > 0 || summary.invalidRows > 0
      ? 'HAS_ISSUES'
      : 'VALIDATED';

    const batch = await this.repo.createImportBatch({
      periodId: this.normalizeOptional(dto.periodId),
      source: 'BPKAD',
      importType: 'BPKAD_PAYROLL',
      fileName: this.sanitizeFileName(validatedFile.originalname),
      originalFileName: validatedFile.originalname,
      mimeType: validatedFile.mimetype,
      sizeBytes: validatedFile.size,
      fileChecksum,
      sheetName,
      status,
      totalRows: summary.totalRows,
      validRows: summary.validRows,
      invalidRows: summary.invalidRows,
      duplicateRows: summary.duplicateRows,
      warningRows: summary.warningRows,
      requiredColumnsJson: REQUIRED_BPKAD_COLUMNS,
      missingColumnsJson: missingColumns,
      uploadedById: user.id,
      uploadedAt: new Date(),
      errorMessage: missingColumns.length
        ? `Kolom wajib belum lengkap: ${missingColumns.join(', ')}`
        : null,
    });

    if (mappedRows.length > 0) {
      await this.createPayrollRowsInChunks(batch.id, mappedRows);
    }

    await this.repo.createAuditLog({
      periodId: batch.periodId,
      batchId: batch.id,
      action: 'UPLOAD_BPKAD_PAYROLL',
      actorId: user.id,
      actorRole: this.primaryRole(user),
      metadata: this.toJsonObject({
        originalFileName: validatedFile.originalname,
        sheetName,
        totalRows: summary.totalRows,
        missingColumns,
      }),
    });

    return this.toBatchResponse(batch);
  }

  async runMatching(periodId: string, dto: RunMatchingDto, user: AuthUser) {
    this.ensureRole(user, MATCHING_ROLES, 'menjalankan matching rekonsiliasi');
    const period = await this.repo.findPeriodById(periodId);
    if (!period) throw new NotFoundException('Periode rekonsiliasi tidak ditemukan');

    const activeRun = await this.repo.findActiveMatchingRunByPeriod(periodId);
    if (activeRun) {
      throw new ConflictException(
        'Proses matching sedang berjalan untuk periode ini. Tunggu hingga selesai.',
      );
    }

    const batchId = await this.resolveMatchingBatchId(periodId, dto.batchId);

    const run = await this.repo.createMatchingRun({
      periodId,
      batchId,
      status: 'RUNNING',
      runAt: new Date(),
      runById: user.id,
    });

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error('Proses matching melebihi batas waktu 5 menit')),
        ReconciliationBpkadService.MATCHING_TIMEOUT_MS,
      );
    });

    try {
      return await Promise.race([
        this.doMatching(run.id, periodId, batchId, user),
        timeoutPromise,
      ]);
    } catch (error) {
      await this.repo.updateMatchingRun(run.id, {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async doMatching(
    runId: string,
    periodId: string,
    batchId: string,
    user: AuthUser,
  ) {
    const [bpkadRows, asnList] = await Promise.all([
      this.repo.findAllPayrollRowsByBatchId(batchId),
      this.repo.findAllAsnForMatching(),
    ]);

    const findings = this.computeFindings(periodId, runId, asnList, bpkadRows);
    await this.repo.deleteAllFindingsByMatchingRunId(runId);

    const chunkSize = 500;
    for (let i = 0; i < findings.length; i += chunkSize) {
      await this.repo.createFindings(findings.slice(i, i + chunkSize));
    }

    const counts = this.countFindings(findings);
    const bpkadNipSet = new Set(bpkadRows.map((r) => r.nip).filter(Boolean));
    const asnNipSet = new Set(asnList.map((a) => a.nip).filter(Boolean));
    const matchedNips = [...asnNipSet].filter((nip) => bpkadNipSet.has(nip));

    const updated = await this.repo.updateMatchingRun(runId, {
      status: 'DONE',
      totalBkpsdm: asnList.length,
      totalBpkad: bpkadRows.length,
      totalMatched: matchedNips.length,
      totalFindings: findings.length,
      ...counts,
    });

    await this.repo.createAuditLog({
      periodId,
      batchId,
      action: 'RUN_MATCHING',
      actorId: user.id,
      actorRole: this.primaryRole(user),
      metadata: this.toJsonObject({
        runId,
        totalBkpsdm: asnList.length,
        totalBpkad: bpkadRows.length,
        totalFindings: findings.length,
      }),
    });

    return this.toMatchingRunResponse(updated);
  }

  async getMatchingRun(periodId: string, user: AuthUser) {
    this.ensureInternal(user);
    await this.getPeriodOrThrow(periodId);
    const run = await this.repo.findLatestMatchingRunByPeriod(periodId);
    return run ? this.toMatchingRunResponse(run) : null;
  }

  async findFindings(periodId: string, query: FindingsQueryDto, user: AuthUser) {
    this.ensureInternal(user);
    await this.getPeriodOrThrow(periodId);
    const run = await this.repo.findLatestMatchingRunByPeriod(periodId);

    const result = await this.repo.findFindings({
      periodId,
      matchingRunId: run?.id,
      findingCode: this.normalizeOptional(query.findingCode),
      priority: this.normalizeOptional(query.priority),
      status: this.normalizeOptional(query.status),
      q: this.normalizeOptional(query.q),
      ...this.normalizePagination(query),
    });

    return {
      ...result,
      items: result.items.map((item) => this.toFindingResponse(item)),
    };
  }

  async getFindingsSummary(periodId: string, user: AuthUser) {
    this.ensureInternal(user);
    await this.getPeriodOrThrow(periodId);
    const run = await this.repo.findLatestMatchingRunByPeriod(periodId);
    return this.repo.findFindingsSummary(periodId, run?.id);
  }

  async exportFindings(
    periodId: string,
    query: { findingCode?: string; status?: string },
    user: AuthUser,
  ) {
    this.ensureInternal(user);
    await this.getPeriodOrThrow(periodId);
    const run = await this.repo.findLatestMatchingRunByPeriod(periodId);
    const items = await this.repo.findAllFindings({
      periodId,
      matchingRunId: run?.id,
      findingCode: this.normalizeOptional(query.findingCode),
      status: this.normalizeOptional(query.status),
    });
    return items.map((item) => this.toFindingResponse(item));
  }

  async patchFinding(periodId: string, findingId: string, dto: PatchFindingDto, user: AuthUser) {
    this.ensureRole(user, MATCHING_ROLES, 'mengubah status temuan');
    await this.getPeriodOrThrow(periodId);

    const existing = await this.repo.findFindingById(findingId);
    if (!existing || existing.periodId !== periodId) {
      throw new NotFoundException('Temuan tidak ditemukan');
    }

    const allowedStatuses = ['OPEN', 'NEEDS_CLARIFICATION', 'IN_FOLLOW_UP', 'RESOLVED', 'REJECTED'];
    const newStatus = this.normalizeOptional(dto.status);
    if (newStatus && !allowedStatuses.includes(newStatus)) {
      throw new BadRequestException(`Status tidak valid: ${newStatus}`);
    }

    const resolvedAt = newStatus === 'RESOLVED' && existing.status !== 'RESOLVED'
      ? new Date()
      : newStatus && newStatus !== 'RESOLVED' && existing.status === 'RESOLVED'
        ? null
        : undefined;

    const updated = await this.repo.updateFinding(findingId, {
      ...(newStatus ? { status: newStatus } : {}),
      ...(dto.notes !== undefined ? { notes: this.normalizeOptional(dto.notes) } : {}),
      ...(dto.rtlPic !== undefined ? { rtlPic: this.normalizeOptional(dto.rtlPic) } : {}),
      ...(dto.rtlDeadline !== undefined ? { rtlDeadline: this.normalizeDate(dto.rtlDeadline) } : {}),
      ...(dto.rtlAction !== undefined ? { rtlAction: this.normalizeOptional(dto.rtlAction) } : {}),
      ...(dto.rtlNotes !== undefined ? { rtlNotes: this.normalizeOptional(dto.rtlNotes) } : {}),
      ...(resolvedAt !== undefined ? { resolvedAt } : {}),
    });

    await this.repo.createAuditLog({
      periodId,
      action: 'PATCH_FINDING',
      actorId: user.id,
      actorRole: this.primaryRole(user),
      metadata: this.toJsonObject({
        findingId,
        previousStatus: existing.status,
        newStatus: newStatus ?? existing.status,
      }),
    });

    return this.toFindingResponse(updated);
  }

  async createBeritaAcara(periodId: string, dto: CreateBeritaAcaraDto, user: AuthUser) {
    this.ensureRole(user, MATCHING_ROLES, 'membuat Berita Acara Rekonsiliasi');
    await this.getPeriodOrThrow(periodId);

    const run = await this.repo.findLatestMatchingRunByPeriod(periodId);
    const statusCounts = await this.repo.countFindingsByStatus(periodId, run?.id);
    const summary = await this.repo.findFindingsSummary(periodId, run?.id);

    const totalTemuan = Object.values(statusCounts).reduce((a, b) => a + b, 0);
    const totalResolved = statusCounts['RESOLVED'] ?? 0;

    const existing = await this.repo.findLatestBeritaAcaraByPeriod(periodId);
    if (existing && existing.status === 'FINALIZED') {
      throw new BadRequestException('Berita Acara sudah difinalisasi. Tidak dapat membuat BA baru untuk periode ini.');
    }

    const ba = existing
      ? await this.repo.updateBeritaAcara(existing.id, {
          nomorBA: this.normalizeOptional(dto.nomorBA) ?? existing.nomorBA,
          tanggalBA: this.normalizeDate(dto.tanggalBA) ?? existing.tanggalBA,
          totalTemuan,
          totalResolved,
          totalPending: totalTemuan - totalResolved,
          summaryJson: this.toJsonObject({ byCode: Object.fromEntries(summary.map((s) => [s.findingCode, s.count])), statusCounts }),
          notes: this.normalizeOptional(dto.notes) ?? existing.notes,
          matchingRunId: run?.id ?? existing.matchingRunId,
          draftedById: user.id,
          draftedAt: new Date(),
        })
      : await this.repo.createBeritaAcara({
          periodId,
          matchingRunId: run?.id,
          status: 'DRAFT',
          nomorBA: this.normalizeOptional(dto.nomorBA),
          tanggalBA: this.normalizeDate(dto.tanggalBA),
          totalTemuan,
          totalResolved,
          totalPending: totalTemuan - totalResolved,
          summaryJson: this.toJsonObject({ byCode: Object.fromEntries(summary.map((s) => [s.findingCode, s.count])), statusCounts }),
          notes: this.normalizeOptional(dto.notes),
          draftedById: user.id,
          draftedAt: new Date(),
        });

    await this.repo.createAuditLog({
      periodId,
      action: 'CREATE_BERITA_ACARA',
      actorId: user.id,
      actorRole: this.primaryRole(user),
      metadata: this.toJsonObject({ baId: ba.id, status: ba.status }),
    });

    return this.toBeritaAcaraResponse(ba);
  }

  async finalizeBeritaAcara(periodId: string, dto: FinalizeBeritaAcaraDto, user: AuthUser) {
    this.ensureRole(user, ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID'], 'memfinalisasi Berita Acara');
    await this.getPeriodOrThrow(periodId);

    const existing = await this.repo.findLatestBeritaAcaraByPeriod(periodId);
    if (!existing) throw new NotFoundException('Berita Acara belum dibuat. Buat draft terlebih dahulu.');
    if (existing.status === 'FINALIZED') throw new BadRequestException('Berita Acara sudah difinalisasi.');

    const ba = await this.repo.updateBeritaAcara(existing.id, {
      status: 'FINALIZED',
      nomorBA: this.normalizeOptional(dto.nomorBA) ?? existing.nomorBA,
      tanggalBA: this.normalizeDate(dto.tanggalBA) ?? existing.tanggalBA,
      notes: this.normalizeOptional(dto.notes) ?? existing.notes,
      finalizedById: user.id,
      finalizedAt: new Date(),
    });

    await this.repo.createAuditLog({
      periodId,
      action: 'FINALIZE_BERITA_ACARA',
      actorId: user.id,
      actorRole: this.primaryRole(user),
      metadata: this.toJsonObject({ baId: ba.id }),
    });

    return this.toBeritaAcaraResponse(ba);
  }

  async getBeritaAcara(periodId: string, user: AuthUser) {
    this.ensureInternal(user);
    await this.getPeriodOrThrow(periodId);
    const ba = await this.repo.findLatestBeritaAcaraByPeriod(periodId);
    return ba ? this.toBeritaAcaraResponse(ba) : null;
  }

  async getLaporanStats(periodId: string, user: AuthUser) {
    this.ensureInternal(user);
    await this.getPeriodOrThrow(periodId);
    const run = await this.repo.findLatestMatchingRunByPeriod(periodId);
    const summary = await this.repo.findFindingsSummary(periodId, run?.id);
    const statusCounts = await this.repo.countFindingsByStatus(periodId, run?.id);
    const ba = await this.repo.findLatestBeritaAcaraByPeriod(periodId);

    const totalFindings = summary.reduce((acc, s) => acc + s.count, 0);
    const totalResolved = statusCounts['RESOLVED'] ?? 0;
    const totalOpen = statusCounts['OPEN'] ?? 0;
    const totalInFollowUp = statusCounts['IN_FOLLOW_UP'] ?? 0;
    const totalNeedsOpdClarification = statusCounts['NEEDS_CLARIFICATION'] ?? 0;

    const segeraFindings = summary.filter((s) => s.priority === 'SEGERA');
    const bulanIniFindings = summary.filter((s) => s.priority === 'BULAN_INI');
    const totalSegera = segeraFindings.reduce((acc, s) => acc + s.count, 0);
    const totalBulanIni = bulanIniFindings.reduce((acc, s) => acc + s.count, 0);

    const byCode = Object.fromEntries(summary.map((s) => [s.findingCode, s.count]));
    const resolvedPct = totalFindings > 0 ? Math.round((totalResolved / totalFindings) * 100) : 0;

    return {
      matchingRun: run ? this.toMatchingRunResponse(run) : null,
      beritaAcara: ba ? this.toBeritaAcaraResponse(ba) : null,
      findings: {
        total: totalFindings,
        totalResolved,
        totalOpen,
        totalInFollowUp,
        totalNeedsOpdClarification,
        resolvedPct,
        totalSegera,
        totalBulanIni,
        byCode,
        byStatus: statusCounts,
      },
    };
  }

  private toBeritaAcaraResponse(item: ReconciliationBeritaAcaraRecord) {
    return {
      ...item,
      tanggalBA: item.tanggalBA?.toISOString().split('T')[0] ?? null,
      draftedAt: item.draftedAt?.toISOString() ?? null,
      finalizedAt: item.finalizedAt?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  private async resolveMatchingBatchId(periodId: string, batchId?: string) {
    if (batchId) {
      const batch = await this.repo.findImportBatchById(batchId);
      if (!batch) throw new BadRequestException('Batch import tidak ditemukan');
      if (batch.periodId && batch.periodId !== periodId) {
        throw new BadRequestException('Batch bukan milik periode ini');
      }
      return batchId;
    }

    const periodBatch = await this.repo.findLatestValidatedBatchByPeriod(periodId);
    if (periodBatch) return periodBatch.id;

    const globalBatch = await this.repo.findLatestValidatedBatchWithoutPeriod();
    if (globalBatch) return globalBatch.id;

    throw new BadRequestException(
      'Tidak ada batch Simgaji VALIDATED untuk periode ini. Upload dan validasi file Simgaji terlebih dahulu.',
    );
  }

  private computeFindings(
    periodId: string,
    matchingRunId: string,
    asnList: Awaited<ReturnType<typeof this.repo.findAllAsnForMatching>>,
    bpkadRows: Awaited<ReturnType<typeof this.repo.findAllPayrollRowsByBatchId>>,
  ): Prisma.ReconciliationFindingCreateManyInput[] {
    const findings: Prisma.ReconciliationFindingCreateManyInput[] = [];
    const now = new Date();

    const bpkadByNip = new Map<string, typeof bpkadRows[number]>();
    const bpkadNipCount = new Map<string, number>();

    for (const row of bpkadRows) {
      if (!row.nip) continue;
      const nip = row.nip.trim();
      bpkadNipCount.set(nip, (bpkadNipCount.get(nip) ?? 0) + 1);
      if (!bpkadByNip.has(nip)) bpkadByNip.set(nip, row);
    }

    const asnByNip = new Map<string, typeof asnList[number]>();
    for (const asn of asnList) {
      asnByNip.set(asn.nip.trim(), asn);
    }

    // R09: NIP ganda di Simgaji BPKAD
    for (const [nip, count] of bpkadNipCount) {
      if (count > 1) {
        const row = bpkadByNip.get(nip);
        findings.push({
          id: this.generateId(),
          matchingRunId,
          periodId,
          findingCode: 'R09',
          priority: FINDING_PRIORITY['R09'],
          status: 'OPEN',
          nip,
          namaBpkad: row?.nama ?? null,
          bpkadValue: `${count} entri untuk NIP yang sama`,
          description: FINDING_DESCRIPTION['R09'],
          bpkadRowId: row?.id ?? null,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    // R01: Ada di BKPSDM (active), tidak ada di BPKAD
    for (const asn of asnList) {
      const nip = asn.nip.trim();
      if (!bpkadByNip.has(nip)) {
        if (this.isInactiveStatus(asn.kedudukanHukumNama)) continue;
        findings.push({
          id: this.generateId(),
          matchingRunId,
          periodId,
          findingCode: 'R01',
          priority: FINDING_PRIORITY['R01'],
          status: 'OPEN',
          nip,
          namaBkpsdm: asn.nama,
          bkpsdmValue: asn.kedudukanHukumNama ?? 'Aktif',
          description: FINDING_DESCRIPTION['R01'],
          asnId: asn.id,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    // R02: Ada di BPKAD, tidak ada di BKPSDM
    for (const row of bpkadRows) {
      if (!row.nip) continue;
      const nip = row.nip.trim();
      if (!asnByNip.has(nip)) {
        findings.push({
          id: this.generateId(),
          matchingRunId,
          periodId,
          findingCode: 'R02',
          priority: FINDING_PRIORITY['R02'],
          status: 'OPEN',
          nip,
          namaBpkad: row.nama,
          bpkadValue: `${row.nmSkpd ?? row.kdSkpd ?? '-'}`,
          description: FINDING_DESCRIPTION['R02'],
          bpkadRowId: row.id,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    // For matched NIPs: R03, R04, R05, R06, R08
    for (const asn of asnList) {
      const nip = asn.nip.trim();
      const row = bpkadByNip.get(nip);
      if (!row) continue;

      // R03: Status kepegawaian berbeda (BKPSDM inactive tapi BPKAD masih gaji)
      if (this.isInactiveStatus(asn.kedudukanHukumNama)) {
        const isStillPaid = !row.tmtStop || new Date(row.tmtStop) > now;
        if (isStillPaid) {
          findings.push({
            id: this.generateId(),
            matchingRunId,
            periodId,
            findingCode: 'R03',
            priority: FINDING_PRIORITY['R03'],
            status: 'OPEN',
            nip,
            namaBkpsdm: asn.nama,
            namaBpkad: row.nama,
            bkpsdmValue: asn.kedudukanHukumNama ?? '-',
            bpkadValue: row.kdStapeg ?? 'Masih aktif gaji',
            description: FINDING_DESCRIPTION['R03'],
            asnId: asn.id,
            bpkadRowId: row.id,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      // R04: Pangkat/golongan berbeda
      const bkpsdmGol = this.extractGolonganCode(asn.golonganNama);
      const bpkadGol = this.normalizeGolonganCode(row.kdPangkat);
      if (bkpsdmGol && bpkadGol && bkpsdmGol !== bpkadGol) {
        findings.push({
          id: this.generateId(),
          matchingRunId,
          periodId,
          findingCode: 'R04',
          priority: FINDING_PRIORITY['R04'],
          status: 'OPEN',
          nip,
          namaBkpsdm: asn.nama,
          namaBpkad: row.nama,
          bkpsdmValue: asn.golonganNama ?? bkpsdmGol,
          bpkadValue: row.kdPangkat ?? bpkadGol,
          description: FINDING_DESCRIPTION['R04'],
          asnId: asn.id,
          bpkadRowId: row.id,
          createdAt: now,
          updatedAt: now,
        });
      }

      // R05: Jabatan berbeda — compare kdStapeg (status pegawai code) vs jenis jabatan
      const bkpsdmJabatan = this.normalizeText(asn.jabatanNama);
      const bpkadStapeg = this.normalizeText(row.kdStapeg);
      if (bkpsdmJabatan && bpkadStapeg && !this.jabatanCodeMatches(asn.jenisJabatanNama, row.kdStapeg)) {
        findings.push({
          id: this.generateId(),
          matchingRunId,
          periodId,
          findingCode: 'R05',
          priority: FINDING_PRIORITY['R05'],
          status: 'OPEN',
          nip,
          namaBkpsdm: asn.nama,
          namaBpkad: row.nama,
          bkpsdmValue: asn.jabatanNama ?? '-',
          bpkadValue: row.kdStapeg ?? '-',
          description: FINDING_DESCRIPTION['R05'],
          asnId: asn.id,
          bpkadRowId: row.id,
          createdAt: now,
          updatedAt: now,
        });
      }

      // R06: Unit kerja/OPD berbeda
      const bkpsdmUnor = this.normalizeText(asn.unorNama);
      const bpkadSkpd = this.normalizeText(row.nmSkpd ?? row.nmSatker);
      if (bkpsdmUnor && bpkadSkpd && !this.unitMatches(bkpsdmUnor, bpkadSkpd)) {
        findings.push({
          id: this.generateId(),
          matchingRunId,
          periodId,
          findingCode: 'R06',
          priority: FINDING_PRIORITY['R06'],
          status: 'OPEN',
          nip,
          namaBkpsdm: asn.nama,
          namaBpkad: row.nama,
          bkpsdmValue: asn.unorNama ?? '-',
          bpkadValue: row.nmSkpd ?? row.kdSkpd ?? '-',
          description: FINDING_DESCRIPTION['R06'],
          asnId: asn.id,
          bpkadRowId: row.id,
          createdAt: now,
          updatedAt: now,
        });
      }

      // R08: Nama berbeda signifikan
      const simNama = this.nameSimilarity(asn.nama, row.nama ?? '');
      if (simNama < 0.5 && asn.nama && row.nama) {
        findings.push({
          id: this.generateId(),
          matchingRunId,
          periodId,
          findingCode: 'R08',
          priority: FINDING_PRIORITY['R08'],
          status: 'OPEN',
          nip,
          namaBkpsdm: asn.nama,
          namaBpkad: row.nama,
          bkpsdmValue: asn.nama,
          bpkadValue: row.nama,
          description: FINDING_DESCRIPTION['R08'],
          asnId: asn.id,
          bpkadRowId: row.id,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    // R10: Komponen pembayaran tidak sesuai (bersih ≠ kotor − potongan)
    for (const row of bpkadRows) {
      if (!row.nip) continue;
      const nip = row.nip.trim();
      const kotor = row.kotor?.toNumber() ?? null;
      const potongan = row.potongan?.toNumber() ?? null;
      const bersih = row.bersih?.toNumber() ?? null;

      if (kotor !== null && potongan !== null && bersih !== null) {
        const expected = kotor - potongan;
        if (Math.abs(bersih - expected) > 1) {
          findings.push({
            id: this.generateId(),
            matchingRunId,
            periodId,
            findingCode: 'R10',
            priority: FINDING_PRIORITY['R10'],
            status: 'OPEN',
            nip,
            namaBpkad: row.nama,
            bpkadValue: `Bersih=${bersih.toFixed(0)}, expected=${expected.toFixed(0)}, selisih=${(bersih - expected).toFixed(0)}`,
            description: FINDING_DESCRIPTION['R10'],
            bpkadRowId: row.id,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }

    return findings;
  }

  private countFindings(findings: Prisma.ReconciliationFindingCreateManyInput[]) {
    const counter: Record<string, number> = {
      totalR01: 0, totalR02: 0, totalR03: 0, totalR04: 0,
      totalR05: 0, totalR06: 0, totalR08: 0, totalR09: 0,
    };

    for (const f of findings) {
      const key = `total${f.findingCode}` as keyof typeof counter;
      if (key in counter) counter[key]++;
    }

    return counter;
  }

  private isInactiveStatus(kedudukanHukumNama: string | null | undefined) {
    if (!kedudukanHukumNama) return false;
    const normalized = kedudukanHukumNama.toLowerCase();
    return INACTIVE_STATUS_KEYWORDS.some((kw) => normalized.includes(kw));
  }

  private extractGolonganCode(golonganNama: string | null | undefined): string | null {
    if (!golonganNama) return null;
    const match = golonganNama.match(/[IVX]+\/[a-e]/i);
    return match ? match[0].toUpperCase() : null;
  }

  private normalizeGolonganCode(kdPangkat: string | null | undefined): string | null {
    if (!kdPangkat) return null;
    const cleaned = kdPangkat.trim().toUpperCase();
    if (/^[IVX]+\/[A-E]$/.test(cleaned)) return cleaned;
    return null;
  }

  private jabatanCodeMatches(jenisJabatanNama: string | null | undefined, kdStapeg: string | null | undefined): boolean {
    if (!jenisJabatanNama || !kdStapeg) return true;
    const jenis = jenisJabatanNama.toLowerCase();
    const kode = kdStapeg.toLowerCase();
    if (jenis.includes('struktural') && (kode.includes('str') || kode === '1')) return true;
    if (jenis.includes('fungsional') && (kode.includes('fng') || kode === '2')) return true;
    if (jenis.includes('pelaksana') && (kode === '3' || kode.includes('pel'))) return true;
    return false;
  }

  private unitMatches(bkpsdmUnor: string, bpkadSkpd: string): boolean {
    const a = bkpsdmUnor.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    const b = bpkadSkpd.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    if (a === b) return true;
    const aWords = new Set(a.split(' ').filter((w) => w.length > 3));
    const bWords = new Set(b.split(' ').filter((w) => w.length > 3));
    let common = 0;
    for (const word of aWords) {
      if (bWords.has(word)) common++;
    }
    const union = aWords.size + bWords.size - common;
    return union > 0 && common / union >= 0.5;
  }

  private nameSimilarity(nameA: string, nameB: string): number {
    const a = nameA.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim();
    const b = nameB.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim();
    if (a === b) return 1;
    const aWords = new Set(a.split(' '));
    const bWords = new Set(b.split(' '));
    let common = 0;
    for (const word of aWords) {
      if (bWords.has(word)) common++;
    }
    const union = aWords.size + bWords.size - common;
    return union > 0 ? common / union : 0;
  }

  private normalizeText(value: string | null | undefined): string | null {
    if (!value) return null;
    return value.trim().toLowerCase().replace(/\s+/g, ' ') || null;
  }

  private generateId(): string {
    return randomUUID();
  }

  private async getPeriodOrThrow(id: string) {
    const period = await this.repo.findPeriodById(id);
    if (!period) throw new NotFoundException('Periode rekonsiliasi tidak ditemukan');
    return period;
  }

  private toMatchingRunResponse(item: ReconciliationMatchingRunRecord) {
    return {
      ...item,
      runAt: item.runAt?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  private toFindingResponse(item: ReconciliationFindingRecord) {
    return {
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  async cancelImportBatch(id: string, user: AuthUser) {
    this.ensureRole(user, UPLOAD_ROLES, 'membatalkan import rekonsiliasi');
    const before = await this.getBatchOrThrow(id);

    if (before.status === 'COMMITTED') {
      throw new BadRequestException('Batch yang sudah dicommit tidak dapat dibatalkan');
    }

    const batch = await this.repo.updateImportBatch(id, {
      status: 'CANCELLED',
      errorMessage: 'Dibatalkan oleh pengguna',
    });

    await this.repo.createAuditLog({
      periodId: batch.periodId,
      batchId: batch.id,
      action: 'CANCEL_IMPORT',
      actorId: user.id,
      actorRole: this.primaryRole(user),
      metadata: this.toJsonObject({ previousStatus: before.status }),
    });

    return this.toBatchResponse(batch);
  }

  private async getBatchOrThrow(id: string) {
    const batch = await this.repo.findImportBatchById(id);
    if (!batch) {
      throw new NotFoundException('Batch import rekonsiliasi tidak ditemukan');
    }
    return batch;
  }

  private validateExcelFile(file: ReconciliationBufferedFile | undefined) {
    if (!file) {
      throw new BadRequestException('File wajib diunggah');
    }

    const extension = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.xlsx', '.xls'];

    if (!allowedExtensions.includes(extension)) {
      throw new BadRequestException('File harus berformat .xlsx atau .xls');
    }

    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Tipe file tidak valid. Hanya format Excel (.xlsx, .xls) yang diizinkan.',
      );
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('File kosong atau tidak dapat dibaca');
    }

    return file;
  }

  private extractColumns(rows: Array<Record<string, unknown>>) {
    const firstRow = rows[0] ?? {};
    return Object.keys(firstRow).map((key) => this.normalizeColumnName(key));
  }

  private mapPayrollRows(rows: Array<Record<string, unknown>>): BpkadPayrollMappedRow[] {
    const nipCounter = new Map<string, number>();
    const mapped = rows.map((row, index) => {
      const nip = this.getString(row, 'nip');
      if (nip) {
        nipCounter.set(nip, (nipCounter.get(nip) ?? 0) + 1);
      }

      const validationErrors: string[] = [];
      if (!nip) validationErrors.push('NIP kosong');
      if (!this.getString(row, 'nama')) validationErrors.push('Nama kosong');

      return {
        rowNumber: index + 2,
        tglGaji: this.getDate(row, 'tglgaji'),
        nip,
        nipLama: this.getString(row, 'niplama'),
        nama: this.getString(row, 'nama'),
        kdSkpd: this.getString(row, 'kdskpd'),
        kdSatker: this.getString(row, 'kdsatker'),
        nmSkpd: this.getString(row, 'nmskpd'),
        nmSatker: this.getString(row, 'nmsatker'),
        kdStapeg: this.getString(row, 'kdstapeg'),
        tmtStop: this.getDate(row, 'tmtstop'),
        kdPangkat: this.getString(row, 'kdpangkat'),
        gapok: this.getMoney(row, 'gapok'),
        kotor: this.getMoney(row, 'kotor'),
        potongan: this.getMoney(row, 'potongan'),
        bersih: this.getMoney(row, 'bersih'),
        npwp: this.getString(row, 'npwp'),
        noKtp: this.getString(row, 'noktp'),
        validationStatus: validationErrors.length > 0 ? 'INVALID' : 'VALID',
        validationErrors,
        rawData: this.toJsonObject(row),
      } satisfies BpkadPayrollMappedRow;
    });

    return mapped.map((row) => {
      const isDuplicate = row.nip ? (nipCounter.get(row.nip) ?? 0) > 1 : false;
      if (!isDuplicate || row.validationStatus === 'INVALID') {
        return row;
      }

      return {
        ...row,
        validationStatus: 'WARNING',
        validationErrors: ['NIP duplikat dalam file Simgaji'],
      };
    });
  }

  private buildSummary(
    rows: BpkadPayrollMappedRow[],
    missingColumns: string[],
  ): ReconciliationSummary {
    return {
      totalRows: rows.length,
      validRows: rows.filter((row) => row.validationStatus === 'VALID').length,
      invalidRows: missingColumns.length > 0
        ? rows.length
        : rows.filter((row) => row.validationStatus === 'INVALID').length,
      duplicateRows: rows.filter((row) =>
        row.validationErrors.includes('NIP duplikat dalam file Simgaji'),
      ).length,
      warningRows: rows.filter((row) => row.validationStatus === 'WARNING').length,
    };
  }

  private async createPayrollRowsInChunks(
    batchId: string,
    rows: BpkadPayrollMappedRow[],
  ) {
    const chunkSize = 500;
    for (let index = 0; index < rows.length; index += chunkSize) {
      const chunk = rows.slice(index, index + chunkSize).map((row) => ({
        batchId,
        rowNumber: row.rowNumber,
        tglGaji: row.tglGaji,
        nip: row.nip,
        nipLama: row.nipLama,
        nama: row.nama,
        kdSkpd: row.kdSkpd,
        kdSatker: row.kdSatker,
        nmSkpd: row.nmSkpd,
        nmSatker: row.nmSatker,
        kdStapeg: row.kdStapeg,
        tmtStop: row.tmtStop,
        kdPangkat: row.kdPangkat,
        gapok: row.gapok,
        kotor: row.kotor,
        potongan: row.potongan,
        bersih: row.bersih,
        npwp: row.npwp,
        noKtp: row.noKtp,
        validationStatus: row.validationStatus,
        validationErrors: row.validationErrors,
        rawData: row.rawData,
      }));

      await this.repo.createPayrollRows(chunk);
    }
  }

  private getString(row: Record<string, unknown>, key: string) {
    const value = this.findValue(row, key);
    if (value === null || value === undefined) {
      return null;
    }

    const normalized = String(value).trim();
    return normalized || null;
  }

  private getMoney(row: Record<string, unknown>, key: string) {
    const value = this.findValue(row, key);
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const normalized = String(value).replace(/[^\d.-]/g, '');
    const parsed = Number(normalized);

    return Number.isFinite(parsed) ? parsed.toFixed(2) : null;
  }

  private getDate(row: Record<string, unknown>, key: string) {
    const value = this.findValue(row, key);
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (value instanceof Date && Number.isFinite(value.getTime())) {
      return value;
    }

    if (typeof value === 'number') {
      const excelEpoch = Date.UTC(1899, 11, 30, 12, 0, 0);
      return new Date(excelEpoch + Math.trunc(value) * 86_400_000);
    }

    const parsed = new Date(String(value));
    return Number.isFinite(parsed.getTime()) ? parsed : null;
  }

  private findValue(row: Record<string, unknown>, expectedKey: string) {
    const entry = Object.entries(row).find(
      ([key]) => this.normalizeColumnName(key) === expectedKey,
    );

    return entry?.[1] ?? null;
  }

  private normalizeColumnName(value: string) {
    return value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private normalizePagination(query: ReconciliationQueryDto) {
    return {
      page: this.normalizeInt(query.page, 1, 1, 100_000),
      limit: this.normalizeInt(query.limit, 20, 1, 200),
    };
  }

  private normalizeInt(
    value: string | undefined,
    fallback: number,
    min = 1,
    max = 9999,
  ) {
    const parsed = Number.parseInt(value ?? '', 10);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }

    return Math.min(max, Math.max(min, parsed));
  }

  private normalizeDate(value: string | undefined) {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) ? parsed : null;
  }

  private normalizeOptional(value: string | null | undefined) {
    const normalized = value?.trim();
    return normalized || undefined;
  }

  private normalizePeriodType(value: string | undefined) {
    const normalized = value?.trim().toUpperCase();
    return normalized === 'QUARTERLY' ? 'QUARTERLY' : 'MONTHLY';
  }

  private buildPeriodTitle(
    periodType: string,
    year: number,
    month: number,
    quarter: number,
  ) {
    if (periodType === 'QUARTERLY') {
      return `Rekonsiliasi Triwulan ${quarter} ${year}`;
    }

    return `Rekonsiliasi Bulan ${month} ${year}`;
  }

  private sanitizeFileName(fileName: string) {
    const extension = path.extname(fileName).toLowerCase();
    const baseName = path
      .basename(fileName, extension)
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120);

    return `${baseName || 'simgaji'}-${Date.now()}${extension}`;
  }

  private ensureInternal(user: AuthUser) {
    if (!user.roles.some((role) => INTERNAL_ROLES.includes(role))) {
      throw new ForbiddenException('Modul rekonsiliasi hanya untuk internal BKPSDM');
    }
  }

  private ensureRole(user: AuthUser, allowedRoles: string[], actionLabel: string) {
    this.ensureInternal(user);
    if (!user.roles.some((role) => allowedRoles.includes(role))) {
      throw new ForbiddenException(`Role Anda tidak berwenang untuk ${actionLabel}`);
    }
  }

  private primaryRole(user: AuthUser) {
    return user.roles[0] ?? 'UNKNOWN';
  }

  private toJsonValue(value: unknown): Prisma.InputJsonValue | null {
    if (value === null) return null;
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map((item) => this.toJsonValue(item));
    if (typeof value === 'object') return this.toJsonObject(value as Record<string, unknown>);
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    return String(value);
  }

  private toJsonObject(value: Record<string, unknown>): Prisma.InputJsonObject {
    const entries = Object.entries(value).map(
      ([key, entry]) => [key, this.toJsonValue(entry)] as [
        string,
        Prisma.InputJsonValue | null,
      ],
    );

    return Object.fromEntries(entries) as Prisma.InputJsonObject;
  }

  private toPeriodResponse(item: ReconciliationPeriodRecord) {
    return {
      ...item,
      cutOffDate: item.cutOffDate?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  private toBatchResponse(item: ReconciliationImportBatchRecord) {
    return {
      ...item,
      uploadedAt: item.uploadedAt?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      period: item.period ? this.toPeriodResponse(item.period) : null,
    };
  }

  private toPayrollRowResponse(item: ReconciliationPayrollRowRecord) {
    return {
      ...item,
      tglGaji: item.tglGaji?.toISOString() ?? null,
      tmtStop: item.tmtStop?.toISOString() ?? null,
      gapok: item.gapok?.toString() ?? null,
      kotor: item.kotor?.toString() ?? null,
      potongan: item.potongan?.toString() ?? null,
      bersih: item.bersih?.toString() ?? null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }
}
