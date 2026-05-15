import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import * as XLSX from 'xlsx';
import { EventBusService } from '../events/event-bus.service';
import { SidataImportRepository } from './sidata-import.repository';
import {
  AuditLogRow,
  CommitGenericReferenceResult,
  CommitJfProfileResult,
  CommitReferenceJabatanResult,
  CommitSiasnAsnBatchResult,
  ExtractReferencesResult,
  GenericReferenceConfig,
  MapSiasnAsnBatchResult,
  NormalizedAuditLogFilters,
  SidataAsnReconciliationQueryDto,
  SidataAsnReconciliationResponse,
  SidataAsnReconciliationType,
  NormalizedSidataImportIssueQuery,
  PaginatedAuditLogResponse,
  ParsedJfProfileRow,
  SidataAuditLogQueryDto,
  PaginatedImportIssuesResponse,
  ParsedReferenceJabatanRow,
  ParsedSiasnAsnRow,
  ReferenceJabatanUploadResult,
  RemapSiasnAsnBatchResult,
  SIDATA_ASN_IMPORT_TYPE,
  SIDATA_ASN_TIPE_PEGAWAI,
  SidataAsnTipePegawai,
  SIDATA_IMPORT_AUDIT_ACTION,
  SIDATA_GENERIC_IMPORT_TYPE,
  SIDATA_GENERIC_REFERENCE_TYPE,
  SIDATA_IMPORT_SOURCE,
  SIDATA_IMPORT_STATUS,
  SIDATA_IMPORT_TYPE,
  SIDATA_JENIS_JABATAN,
  SIDATA_REFERENCE_MASTER_TARGET,
  SIDATA_REFERENCE_TYPE,
  SIDATA_VALIDATION_STATUS,
  SiasnAsnBatchResponse,
  SiasnAsnStagingResponse,
  SiasnAsnUploadResult,
  SidataBufferedFile,
  SidataImportIssueQueryDto,
  SidataImportJobAction,
  SidataImportJobResponse,
  SidataImportJobStatus,
  SidataImportSummaryResponse,
  SidataGenericReferenceType,
  SidataJenisJabatan,
  SidataReferenceType,
  SidataValidationStatus,
  ValidatedJfProfileRow,
  ValidatedReferenceJabatanRow,
  ValidatedSiasnAsnRow,
} from './sidata-import.types';
import {
  buildCsvFileName,
  createCsvStream,
  CsvExportResult,
  formatCsvDate,
  formatCsvDateTime,
  serializeCsvJson,
} from './sidata-csv.util';

@Injectable()
export class SidataImportService implements OnModuleInit {
  private readonly logger = new Logger(SidataImportService.name);
  private static readonly CSV_PAGE_SIZE = 1000;
  private readonly asnJobs = new Map<
    string,
    {
      batchId: string;
      action: SidataImportJobAction;
      status: SidataImportJobStatus;
      error?: string;
      startedAt: Date;
      finishedAt?: Date;
    }
  >();

  constructor(
    @Inject(SidataImportRepository)
    private readonly sidataImportRepository: SidataImportRepository,
    @Inject(EventBusService)
    private readonly eventBusService: EventBusService,
  ) {}

  async onModuleInit(): Promise<void> {
    const recovered =
      await this.sidataImportRepository.markProcessingAsnBatchesFailedOnStartup();

    if (recovered.count > 0) {
      this.logger.warn(
        `Recovered ${recovered.count} SIDATA ASN batch(es) left in PROCESSING state`,
      );
    }
  }

  async findBatches() {
    const batches = await this.sidataImportRepository.findBatches();

    return batches.map((batch) => ({
      ...batch,
      startedAt: batch.startedAt?.toISOString() ?? null,
      finishedAt: batch.finishedAt?.toISOString() ?? null,
      createdAt: batch.createdAt.toISOString(),
      updatedAt: batch.updatedAt.toISOString(),
    }));
  }

  async findBatchById(id: string) {
    const batch = await this.sidataImportRepository.findBatchById(id.trim());

    if (!batch) {
      throw new NotFoundException('Batch import tidak ditemukan');
    }

    return {
      ...batch,
      startedAt: batch.startedAt?.toISOString() ?? null,
      finishedAt: batch.finishedAt?.toISOString() ?? null,
      createdAt: batch.createdAt.toISOString(),
      updatedAt: batch.updatedAt.toISOString(),
    };
  }

  async findStagingByBatchId(batchId: string, pagination?: { page: number; limit: number }) {
    const batch = await this.sidataImportRepository.findBatchById(batchId.trim());

    if (!batch) {
      throw new NotFoundException('Batch import tidak ditemukan');
    }

    const { items, total } = await this.sidataImportRepository.findStagingByBatchId(batch.id, pagination);
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 50;

    return {
      items: items.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
      page,
      limit,
      total,
    };
  }

  async uploadReferenceJabatan(params: {
    file?: SidataBufferedFile;
    jenisJabatan?: string;
    importedById?: string | null;
  }): Promise<ReferenceJabatanUploadResult> {
    const jenisJabatan = this.normalizeJenisJabatan(params.jenisJabatan);
    const file = this.validateExcelFile(params.file);
    const fileChecksum = this.computeFileChecksum(file.buffer);

    const existing = await this.sidataImportRepository.findReferenceBatchByChecksum(fileChecksum);
    if (existing) {
      this.logger.warn(`uploadReferenceJabatan duplicate file checksum=${fileChecksum} existingBatch=${existing.id}`);
      throw new BadRequestException(
        `File ini sudah pernah diupload (batch ${existing.id}). Gunakan batch yang sudah ada atau upload file berbeda.`,
      );
    }

    const parsedRows = this.parseReferenceJabatanExcel(file);
    this.assertRowLimit(parsedRows.length);
    const validatedRows = this.validateReferenceRows(parsedRows);

    const importType = this.toImportType(jenisJabatan);
    const referenceType = this.toReferenceType(jenisJabatan);

    const totalRows = validatedRows.length;
    const invalidRows = validatedRows.filter(
      (row) => row.validationStatus === SIDATA_VALIDATION_STATUS.INVALID,
    ).length;
    const warningRows = validatedRows.filter(
      (row) => row.validationStatus === SIDATA_VALIDATION_STATUS.WARNING,
    ).length;
    const duplicateRows = validatedRows.filter((row) => row.isDuplicate).length;
    const validRows = totalRows - invalidRows;

    const batch = await this.sidataImportRepository.createReferenceBatch({
      source: SIDATA_IMPORT_SOURCE.SIASN,
      importType,
      fileName: file.originalname,
      fileChecksum,
      totalRows,
      validRows,
      invalidRows,
      duplicateRows,
      warningRows,
      importedById: params.importedById ?? null,
    });

    await this.sidataImportRepository.createReferenceStagingRows({
      batchId: batch.id,
      referenceType,
      rows: validatedRows,
    });

    const result = {
      batchId: batch.id,
      importType,
      status: batch.status,
      totalRows,
      validRows,
      invalidRows,
      duplicateRows,
      warningRows,
    };

    await this.sidataImportRepository.createImportAuditLog({
      action: SIDATA_IMPORT_AUDIT_ACTION.UPLOAD_REFERENCE,
      batchId: batch.id,
      batchType: 'REFERENCE',
      metadata: result,
    });

    this.logger.log(`uploadReferenceJabatan batchId=${batch.id} importType=${importType} total=${totalRows}`);
    return result;
  }

  async commitReferenceJabatanBatch(batchId: string): Promise<CommitReferenceJabatanResult> {
    const normalizedBatchId = batchId.trim();
    const batch = await this.sidataImportRepository.findBatchById(normalizedBatchId);

    if (!batch) {
      throw new NotFoundException('Batch import tidak ditemukan');
    }

    if (batch.status === SIDATA_IMPORT_STATUS.COMMITTED) {
      throw new BadRequestException('Batch import sudah pernah di-commit');
    }

    if (batch.status === SIDATA_IMPORT_STATUS.FAILED) {
      throw new BadRequestException('Batch import gagal dan tidak dapat di-commit');
    }

    if (batch.status === SIDATA_IMPORT_STATUS.CANCELLED) {
      throw new BadRequestException('Batch import dibatalkan dan tidak dapat di-commit');
    }

    const jenisJabatanKode = this.toJenisJabatanFromImportType(batch.importType);

    const jenisJabatan = await this.sidataImportRepository.findJenisJabatanByKode(
      jenisJabatanKode,
    );

    if (!jenisJabatan) {
      throw new BadRequestException(
        `Jenis jabatan ${jenisJabatanKode} belum tersedia. Jalankan seed ref_jenis_jabatan terlebih dahulu.`,
      );
    }

    let result: CommitReferenceJabatanResult;
    try {
      result = await this.sidataImportRepository.commitReferenceJabatanBatch({
        batchId: batch.id,
        jenisJabatanId: jenisJabatan.id,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`commitReferenceJabatanBatch failed batchId=${batch.id}: ${message}`);
      if (message !== 'BATCH_ALREADY_PROCESSING_OR_COMMITTED') {
        await this.sidataImportRepository.markBatchFailed({ batchId: batch.id, errorMessage: message }).catch(() => undefined);
        await this.sidataImportRepository.createImportAuditLog({
          action: SIDATA_IMPORT_AUDIT_ACTION.COMMIT_REFERENCE,
          batchId: batch.id,
          batchType: 'REFERENCE',
          metadata: { error: message, status: 'FAILED' },
        }).catch(() => undefined);
      }
      throw err;
    }

    await this.sidataImportRepository.createImportAuditLog({
      action: SIDATA_IMPORT_AUDIT_ACTION.COMMIT_REFERENCE,
      batchId: batch.id,
      batchType: 'REFERENCE',
      metadata: result,
    });

    this.logger.log(`commitReferenceJabatanBatch success batchId=${batch.id} committed=${result.committedRows}`);
    return result;
  }

  // ─── Phase 3B: JF Profile Import ─────────────────────────────────────────────

  async uploadJfProfile(params: {
    file?: SidataBufferedFile;
    importedById?: string | null;
  }): Promise<ReferenceJabatanUploadResult> {
    const file = this.validateExcelFile(params.file);
    const fileChecksum = this.computeFileChecksum(file.buffer);

    const existingBatch = await this.sidataImportRepository.findReferenceBatchByChecksum(fileChecksum);
    if (existingBatch) {
      this.logger.warn(`uploadJfProfile duplicate file checksum=${fileChecksum} existingBatch=${existingBatch.id}`);
      throw new BadRequestException(
        `File ini sudah pernah diupload (batch ${existingBatch.id}). Gunakan batch yang sudah ada atau upload file berbeda.`,
      );
    }

    const parsedRows = this.parseJfProfileExcel(file);
    this.assertRowLimit(parsedRows.length);
    const validatedRows = this.validateJfProfileRows(parsedRows);

    const totalRows = validatedRows.length;
    const invalidRows = validatedRows.filter(
      (r) => r.validationStatus === SIDATA_VALIDATION_STATUS.INVALID,
    ).length;
    const warningRows = validatedRows.filter(
      (r) => r.validationStatus === SIDATA_VALIDATION_STATUS.WARNING,
    ).length;
    const duplicateRows = validatedRows.filter((r) => r.isDuplicate).length;
    const validRows = totalRows - invalidRows;

    const batch = await this.sidataImportRepository.createReferenceBatch({
      source: SIDATA_IMPORT_SOURCE.SIASN,
      importType: SIDATA_IMPORT_TYPE.SIASN_REFERENCE_JF_PROFILE,
      fileName: file.originalname,
      fileChecksum,
      totalRows,
      validRows,
      invalidRows,
      duplicateRows,
      warningRows,
      importedById: params.importedById ?? null,
    });

    await this.sidataImportRepository.createJfProfileStagingRows({
      batchId: batch.id,
      rows: validatedRows,
    });

    const result: ReferenceJabatanUploadResult = {
      batchId: batch.id,
      importType: SIDATA_IMPORT_TYPE.SIASN_REFERENCE_JF_PROFILE,
      status: batch.status,
      totalRows,
      validRows,
      invalidRows,
      duplicateRows,
      warningRows,
    };

    await this.sidataImportRepository.createImportAuditLog({
      action: SIDATA_IMPORT_AUDIT_ACTION.UPLOAD_REFERENCE,
      batchId: batch.id,
      batchType: 'REFERENCE',
      metadata: { ...result, referenceType: SIDATA_REFERENCE_TYPE.JF_PROFILE },
    });

    return result;
  }

  async commitJfProfileBatch(batchId: string): Promise<CommitJfProfileResult> {
    const normalizedBatchId = batchId.trim();
    const batch = await this.sidataImportRepository.findBatchById(normalizedBatchId);

    if (!batch) throw new NotFoundException('Batch import tidak ditemukan');

    if (batch.importType !== SIDATA_IMPORT_TYPE.SIASN_REFERENCE_JF_PROFILE) {
      throw new BadRequestException('Batch bukan tipe JF Profile');
    }

    if (batch.status === SIDATA_IMPORT_STATUS.COMMITTED) {
      throw new BadRequestException('Batch import sudah pernah di-commit');
    }

    if (batch.status === SIDATA_IMPORT_STATUS.FAILED) {
      throw new BadRequestException('Batch import gagal dan tidak dapat di-commit');
    }

    if (batch.status === SIDATA_IMPORT_STATUS.CANCELLED) {
      throw new BadRequestException('Batch import dibatalkan dan tidak dapat di-commit');
    }

    let result: CommitJfProfileResult;
    try {
      result = await this.sidataImportRepository.commitJfProfileBatch({ batchId: batch.id });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`commitJfProfileBatch failed batchId=${batch.id}: ${message}`);
      if (message !== 'BATCH_ALREADY_PROCESSING_OR_COMMITTED') {
        await this.sidataImportRepository.markBatchFailed({ batchId: batch.id, errorMessage: message }).catch(() => undefined);
        await this.sidataImportRepository.createImportAuditLog({
          action: SIDATA_IMPORT_AUDIT_ACTION.COMMIT_REFERENCE,
          batchId: batch.id,
          batchType: 'REFERENCE',
          metadata: { error: message, status: 'FAILED' },
        }).catch(() => undefined);
      }
      throw err;
    }

    await this.sidataImportRepository.createImportAuditLog({
      action: SIDATA_IMPORT_AUDIT_ACTION.COMMIT_REFERENCE,
      batchId: batch.id,
      batchType: 'REFERENCE',
      metadata: result,
    });

    this.logger.log(`commitJfProfileBatch success batchId=${batch.id} committed=${result.committedRows}`);
    return result;
  }

  private parseJfProfileExcel(file: SidataBufferedFile): ParsedJfProfileRow[] {
    let workbook: XLSX.WorkBook;

    try {
      workbook = XLSX.read(file.buffer, { type: 'buffer', cellDates: false });
    } catch {
      throw new BadRequestException('File Excel tidak dapat dibaca');
    }

    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) throw new BadRequestException('File Excel tidak memiliki worksheet');

    const sheet = workbook.Sheets[firstSheetName];
    if (!sheet) throw new BadRequestException('Worksheet pertama tidak ditemukan');

    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: null,
      raw: false,
    });

    if (rawRows.length === 0) throw new BadRequestException('Worksheet tidak memiliki data');

    const headers = Object.keys(rawRows[0] ?? {});
    const h = (candidates: string[]) => this.findHeader(headers, candidates);

    const hNamaJabatan = h(['nama_jabatan_fungsional', 'nama jabatan fungsional', 'nama_jabatan', 'nama jabatan']);
    const hJenjang = h(['jenjang', 'jenjang_jabatan', 'jenjang jabatan']);

    if (!hNamaJabatan) {
      throw new BadRequestException(
        'Kolom nama jabatan tidak ditemukan. Gunakan header "Nama Jabatan Fungsional".',
      );
    }

    if (!hJenjang) {
      throw new BadRequestException(
        'Kolom jenjang tidak ditemukan. Gunakan header "Jenjang".',
      );
    }

    return rawRows.map((row, index) => {
      const namaJabatan = this.toNullableString(row[hNamaJabatan]);
      const jenjang = this.toNullableString(row[hJenjang]);
      const namaLengkap = namaJabatan && jenjang
        ? this.buildJfNamaLengkap(namaJabatan, jenjang)
        : namaJabatan;

      return {
        rowNumber: index + 2,
        namaJabatan,
        jenjang,
        namaLengkap,
        rawData: {
          ...this.cleanRawData(row),
          _namaJabatan: namaJabatan,
          _jenjang: jenjang,
          _namaLengkap: namaLengkap,
        },
      };
    });
  }

  private validateJfProfileRows(rows: ParsedJfProfileRow[]): ValidatedJfProfileRow[] {
    const seen = new Set<string>();

    return rows.map((row) => {
      const validationErrors: string[] = [];
      const namaJabatan = row.namaJabatan?.trim() ?? null;
      const jenjang = row.jenjang?.trim() ?? null;
      const namaLengkap = row.namaLengkap?.trim() ?? null;

      if (!namaJabatan) validationErrors.push('Nama jabatan fungsional wajib diisi');
      if (!jenjang) validationErrors.push('Jenjang wajib diisi');

      const uniqueKey = `${this.normalizeText(namaJabatan ?? '')}|${this.normalizeText(jenjang ?? '')}`;
      const isDuplicate = seen.has(uniqueKey);

      if (isDuplicate) {
        validationErrors.push('Duplikat nama jabatan + jenjang dalam file import');
      } else if (namaJabatan && jenjang) {
        seen.add(uniqueKey);
      }

      let validationStatus: SidataValidationStatus = SIDATA_VALIDATION_STATUS.VALID;
      if (validationErrors.some((m) => m.includes('wajib'))) {
        validationStatus = SIDATA_VALIDATION_STATUS.INVALID;
      } else if (validationErrors.length > 0) {
        validationStatus = SIDATA_VALIDATION_STATUS.WARNING;
      }

      return {
        ...row,
        namaJabatan,
        jenjang,
        namaLengkap,
        sourceName: namaLengkap ?? namaJabatan ?? '',
        sourceDescription: jenjang,
        validationStatus,
        validationErrors,
        isDuplicate,
      };
    });
  }

  private buildJfNamaLengkap(namaJabatan: string, jenjang: string): string {
    const normalizedName = this.normalizeText(namaJabatan);
    const normalizedJenjang = this.normalizeText(jenjang);
    return normalizedName.endsWith(normalizedJenjang)
      ? namaJabatan
      : `${namaJabatan} ${jenjang}`;
  }

  private normalizeJenisJabatan(value: string | undefined): SidataJenisJabatan {
    const normalized = value?.trim().toUpperCase();

    if (
      normalized === SIDATA_JENIS_JABATAN.STRUKTURAL ||
      normalized === SIDATA_JENIS_JABATAN.FUNGSIONAL ||
      normalized === SIDATA_JENIS_JABATAN.PELAKSANA
    ) {
      return normalized;
    }

    throw new BadRequestException(
      'jenisJabatan wajib salah satu: STRUKTURAL, FUNGSIONAL, PELAKSANA',
    );
  }

  private static readonly MAX_IMPORT_ROWS = 50_000;

  private computeFileChecksum(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  // Magic bytes: XLSX = PK\x03\x04 (ZIP); XLS = \xD0\xCF\x11\xE0 (OLE2)
  private validateExcelFile(file: SidataBufferedFile | undefined): SidataBufferedFile {
    if (!file) {
      throw new BadRequestException('File Excel wajib diunggah');
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('File Excel kosong');
    }

    const allowedExtensions = ['.xlsx', '.xls'];
    const lowerName = file.originalname.toLowerCase();
    const validExtension = allowedExtensions.some((ext) => lowerName.endsWith(ext));

    if (!validExtension) {
      throw new BadRequestException('File harus berformat .xlsx atau .xls');
    }

    const buf = file.buffer;
    const isXlsx = buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04;
    const isXls = buf[0] === 0xd0 && buf[1] === 0xcf && buf[2] === 0x11 && buf[3] === 0xe0;

    if (!isXlsx && !isXls) {
      throw new BadRequestException(
        'Konten file tidak sesuai format Excel. Pastikan file yang diunggah adalah .xlsx atau .xls asli.',
      );
    }

    return file;
  }

  private assertRowLimit(rowCount: number): void {
    if (rowCount > SidataImportService.MAX_IMPORT_ROWS) {
      throw new BadRequestException(
        `File melebihi batas maksimal ${SidataImportService.MAX_IMPORT_ROWS.toLocaleString()} baris. Pecah file menjadi beberapa bagian.`,
      );
    }
  }

  private parseReferenceJabatanExcel(file: SidataBufferedFile): ParsedReferenceJabatanRow[] {
    let workbook: XLSX.WorkBook;

    try {
      workbook = XLSX.read(file.buffer, { type: 'buffer', cellDates: false });
    } catch {
      throw new BadRequestException('File Excel tidak dapat dibaca');
    }

    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      throw new BadRequestException('File Excel tidak memiliki worksheet');
    }

    const sheet = workbook.Sheets[firstSheetName];

    if (!sheet) {
      throw new BadRequestException('Worksheet pertama tidak ditemukan');
    }

    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: null,
      raw: false,
    });

    if (rawRows.length === 0) {
      throw new BadRequestException('Worksheet tidak memiliki data');
    }

    const headers = Object.keys(rawRows[0] ?? {});

    const sourceNameHeader = this.findHeader(headers, [
      'nama',
      'nama_jabatan',
      'jabatan',
      'nama jabatan',
      'nama_unor',
      'nama unor',
      'name',
    ]);

    if (!sourceNameHeader) {
      throw new BadRequestException(
        'Kolom nama tidak ditemukan. Gunakan header nama/nama_jabatan/jabatan/nama_unor.',
      );
    }

    const sourceCodeHeader = this.findHeader(headers, [
      'kode',
      'id',
      'kd_unor',
      'kode_unor',
      'id_unor',
      'kd unor',
      'kode unor',
      'id unor',
      'unor_id',
      'unor id',
      'kode_jabatan',
      'id_jabatan',
      'siasn_id',
      'siasn kode',
      'kode jabatan',
    ]);

    const descriptionHeader = this.findHeader(headers, [
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
      'deskripsi',
      'keterangan',
      'uraian',
      'nama_unor',
      'nama unor',
      'unor',
    ]);

    const jenjangHeader = this.findHeader(headers, [
      'jenjang',
      'jenjang_jabatan',
      'jenjang jabatan',
      'eselon_id',
      'eselon id',
      'eselon',
    ]);

    const bupHeader = this.findHeader(headers, ['bup', 'batas_usia_pensiun', 'batas usia pensiun']);

    return rawRows.map((row, index) => ({
      rowNumber: index + 2,
      sourceCode: sourceCodeHeader ? this.toNullableString(row[sourceCodeHeader]) : null,
      sourceName: this.toNullableString(row[sourceNameHeader]),
      sourceDescription: descriptionHeader
        ? this.toNullableString(row[descriptionHeader])
        : null,
      jenjang: jenjangHeader ? this.toNullableString(row[jenjangHeader]) : null,
      bup: bupHeader ? this.toNullableString(row[bupHeader]) : null,
      rawData: this.cleanRawData(row),
    }));
  }

  private validateReferenceRows(
    rows: ParsedReferenceJabatanRow[],
  ): ValidatedReferenceJabatanRow[] {
    const seen = new Set<string>();

    return rows.map((row) => {
      const validationErrors: string[] = [];
      const sourceName = row.sourceName?.trim() ?? null;
      const sourceCode = row.sourceCode?.trim() ?? null;

      if (!sourceName) {
        validationErrors.push('Nama jabatan wajib diisi');
      }

      const uniqueKey = sourceCode
        ? `code:${sourceCode.toLowerCase()}`
        : `name:${this.normalizeText(sourceName ?? '')}`;

      const isDuplicate = seen.has(uniqueKey);

      if (isDuplicate) {
        validationErrors.push('Duplikat dalam file import');
      } else {
        seen.add(uniqueKey);
      }

      let validationStatus: ValidatedReferenceJabatanRow['validationStatus'] =
        SIDATA_VALIDATION_STATUS.VALID;

      if (validationErrors.some((msg) => msg.includes('wajib'))) {
        validationStatus = SIDATA_VALIDATION_STATUS.INVALID;
      } else if (validationErrors.length > 0 || !sourceCode) {
        validationStatus = SIDATA_VALIDATION_STATUS.WARNING;
      }

      return { ...row, sourceCode, sourceName, validationErrors, validationStatus, isDuplicate };
    });
  }

  private findHeader(headers: string[], candidates: string[]): string | null {
    const normalizedHeaderMap = new Map(
      headers.map((h) => [this.normalizeHeader(h), h]),
    );
    for (const candidate of candidates) {
      const match = normalizedHeaderMap.get(this.normalizeHeader(candidate));
      if (match !== undefined) return match;
    }
    return null;
  }

  private normalizeHeader(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, '_');
  }

  private normalizeText(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private toNullableString(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    const normalized = String(value).trim();
    return normalized ? normalized : null;
  }

  private cleanRawData(row: Record<string, unknown>): Record<string, unknown> {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      cleaned[key] = value === undefined ? null : value;
    }
    return cleaned;
  }

  private toImportType(jenisJabatan: SidataJenisJabatan) {
    if (jenisJabatan === SIDATA_JENIS_JABATAN.STRUKTURAL) {
      return SIDATA_IMPORT_TYPE.SIASN_REFERENCE_JABATAN_STRUKTURAL;
    }
    if (jenisJabatan === SIDATA_JENIS_JABATAN.FUNGSIONAL) {
      return SIDATA_IMPORT_TYPE.SIASN_REFERENCE_JABATAN_FUNGSIONAL;
    }
    return SIDATA_IMPORT_TYPE.SIASN_REFERENCE_JABATAN_PELAKSANA;
  }

  private toReferenceType(jenisJabatan: SidataJenisJabatan): SidataReferenceType {
    if (jenisJabatan === SIDATA_JENIS_JABATAN.STRUKTURAL) {
      return SIDATA_REFERENCE_TYPE.JABATAN_STRUKTURAL;
    }
    if (jenisJabatan === SIDATA_JENIS_JABATAN.FUNGSIONAL) {
      return SIDATA_REFERENCE_TYPE.JABATAN_FUNGSIONAL;
    }
    return SIDATA_REFERENCE_TYPE.JABATAN_PELAKSANA;
  }

  private toJenisJabatanFromImportType(importType: string): SidataJenisJabatan {
    if (importType === SIDATA_IMPORT_TYPE.SIASN_REFERENCE_JABATAN_STRUKTURAL) {
      return SIDATA_JENIS_JABATAN.STRUKTURAL;
    }
    if (importType === SIDATA_IMPORT_TYPE.SIASN_REFERENCE_JABATAN_FUNGSIONAL) {
      return SIDATA_JENIS_JABATAN.FUNGSIONAL;
    }
    if (importType === SIDATA_IMPORT_TYPE.SIASN_REFERENCE_JABATAN_PELAKSANA) {
      return SIDATA_JENIS_JABATAN.PELAKSANA;
    }

    throw new BadRequestException('Batch import bukan batch referensi jabatan SIASN');
  }

  async cancelReferenceBatch(batchId: string): Promise<{ cancelled: boolean }> {
    const batch = await this.sidataImportRepository.findBatchById(batchId.trim());

    if (!batch) throw new NotFoundException('Batch import tidak ditemukan');

    if (batch.status === SIDATA_IMPORT_STATUS.COMMITTED) {
      throw new BadRequestException('Batch yang sudah di-commit tidak dapat dibatalkan');
    }

    if (batch.status === SIDATA_IMPORT_STATUS.PROCESSING) {
      throw new BadRequestException('Batch sedang diproses dan tidak dapat dibatalkan saat ini');
    }

    const result = await this.sidataImportRepository.cancelReferenceBatch(batch.id);

    if (result.cancelled) {
      await this.sidataImportRepository.createImportAuditLog({
        action: SIDATA_IMPORT_AUDIT_ACTION.CANCEL_BATCH,
        batchId: batch.id,
        batchType: 'REFERENCE',
        metadata: { previousStatus: batch.status },
      });
      this.logger.log(`cancelReferenceBatch batchId=${batch.id} previousStatus=${batch.status}`);
    }

    return result;
  }

  async cancelAsnBatch(batchId: string): Promise<{ cancelled: boolean }> {
    const batch = await this.sidataImportRepository.findAsnImportBatchById(batchId.trim());

    if (!batch) throw new NotFoundException('Batch import ASN tidak ditemukan');

    if (batch.status === SIDATA_IMPORT_STATUS.COMMITTED) {
      throw new BadRequestException('Batch ASN yang sudah di-commit tidak dapat dibatalkan');
    }

    if (batch.status === SIDATA_IMPORT_STATUS.PROCESSING) {
      throw new BadRequestException('Batch ASN sedang diproses dan tidak dapat dibatalkan saat ini');
    }

    const result = await this.sidataImportRepository.cancelAsnBatch(batch.id);

    if (result.cancelled) {
      await this.sidataImportRepository.createImportAuditLog({
        action: SIDATA_IMPORT_AUDIT_ACTION.CANCEL_BATCH,
        batchId: batch.id,
        batchType: 'ASN',
        metadata: { previousStatus: batch.status },
      });
      this.logger.log(`cancelAsnBatch batchId=${batch.id} previousStatus=${batch.status}`);
    }

    return result;
  }

  // ─── Phase 4: Generic Reference ─────────────────────────────────────────────

  async uploadGenericReference(params: {
    file?: SidataBufferedFile;
    referenceType?: string;
    importedById?: string | null;
  }): Promise<ReferenceJabatanUploadResult> {
    const config = this.resolveGenericReferenceConfig(params.referenceType);
    const file = this.validateExcelFile(params.file);
    const fileChecksum = this.computeFileChecksum(file.buffer);

    const existingGeneric = await this.sidataImportRepository.findReferenceBatchByChecksum(fileChecksum);
    if (existingGeneric) {
      this.logger.warn(`uploadGenericReference duplicate file checksum=${fileChecksum} existingBatch=${existingGeneric.id}`);
      throw new BadRequestException(
        `File ini sudah pernah diupload (batch ${existingGeneric.id}). Gunakan batch yang sudah ada atau upload file berbeda.`,
      );
    }

    const parsedRows = this.parseReferenceJabatanExcel(file);
    this.assertRowLimit(parsedRows.length);
    const validatedRows = this.validateReferenceRows(parsedRows);

    const totalRows = validatedRows.length;
    const invalidRows = validatedRows.filter(
      (row) => row.validationStatus === SIDATA_VALIDATION_STATUS.INVALID,
    ).length;
    const warningRows = validatedRows.filter(
      (row) => row.validationStatus === SIDATA_VALIDATION_STATUS.WARNING,
    ).length;
    const duplicateRows = validatedRows.filter((row) => row.isDuplicate).length;
    const validRows = totalRows - invalidRows;

    const batch = await this.sidataImportRepository.createGenericReferenceBatch({
      source: SIDATA_IMPORT_SOURCE.SIASN,
      importType: config.importType,
      fileName: file.originalname,
      fileChecksum,
      totalRows,
      validRows,
      invalidRows,
      duplicateRows,
      warningRows,
      importedById: params.importedById ?? null,
    });

    await this.sidataImportRepository.createGenericReferenceStagingRows({
      batchId: batch.id,
      referenceType: config.referenceType,
      targetTable: config.targetTable,
      rows: validatedRows,
    });

    const result = {
      batchId: batch.id,
      importType: config.importType as import('./sidata-import.types').SidataImportType,
      status: batch.status,
      totalRows,
      validRows,
      invalidRows,
      duplicateRows,
      warningRows,
    };

    await this.sidataImportRepository.createImportAuditLog({
      action: SIDATA_IMPORT_AUDIT_ACTION.UPLOAD_REFERENCE,
      batchId: batch.id,
      batchType: 'REFERENCE',
      metadata: {
        ...result,
        referenceType: config.referenceType,
        targetTable: config.targetTable,
      },
    });

    return result;
  }

  async commitGenericReferenceBatch(batchId: string): Promise<CommitGenericReferenceResult> {
    const normalizedBatchId = batchId.trim();
    const batch = await this.sidataImportRepository.findBatchById(normalizedBatchId);

    if (!batch) throw new NotFoundException('Batch import tidak ditemukan');

    if (batch.status === SIDATA_IMPORT_STATUS.COMMITTED) {
      throw new BadRequestException('Batch import sudah pernah di-commit');
    }
    if (batch.status === SIDATA_IMPORT_STATUS.FAILED) {
      throw new BadRequestException('Batch import gagal dan tidak dapat di-commit');
    }
    if (batch.status === SIDATA_IMPORT_STATUS.CANCELLED) {
      throw new BadRequestException('Batch import dibatalkan dan tidak dapat di-commit');
    }

    const config = this.resolveGenericReferenceConfigByImportType(batch.importType);

    let result: CommitGenericReferenceResult;
    try {
      result = await this.sidataImportRepository.commitGenericReferenceBatch({
        batchId: batch.id,
        targetTable: config.targetTable,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`commitGenericReferenceBatch failed batchId=${batch.id}: ${message}`);
      if (message !== 'BATCH_ALREADY_PROCESSING_OR_COMMITTED') {
        await this.sidataImportRepository.markBatchFailed({ batchId: batch.id, errorMessage: message }).catch(() => undefined);
        await this.sidataImportRepository.createImportAuditLog({
          action: SIDATA_IMPORT_AUDIT_ACTION.COMMIT_REFERENCE,
          batchId: batch.id,
          batchType: 'REFERENCE',
          metadata: { error: message, status: 'FAILED' },
        }).catch(() => undefined);
      }
      throw err;
    }

    await this.sidataImportRepository.createImportAuditLog({
      action: SIDATA_IMPORT_AUDIT_ACTION.COMMIT_REFERENCE,
      batchId: batch.id,
      batchType: 'REFERENCE',
      metadata: result,
    });

    this.logger.log(`commitGenericReferenceBatch success batchId=${batch.id} target=${config.targetTable} committed=${result.committedRows}`);
    return result;
  }

  private resolveGenericReferenceConfig(value: string | undefined): GenericReferenceConfig {
    const normalized = value?.trim().toUpperCase() as SidataGenericReferenceType | undefined;

    const map: Record<SidataGenericReferenceType, GenericReferenceConfig> = {
      UNIT_ORGANISASI: {
        referenceType: SIDATA_GENERIC_REFERENCE_TYPE.UNIT_ORGANISASI,
        importType: SIDATA_GENERIC_IMPORT_TYPE.SIASN_REFERENCE_UNIT_ORGANISASI,
        targetTable: SIDATA_REFERENCE_MASTER_TARGET.REF_UNIT_ORGANISASI,
        label: 'Unit Organisasi',
      },
      GOLONGAN: {
        referenceType: SIDATA_GENERIC_REFERENCE_TYPE.GOLONGAN,
        importType: SIDATA_GENERIC_IMPORT_TYPE.SIASN_REFERENCE_GOLONGAN,
        targetTable: SIDATA_REFERENCE_MASTER_TARGET.REF_GOLONGAN,
        label: 'Golongan',
      },
      PANGKAT: {
        referenceType: SIDATA_GENERIC_REFERENCE_TYPE.PANGKAT,
        importType: SIDATA_GENERIC_IMPORT_TYPE.SIASN_REFERENCE_PANGKAT,
        targetTable: SIDATA_REFERENCE_MASTER_TARGET.REF_PANGKAT,
        label: 'Pangkat',
      },
      PENDIDIKAN: {
        referenceType: SIDATA_GENERIC_REFERENCE_TYPE.PENDIDIKAN,
        importType: SIDATA_GENERIC_IMPORT_TYPE.SIASN_REFERENCE_PENDIDIKAN,
        targetTable: SIDATA_REFERENCE_MASTER_TARGET.REF_PENDIDIKAN,
        label: 'Pendidikan',
      },
      AGAMA: {
        referenceType: SIDATA_GENERIC_REFERENCE_TYPE.AGAMA,
        importType: SIDATA_GENERIC_IMPORT_TYPE.SIASN_REFERENCE_AGAMA,
        targetTable: SIDATA_REFERENCE_MASTER_TARGET.REF_AGAMA,
        label: 'Agama',
      },
      JENIS_KELAMIN: {
        referenceType: SIDATA_GENERIC_REFERENCE_TYPE.JENIS_KELAMIN,
        importType: SIDATA_GENERIC_IMPORT_TYPE.SIASN_REFERENCE_JENIS_KELAMIN,
        targetTable: SIDATA_REFERENCE_MASTER_TARGET.REF_JENIS_KELAMIN,
        label: 'Jenis Kelamin',
      },
      STATUS_KAWIN: {
        referenceType: SIDATA_GENERIC_REFERENCE_TYPE.STATUS_KAWIN,
        importType: SIDATA_GENERIC_IMPORT_TYPE.SIASN_REFERENCE_STATUS_KAWIN,
        targetTable: SIDATA_REFERENCE_MASTER_TARGET.REF_STATUS_KAWIN,
        label: 'Status Kawin',
      },
      KEDUDUKAN_HUKUM: {
        referenceType: SIDATA_GENERIC_REFERENCE_TYPE.KEDUDUKAN_HUKUM,
        importType: SIDATA_GENERIC_IMPORT_TYPE.SIASN_REFERENCE_KEDUDUKAN_HUKUM,
        targetTable: SIDATA_REFERENCE_MASTER_TARGET.REF_KEDUDUKAN_HUKUM,
        label: 'Kedudukan Hukum',
      },
      JENIS_ASN: {
        referenceType: SIDATA_GENERIC_REFERENCE_TYPE.JENIS_ASN,
        importType: SIDATA_GENERIC_IMPORT_TYPE.SIASN_REFERENCE_JENIS_ASN,
        targetTable: SIDATA_REFERENCE_MASTER_TARGET.REF_JENIS_ASN,
        label: 'Jenis ASN',
      },
    };

    if (normalized && map[normalized]) return map[normalized]!;

    throw new BadRequestException(
      'referenceType wajib salah satu: UNIT_ORGANISASI, GOLONGAN, PANGKAT, PENDIDIKAN, AGAMA, JENIS_KELAMIN, STATUS_KAWIN, KEDUDUKAN_HUKUM, JENIS_ASN',
    );
  }

  private resolveGenericReferenceConfigByImportType(importType: string): GenericReferenceConfig {
    const all = Object.values(SIDATA_GENERIC_REFERENCE_TYPE) as SidataGenericReferenceType[];

    for (const refType of all) {
      const config = this.resolveGenericReferenceConfig(refType);
      if (config.importType === importType) return config;
    }

    throw new BadRequestException('Batch import bukan batch referensi generic SIASN');
  }

  // ─── Phase 5: ASN Import ─────────────────────────────────────────────────────

  async findAsnImportBatches(): Promise<SiasnAsnBatchResponse[]> {
    const batches = await this.sidataImportRepository.findAsnImportBatches();
    return batches.map((b) => this.toAsnBatchResponse(b));
  }

  async findAsnImportBatchById(id: string): Promise<SiasnAsnBatchResponse> {
    const batch = await this.sidataImportRepository.findAsnImportBatchById(id.trim());

    if (!batch) {
      throw new NotFoundException('Batch import ASN tidak ditemukan');
    }

    return this.toAsnBatchResponse(batch);
  }

  async findAsnStagingByBatchId(batchId: string, pagination?: { page: number; limit: number }) {
    const batch = await this.sidataImportRepository.findAsnImportBatchById(batchId.trim());

    if (!batch) {
      throw new NotFoundException('Batch import ASN tidak ditemukan');
    }

    const { items, total } = await this.sidataImportRepository.findAsnStagingByBatchId(batch.id, pagination);
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 50;

    return {
      items: items.map((row): SiasnAsnStagingResponse => ({
        id: row.id,
        batchId: row.batchId,
        rowNumber: row.rowNumber,
        nip: row.nip,
        nama: row.nama,
        namaJabatan: row.namaJabatan,
        namaGolongan: row.namaGolongan,
        namaUnorEselon1: row.namaUnorEselon1,
        validationStatus: row.validationStatus,
        validationErrors: row.validationErrors,
        mappingStatus: row.mappingStatus,
        matchedAsnId: row.matchedAsnId,
        rawData: row.rawData,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
      page,
      limit,
      total,
    };
  }

  async uploadSiasnAsn(params: {
    file?: SidataBufferedFile;
    tipePegawai?: string;
    importedById?: string | null;
  }): Promise<SiasnAsnUploadResult> {
    const file = this.validateExcelFile(params.file);
    const tipePegawai = this.normalizeTipePegawai(params.tipePegawai);
    const importType = this.toAsnImportType(tipePegawai);
    const fileChecksum = this.computeFileChecksum(file.buffer);

    const existingAsn = await this.sidataImportRepository.findAsnImportBatchByChecksum(fileChecksum);
    if (existingAsn) {
      this.logger.warn(`uploadSiasnAsn duplicate file checksum=${fileChecksum} existingBatch=${existingAsn.id}`);
      throw new BadRequestException(
        `File ini sudah pernah diupload (batch ${existingAsn.id}). Gunakan batch yang sudah ada atau upload file berbeda.`,
      );
    }

    const parsedRows = this.parseSiasnAsnExcel(file);
    this.assertRowLimit(parsedRows.length);
    const validatedRows = this.validateSiasnAsnRows(parsedRows);

    const totalRows = validatedRows.length;
    const invalidRows = validatedRows.filter(
      (r) => r.validationStatus === SIDATA_VALIDATION_STATUS.INVALID,
    ).length;
    const warningRows = validatedRows.filter(
      (r) => r.validationStatus === SIDATA_VALIDATION_STATUS.WARNING,
    ).length;
    const duplicateRows = validatedRows.filter((r) => r.isDuplicate).length;
    const validRows = totalRows - invalidRows;

    const batch = await this.sidataImportRepository.createAsnImportBatch({
      source: SIDATA_IMPORT_SOURCE.SIASN,
      importType,
      fileName: file.originalname,
      fileChecksum,
      totalRows,
      validRows,
      invalidRows,
      duplicateRows,
      warningRows,
      importedById: params.importedById ?? null,
    });

    await this.sidataImportRepository.createAsnStagingRows({
      batchId: batch.id,
      rows: validatedRows,
    });

    const result = {
      batchId: batch.id,
      importType,
      status: batch.status,
      totalRows,
      validRows,
      invalidRows,
      duplicateRows,
      warningRows,
    };

    await this.sidataImportRepository.createImportAuditLog({
      action: SIDATA_IMPORT_AUDIT_ACTION.UPLOAD_ASN,
      batchId: batch.id,
      batchType: 'ASN',
      metadata: { ...result, tipePegawai },
    });

    return result;
  }

  private normalizeTipePegawai(value: string | undefined): SidataAsnTipePegawai {
    const normalized = value?.trim().toUpperCase().replace(/\s+/g, '_');
    if (normalized === SIDATA_ASN_TIPE_PEGAWAI.PNS) return SIDATA_ASN_TIPE_PEGAWAI.PNS;
    if (normalized === SIDATA_ASN_TIPE_PEGAWAI.PPPK) return SIDATA_ASN_TIPE_PEGAWAI.PPPK;
    if (
      normalized === SIDATA_ASN_TIPE_PEGAWAI.PPPK_PARUH_WAKTU ||
      normalized === 'PPPK PARUH WAKTU'
    ) {
      return SIDATA_ASN_TIPE_PEGAWAI.PPPK_PARUH_WAKTU;
    }
    throw new BadRequestException(
      'tipePegawai wajib salah satu: PNS, PPPK, PPPK_PARUH_WAKTU',
    );
  }

  private toAsnImportType(tipePegawai: SidataAsnTipePegawai): string {
    if (tipePegawai === SIDATA_ASN_TIPE_PEGAWAI.PNS) return SIDATA_ASN_IMPORT_TYPE.SIASN_ASN_PNS;
    if (tipePegawai === SIDATA_ASN_TIPE_PEGAWAI.PPPK) return SIDATA_ASN_IMPORT_TYPE.SIASN_ASN_PPPK;
    return SIDATA_ASN_IMPORT_TYPE.SIASN_ASN_PPPK_PARUH_WAKTU;
  }

  static tipePegawaiFromImportType(importType: string): string | null {
    if (importType === SIDATA_ASN_IMPORT_TYPE.SIASN_ASN_PNS) return SIDATA_ASN_TIPE_PEGAWAI.PNS;
    if (importType === SIDATA_ASN_IMPORT_TYPE.SIASN_ASN_PPPK) return SIDATA_ASN_TIPE_PEGAWAI.PPPK;
    if (importType === SIDATA_ASN_IMPORT_TYPE.SIASN_ASN_PPPK_PARUH_WAKTU) return SIDATA_ASN_TIPE_PEGAWAI.PPPK_PARUH_WAKTU;
    return null;
  }

  private parseSiasnAsnExcel(file: SidataBufferedFile): ParsedSiasnAsnRow[] {
    let workbook: XLSX.WorkBook;

    try {
      workbook = XLSX.read(file.buffer, { type: 'buffer', cellDates: true });
    } catch {
      throw new BadRequestException('File Excel tidak dapat dibaca');
    }

    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      throw new BadRequestException('File Excel tidak memiliki worksheet');
    }

    const sheet = workbook.Sheets[firstSheetName];

    if (!sheet) {
      throw new BadRequestException('Worksheet pertama tidak ditemukan');
    }

    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: null,
      raw: false,
    });

    if (rawRows.length === 0) {
      throw new BadRequestException('Worksheet tidak memiliki data');
    }

    const headers = Object.keys(rawRows[0] ?? {});

    const h = (candidates: string[]) => this.findHeader(headers, candidates);

    const hNip = h(['nip', 'nip_baru', 'nip baru']);
    const hNipLama = h(['nip_lama', 'nip lama', 'niplama']);
    const hNama = h(['nama', 'nama_lengkap', 'nama lengkap']);
    const hNamaJabatan = h(['nama_jabatan', 'jabatan', 'nama jabatan', 'jabatan nama', 'jabatan aktif', 'nama jabatan aktif']);
    const hJenisJabatan = h(['jenis_jabatan', 'jenis jabatan', 'jenis_jabatan_nama', 'jenis jabatan nama']);
    const hKdJabatan = h(['kd_jabatan', 'kode_jabatan', 'kd jabatan', 'kode jabatan']);
    const hKdJabatanSiasn = h([
      'jabatan_id',
      'jabatan id',
      'id_jabatan',
      'id jabatan',
      'kd_jabatan_siasn',
      'kd jabatan siasn',
    ]);
    const hTmtJabatan = h(['tmt_jabatan', 'tmt jabatan']);
    const hNamaGolongan = h([
      'nama_golongan', 'golongan', 'nama golongan',
      'gol awal nama', 'golongan awal nama', 'gol_awal_nama', 'golongan_awal_nama',
      'gol akhir nama', 'golongan akhir nama',
    ]);
    const hNamaRuang = h(['nama_ruang', 'ruang', 'nama ruang', 'pangkat', 'nama pangkat']);
    const hKdGolongan = h([
      'kd_golongan', 'kode_golongan', 'kd golongan', 'kode golongan',
      'gol awal id', 'golongan awal id', 'gol_awal_id', 'golongan_awal_id', 'gol id', 'kd gol',
    ]);
    const hKdGolonganSiasn = h(['kd_golongan_siasn', 'id_golongan', 'kd golongan siasn']);
    const hTmtGolongan = h(['tmt_golongan', 'tmt golongan']);
    const hMasaKerjaGol = h(['masa_kerja_golongan', 'masa kerja golongan', 'mk_golongan']);
    const hMasaKerjaSeluruh = h(['masa_kerja_seluruh', 'masa kerja seluruh', 'total_masa_kerja']);
    const hEselon1 = h(['nama_unor_eselon1', 'unor_eselon1', 'eselon_i', 'eselon i', 'unor 1', 'eselon 1', 'eselon1', 'unor eselon 1', 'unor eselon1', 'satuan kerja']);
    const hEselon2 = h(['nama_unor_eselon2', 'unor_eselon2', 'eselon_ii', 'eselon ii', 'unor 2', 'eselon 2', 'eselon2', 'unor eselon 2']);
    const hEselon3 = h(['nama_unor_eselon3', 'unor_eselon3', 'eselon_iii', 'eselon iii', 'unor 3', 'eselon 3', 'eselon3', 'unor eselon 3']);
    const hEselon4 = h(['nama_unor_eselon4', 'unor_eselon4', 'eselon_iv', 'eselon iv', 'unor 4', 'eselon 4', 'eselon4', 'unor eselon 4']);
    const hKdUnor = h(['kd_unor', 'kode_unor', 'kd unor', 'kode unor', 'id_unor', 'id unor', 'unor id']);
    const hTempatLahir = h([
      'tempat_lahir_nama',
      'tempat lahir nama',
      'tempat_lahir',
      'tempat lahir',
    ]);
    const hTanggalLahir = h(['tanggal_lahir', 'tgl_lahir', 'tgl lahir', 'tanggal lahir']);
    const hJenisKelamin = h(['jenis_kelamin', 'jenis kelamin', 'kelamin']);
    const hAgama = h(['agama_nama', 'agama nama', 'agama']);
    const hStatusKawin = h(['status_kawin', 'status kawin', 'kawin', 'jenis kawin', 'jenis_kawin', 'jenis kawin nama', 'kawin nama']);
    const hPendidikan = h(['pendidikan_terakhir', 'pendidikan', 'pendidikan terakhir', 'pendidikan_nama', 'pendidikan nama', 'tingkat pendidikan']);
    const hNamaSekolah = h(['nama_sekolah', 'sekolah', 'nama sekolah', 'institusi', 'nama_institusi']);
    const hTmtPns = h(['tmt_pns', 'tmt_cpns', 'tmt pns', 'tmt cpns', 'tmt_kerja', 'tmt kerja']);
    const hTmtPensiun = h(['tmt_pensiun', 'tmt pensiun', 'bup', 'tanggal_pensiun', 'tgl pensiun', 'tanggal bup', 'batas usia pensiun']);
    const hStatusKepeg = h([
      'kedudukan_hukum_nama',
      'kedudukan hukum nama',
      'status_kepegawaian',
      'status kepegawaian',
      'status',
      'status pegawai',
      'status_pegawai',
    ]);
    const hJenisAsn = h([
      'jenis_asn', 'jenis asn',
      'jenis_pegawai', 'jenis pegawai', 'jenis pegawai nama', 'jenis_pegawai_nama',
      'jenis asn nama', 'jenis_asn_nama',
    ]);
    const hKedudukanHukum = h([
      'kedudukan_hukum_nama',
      'kedudukan hukum nama',
      'kedudukan_hukum',
      'kedudukan hukum',
    ]);
    const hNoSk = h(['no_sk', 'nomor_sk', 'no sk', 'nomor sk']);
    const hTanggalSk = h(['tanggal_sk', 'tgl_sk', 'tanggal sk', 'tgl sk']);

    if (!hNip) {
      throw new BadRequestException(
        'Kolom NIP tidak ditemukan. Gunakan header nip/nip_baru/nip baru.',
      );
    }

    if (!hNama) {
      throw new BadRequestException(
        'Kolom Nama tidak ditemukan. Gunakan header nama/nama_lengkap.',
      );
    }

    const nullHeaders = {
      namaJabatan: hNamaJabatan, namaGolongan: hNamaGolongan,
      jenisAsn: hJenisAsn, statusKepeg: hStatusKepeg,
      tmtPensiun: hTmtPensiun, kdUnor: hKdUnor, eselon1: hEselon1,
    };
    const missing = Object.entries(nullHeaders).filter(([, v]) => !v).map(([k]) => k);
    if (missing.length > 0) {
      console.warn('[parseSiasnAsnExcel] Header tidak ditemukan:', missing.join(', '));
      console.warn('[parseSiasnAsnExcel] Header tersedia:', headers.join(' | '));
    }

    return rawRows.map((row, index) => ({
      rowNumber: index + 2,
      nip: this.pickString(row, hNip),
      nipLama: this.pickString(row, hNipLama),
      nama: this.pickString(row, hNama),
      namaJabatan: this.pickString(row, hNamaJabatan),
      jenisJabatan: this.pickString(row, hJenisJabatan),
      kdJabatan: this.pickString(row, hKdJabatan),
      kdJabatanSiasn: this.pickString(row, hKdJabatanSiasn),
      tmtJabatan: this.pickDate(row, hTmtJabatan),
      namaGolongan: this.pickString(row, hNamaGolongan),
      namaRuang: this.pickString(row, hNamaRuang),
      kdGolongan: this.pickString(row, hKdGolongan),
      kdGolonganSiasn: this.pickString(row, hKdGolonganSiasn),
      tmtGolongan: this.pickDate(row, hTmtGolongan),
      masaKerjaGolongan: this.pickString(row, hMasaKerjaGol),
      masaKerjaSeluruh: this.pickString(row, hMasaKerjaSeluruh),
      namaUnorEselon1: this.pickString(row, hEselon1),
      namaUnorEselon2: this.pickString(row, hEselon2),
      namaUnorEselon3: this.pickString(row, hEselon3),
      namaUnorEselon4: this.pickString(row, hEselon4),
      kdUnor: this.pickString(row, hKdUnor),
      tempatLahir: this.pickString(row, hTempatLahir),
      tanggalLahir: this.pickDate(row, hTanggalLahir),
      jenisKelamin: this.pickString(row, hJenisKelamin),
      agama: this.pickString(row, hAgama),
      statusKawin: this.pickString(row, hStatusKawin),
      pendidikanTerakhir: this.pickString(row, hPendidikan),
      namaSekolah: this.pickString(row, hNamaSekolah),
      tmtPns: this.pickDate(row, hTmtPns),
      tmtPensiun: this.pickDate(row, hTmtPensiun),
      statusKepegawaian: this.pickString(row, hStatusKepeg),
      jenisAsn: this.pickString(row, hJenisAsn),
      kedudukanHukum: this.pickString(row, hKedudukanHukum),
      noSk: this.pickString(row, hNoSk),
      tanggalSk: this.pickDate(row, hTanggalSk),
      rawData: this.cleanRawData(row),
    }));
  }

  private validateSiasnAsnRows(rows: ParsedSiasnAsnRow[]): ValidatedSiasnAsnRow[] {
    const seen = new Set<string>();
    const nipPattern = /^\d{18}$/;

    return rows.map((row) => {
      const validationErrors: string[] = [];
      // Strip leading apostrophes/quotes and non-digit prefix (Excel text-format artifact)
      const nip = row.nip?.trim().replace(/^[^0-9]+/, '') || null;
      const nama = row.nama?.trim() ?? null;

      if (!nip) {
        validationErrors.push('NIP wajib diisi');
      } else if (!nipPattern.test(nip)) {
        validationErrors.push('NIP harus 18 digit angka');
      }

      if (!nama) {
        validationErrors.push('Nama wajib diisi');
      }

      const uniqueKey = nip ?? `nama:${(nama ?? '').toLowerCase()}`;
      const isDuplicate = seen.has(uniqueKey);

      if (isDuplicate) {
        validationErrors.push('NIP duplikat dalam file import');
      } else {
        seen.add(uniqueKey);
      }

      let validationStatus: SidataValidationStatus = SIDATA_VALIDATION_STATUS.VALID;

      if (validationErrors.some((msg) => msg.includes('wajib') || msg.includes('harus'))) {
        validationStatus = SIDATA_VALIDATION_STATUS.INVALID;
      } else if (validationErrors.length > 0) {
        validationStatus = SIDATA_VALIDATION_STATUS.WARNING;
      }

      return { ...row, nip, nama, validationStatus, validationErrors, isDuplicate };
    });
  }

  private pickString(row: Record<string, unknown>, header: string | null): string | null {
    if (!header) return null;
    return this.toNullableString(row[header]);
  }

  private pickDate(row: Record<string, unknown>, header: string | null): Date | null {
    if (!header) return null;
    return this.toNullableDate(row[header]);
  }

  private toNullableDate(value: unknown): Date | null {
    if (value === null || value === undefined) return null;

    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value;
    }

    const str = String(value).trim();
    if (!str) return null;

    const parsed = new Date(str);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  async enqueueMapSiasnAsnBatch(batchId: string): Promise<SidataImportJobResponse> {
    const batch = await this.getAsnBatchForBackgroundJob(batchId, 'MAP_ASN');
    return this.enqueueAsnBackgroundJob({
      batchId: batch.id,
      action: 'MAP_ASN',
      message: 'Mapping ASN sedang diproses di background. Pantau status batch sampai selesai.',
      runner: () => this.mapSiasnAsnBatch(batch.id, { skipStatusGuard: true }),
    });
  }

  async enqueueRemapSiasnAsnBatch(batchId: string): Promise<SidataImportJobResponse> {
    const batch = await this.getAsnBatchForBackgroundJob(batchId, 'REMAP_ASN');
    return this.enqueueAsnBackgroundJob({
      batchId: batch.id,
      action: 'REMAP_ASN',
      message: 'Remap ASN sedang diproses di background. Pantau status batch sampai selesai.',
      runner: () => this.remapSiasnAsnBatch(batch.id, { skipStatusGuard: true }),
    });
  }

  async enqueueCommitSiasnAsnBatch(batchId: string): Promise<SidataImportJobResponse> {
    const batch = await this.getAsnBatchForBackgroundJob(batchId, 'COMMIT_ASN');
    return this.enqueueAsnBackgroundJob({
      batchId: batch.id,
      action: 'COMMIT_ASN',
      message: 'Commit ASN sedang diproses di background. Pantau status batch sampai selesai.',
      runner: () => this.commitSiasnAsnBatch(batch.id, { skipClaim: true }),
    });
  }

  async commitSiasnAsnBatch(
    batchId: string,
    options: { skipClaim?: boolean } = {},
  ): Promise<CommitSiasnAsnBatchResult> {
    const normalizedBatchId = batchId.trim();
    const batch = await this.sidataImportRepository.findAsnImportBatchById(normalizedBatchId);

    if (!batch) {
      throw new NotFoundException('Batch import ASN tidak ditemukan');
    }

    if (batch.status === SIDATA_IMPORT_STATUS.FAILED) {
      throw new BadRequestException('Batch ASN gagal dan tidak dapat di-commit');
    }

    if (batch.status === SIDATA_IMPORT_STATUS.CANCELLED) {
      throw new BadRequestException('Batch ASN dibatalkan dan tidak dapat di-commit');
    }

    let result: CommitSiasnAsnBatchResult;
    try {
      result = await this.sidataImportRepository.commitSiasnAsnBatch({
        batchId: batch.id,
        skipClaim: options.skipClaim,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`commitSiasnAsnBatch failed batchId=${batch.id}: ${message}`);
      if (message !== 'BATCH_ALREADY_PROCESSING_OR_COMMITTED') {
        await this.sidataImportRepository.markAsnBatchFailed({ batchId: batch.id, errorMessage: message }).catch(() => undefined);
        await this.sidataImportRepository.createImportAuditLog({
          action: SIDATA_IMPORT_AUDIT_ACTION.COMMIT_ASN,
          batchId: batch.id,
          batchType: 'ASN',
          metadata: { error: message, status: 'FAILED' },
        }).catch(() => undefined);
      }
      throw err;
    }

    await this.sidataImportRepository.createImportAuditLog({
      action: SIDATA_IMPORT_AUDIT_ACTION.COMMIT_ASN,
      batchId: batch.id,
      batchType: 'ASN',
      metadata: result,
    });

    this.logger.log(`commitSiasnAsnBatch success batchId=${batch.id} committed=${result.committedRows}`);
    return result;
  }

  async mapSiasnAsnBatch(
    batchId: string,
    options: { skipStatusGuard?: boolean } = {},
  ): Promise<MapSiasnAsnBatchResult> {
    const normalizedBatchId = batchId.trim();
    const batch = await this.sidataImportRepository.findAsnImportBatchById(normalizedBatchId);

    if (!batch) {
      throw new NotFoundException('Batch import ASN tidak ditemukan');
    }

    if (!options.skipStatusGuard && batch.status === SIDATA_IMPORT_STATUS.PROCESSING) {
      throw new BadRequestException('Batch ASN sedang diproses');
    }

    if (batch.status === SIDATA_IMPORT_STATUS.COMMITTED) {
      throw new BadRequestException('Batch ASN sudah di-commit dan tidak dapat dimapping ulang');
    }

    if (batch.status === SIDATA_IMPORT_STATUS.FAILED) {
      throw new BadRequestException('Batch ASN gagal dan tidak dapat dimapping');
    }

    if (batch.status === SIDATA_IMPORT_STATUS.CANCELLED) {
      throw new BadRequestException('Batch ASN dibatalkan dan tidak dapat dimapping');
    }

    let result: MapSiasnAsnBatchResult;
    try {
      result = await this.sidataImportRepository.mapSiasnAsnBatch({ batchId: batch.id });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`mapSiasnAsnBatch failed batchId=${batch.id}: ${message}`);
      await this.sidataImportRepository.markAsnBatchFailed({ batchId: batch.id, errorMessage: message }).catch(() => undefined);
      await this.sidataImportRepository.createImportAuditLog({
        action: SIDATA_IMPORT_AUDIT_ACTION.MAP_ASN,
        batchId: batch.id,
        batchType: 'ASN',
        metadata: { error: message, status: 'FAILED' },
      }).catch(() => undefined);
      throw err;
    }

    await this.sidataImportRepository.createImportAuditLog({
      action: SIDATA_IMPORT_AUDIT_ACTION.MAP_ASN,
      batchId: batch.id,
      batchType: 'ASN',
      metadata: result,
    });

    this.logger.log(`mapSiasnAsnBatch success batchId=${batch.id} mapped=${result.mappedRows} needsReview=${result.needsReviewRows}`);
    return result;
  }

  // ─── Phase 8: Summary, Issues, Remap ─────────────────────────────────────────

  private async getAsnBatchForBackgroundJob(
    batchId: string,
    action: SidataImportJobAction,
  ) {
    const batch = await this.sidataImportRepository.findAsnImportBatchById(batchId.trim());

    if (!batch) {
      throw new NotFoundException('Batch import ASN tidak ditemukan');
    }

    if (batch.status === SIDATA_IMPORT_STATUS.PROCESSING) {
      throw new BadRequestException('Batch ASN sedang diproses');
    }

    if (batch.status === SIDATA_IMPORT_STATUS.FAILED) {
      throw new BadRequestException('Batch ASN gagal dan tidak dapat diproses');
    }

    if (batch.status === SIDATA_IMPORT_STATUS.CANCELLED) {
      throw new BadRequestException('Batch ASN dibatalkan dan tidak dapat diproses');
    }

    if (batch.status === SIDATA_IMPORT_STATUS.COMMITTED) {
      throw new BadRequestException('Batch ASN sudah di-commit dan tidak dapat diproses ulang');
    }

    return batch;
  }

  private async enqueueAsnBackgroundJob(params: {
    batchId: string;
    action: SidataImportJobAction;
    message: string;
    runner: () => Promise<unknown>;
  }): Promise<SidataImportJobResponse> {
    const claimed = await this.sidataImportRepository.claimAsnBatchForJob(params.batchId);

    if (!claimed) {
      throw new BadRequestException('Batch ASN sedang diproses atau sudah selesai');
    }

    const jobId = randomUUID();
    this.asnJobs.set(jobId, {
      batchId: params.batchId,
      action: params.action,
      status: 'QUEUED',
      startedAt: new Date(),
    });

    setImmediate(() => {
      void this.runAsnBackgroundJob(jobId, params.runner);
    });

    return {
      jobId,
      batchId: params.batchId,
      action: params.action,
      status: 'QUEUED',
      batchStatus: SIDATA_IMPORT_STATUS.PROCESSING,
      message: params.message,
    };
  }

  private async runAsnBackgroundJob(
    jobId: string,
    runner: () => Promise<unknown>,
  ): Promise<void> {
    const job = this.asnJobs.get(jobId);
    if (!job) return;

    job.status = 'PROCESSING';
    this.asnJobs.set(jobId, job);

    try {
      await runner();
      job.status = 'COMPLETED';
      job.finishedAt = new Date();
      this.asnJobs.set(jobId, job);
      await this.publishAsnJobNotification(job, true).catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Failed publishing SIDATA job success notification jobId=${jobId}: ${message}`);
      });
      this.logger.log(`SIDATA ASN background job completed jobId=${jobId} action=${job.action} batchId=${job.batchId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      job.status = 'FAILED';
      job.error = message;
      job.finishedAt = new Date();
      this.asnJobs.set(jobId, job);
      await this.sidataImportRepository.markAsnBatchFailed({
        batchId: job.batchId,
        errorMessage: message,
      }).catch(() => undefined);
      await this.publishAsnJobNotification(job, false).catch(() => undefined);
      this.logger.error(`SIDATA ASN background job failed jobId=${jobId} action=${job.action} batchId=${job.batchId}: ${message}`);
    }
  }

  private async publishAsnJobNotification(
    job: {
      batchId: string;
      action: SidataImportJobAction;
      status: SidataImportJobStatus;
      error?: string;
    },
    success: boolean,
  ): Promise<void> {
    const actionLabel: Record<SidataImportJobAction, string> = {
      MAP_ASN: 'Mapping ASN',
      REMAP_ASN: 'Remap ASN',
      COMMIT_ASN: 'Commit ASN',
    };

    await this.eventBusService.publishNotification({
      type: success ? 'SIDATA_ASN_BATCH_COMPLETED' : 'SIDATA_ASN_BATCH_FAILED',
      title: success
        ? `${actionLabel[job.action]} selesai`
        : `${actionLabel[job.action]} gagal`,
      body: success
        ? 'Proses background SIDATA ASN selesai diproses.'
        : job.error ?? 'Proses background SIDATA ASN gagal diproses.',
      actionUrl: '/sidata/import/mapping-referensi',
      recipientRoleCodes: ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'OPERATOR_IMPORT', 'REVIEWER_MAPPING'],
      metadata: {
        batchId: job.batchId,
        action: job.action,
        status: job.status,
      },
    });
  }

  async getAsnImportBatchSummary(batchId: string): Promise<SidataImportSummaryResponse> {
    const summary = await this.sidataImportRepository.getAsnImportBatchSummary(batchId.trim());

    if (!summary) {
      throw new NotFoundException('Batch import ASN tidak ditemukan');
    }

    return summary;
  }

  async getReferenceImportBatchSummary(batchId: string): Promise<SidataImportSummaryResponse> {
    const summary = await this.sidataImportRepository.getReferenceImportBatchSummary(
      batchId.trim(),
    );

    if (!summary) {
      throw new NotFoundException('Batch import referensi tidak ditemukan');
    }

    return summary;
  }

  async reconcileAsnBatch(params: {
    batchId: string;
    query: SidataAsnReconciliationQueryDto;
  }): Promise<SidataAsnReconciliationResponse> {
    const batch = await this.sidataImportRepository.findAsnImportBatchById(
      params.batchId.trim(),
    );

    if (!batch) {
      throw new NotFoundException('Batch import ASN tidak ditemukan');
    }

    const result = await this.sidataImportRepository.reconcileAsnBatch({
      batchId: batch.id,
      query: this.normalizeReconciliationQuery(params.query),
    });

    await this.sidataImportRepository.createImportAuditLog({
      action: SIDATA_IMPORT_AUDIT_ACTION.VIEW_ISSUES,
      batchId: batch.id,
      batchType: 'ASN',
      metadata: {
        action: 'RECONCILIATION',
        query: params.query as unknown as Record<string, unknown>,
        total: result.total,
        summary: result.summary as unknown as Record<string, unknown>,
      },
    });

    return result;
  }

  async findAsnImportIssues(params: {
    batchId: string;
    query: SidataImportIssueQueryDto;
  }): Promise<PaginatedImportIssuesResponse> {
    const batch = await this.sidataImportRepository.findAsnImportBatchById(
      params.batchId.trim(),
    );

    if (!batch) {
      throw new NotFoundException('Batch import ASN tidak ditemukan');
    }

    const normalized = this.normalizeImportIssueQuery(params.query);

    const result = await this.sidataImportRepository.findAsnImportIssues({
      batchId: batch.id,
      query: normalized,
    });

    await this.sidataImportRepository.createImportAuditLog({
      action: SIDATA_IMPORT_AUDIT_ACTION.VIEW_ISSUES,
      batchId: batch.id,
      batchType: 'ASN',
      metadata: { query: params.query as unknown as Record<string, unknown>, total: result.total },
    });

    return result;
  }

  async exportAsnImportIssuesCsv(params: {
    batchId: string;
    query: SidataImportIssueQueryDto;
  }): Promise<CsvExportResult> {
    const batch = await this.sidataImportRepository.findAsnImportBatchById(
      params.batchId.trim(),
    );

    if (!batch) {
      throw new NotFoundException('Batch import ASN tidak ditemukan');
    }

    const normalized = this.normalizeImportIssueQuery(params.query);

    await this.sidataImportRepository.createImportAuditLog({
      action: SIDATA_IMPORT_AUDIT_ACTION.VIEW_ISSUES,
      batchId: batch.id,
      batchType: 'ASN',
      metadata: {
        export: true,
        query: params.query as unknown as Record<string, unknown>,
      },
    });

    return {
      stream: createCsvStream(
        this.generateAsnImportIssueCsvRows(batch.id, normalized),
      ),
      mimeType: 'text/csv; charset=utf-8',
      fileName: buildCsvFileName(`sidata-asn-issues-${batch.id.slice(0, 8)}`),
    };
  }

  private async *generateAsnImportIssueCsvRows(
    batchId: string,
    query: NormalizedSidataImportIssueQuery,
  ): AsyncGenerator<unknown[]> {
    yield [
      'Row',
      'NIP',
      'NIP Lama',
      'Nama',
      'Unit Eselon I',
      'Unit Eselon II',
      'Unit Eselon III',
      'Unit Eselon IV',
      'Kode Unor',
      'Jabatan',
      'Jenis Jabatan',
      'Kode Jabatan',
      'Kode Jabatan SIASN',
      'TMT Jabatan',
      'Golongan',
      'Ruang',
      'Kode Golongan',
      'Kode Golongan SIASN',
      'TMT Golongan',
      'Jenis ASN',
      'Status ASN',
      'Kedudukan Hukum',
      'Mapping Status',
      'Validation Status',
      'Validation Errors',
      'Matched ASN ID',
      'Created At',
      'Updated At',
    ];

    let cursorId: string | undefined;

    while (true) {
      const page =
        await this.sidataImportRepository.findAsnImportIssueExportPage({
          batchId,
          query,
          cursorId,
          take: SidataImportService.CSV_PAGE_SIZE,
        });

      if (page.length === 0) {
        break;
      }

      for (const row of page) {
        yield [
          row.rowNumber,
          row.nip,
          row.nipLama,
          row.nama,
          row.namaUnorEselon1,
          row.namaUnorEselon2,
          row.namaUnorEselon3,
          row.namaUnorEselon4,
          row.kdUnor,
          row.namaJabatan,
          row.jenisJabatan,
          row.kdJabatan,
          row.kdJabatanSiasn,
          formatCsvDate(row.tmtJabatan),
          row.namaGolongan,
          row.namaRuang,
          row.kdGolongan,
          row.kdGolonganSiasn,
          formatCsvDate(row.tmtGolongan),
          row.jenisAsn,
          row.statusKepegawaian,
          row.kedudukanHukum,
          row.mappingStatus,
          row.validationStatus,
          serializeCsvJson(row.validationErrors),
          row.matchedAsnId,
          formatCsvDateTime(row.createdAt),
          formatCsvDateTime(row.updatedAt),
        ];
      }

      cursorId = page.at(-1)?.id;
    }
  }

  async findAsnImportNeedsReview(params: {
    batchId: string;
    query: SidataImportIssueQueryDto;
  }): Promise<PaginatedImportIssuesResponse> {
    const batch = await this.sidataImportRepository.findAsnImportBatchById(
      params.batchId.trim(),
    );

    if (!batch) {
      throw new NotFoundException('Batch import ASN tidak ditemukan');
    }

    return this.sidataImportRepository.findAsnImportNeedsReview({
      batchId: batch.id,
      query: this.normalizeImportIssueQuery(params.query),
    });
  }

  async findAsnImportInvalid(params: {
    batchId: string;
    query: SidataImportIssueQueryDto;
  }): Promise<PaginatedImportIssuesResponse> {
    const batch = await this.sidataImportRepository.findAsnImportBatchById(
      params.batchId.trim(),
    );

    if (!batch) {
      throw new NotFoundException('Batch import ASN tidak ditemukan');
    }

    return this.sidataImportRepository.findAsnImportInvalid({
      batchId: batch.id,
      query: this.normalizeImportIssueQuery(params.query),
    });
  }

  async remapSiasnAsnBatch(
    batchId: string,
    options: { skipStatusGuard?: boolean } = {},
  ): Promise<RemapSiasnAsnBatchResult> {
    const normalizedBatchId = batchId.trim();
    const batch = await this.sidataImportRepository.findAsnImportBatchById(normalizedBatchId);

    if (!batch) {
      throw new NotFoundException('Batch import ASN tidak ditemukan');
    }

    if (!options.skipStatusGuard && batch.status === SIDATA_IMPORT_STATUS.PROCESSING) {
      throw new BadRequestException('Batch ASN sedang diproses');
    }

    if (batch.status === SIDATA_IMPORT_STATUS.FAILED) {
      throw new BadRequestException('Batch ASN gagal dan tidak dapat di-remap');
    }

    if (batch.status === SIDATA_IMPORT_STATUS.CANCELLED) {
      throw new BadRequestException('Batch ASN dibatalkan dan tidak dapat di-remap');
    }

    const result = await this.sidataImportRepository.mapSiasnAsnBatch({ batchId: batch.id });

    await this.sidataImportRepository.createImportAuditLog({
      action: SIDATA_IMPORT_AUDIT_ACTION.REMAP_ASN,
      batchId: batch.id,
      batchType: 'ASN',
      metadata: result,
    });

    return { ...result, remapped: true };
  }

  private normalizeImportIssueQuery(
    query: SidataImportIssueQueryDto,
  ): NormalizedSidataImportIssueQuery {
    return {
      page: this.normalizePositiveNumber(query.page, 1, 1, 10000),
      limit: this.normalizePositiveNumber(query.limit, 20, 1, 200),
      status: query.status?.trim().toUpperCase() || undefined,
      q: query.q?.trim() || undefined,
    };
  }

  private normalizeReconciliationQuery(query: SidataAsnReconciliationQueryDto): {
    page: number;
    limit: number;
    type?: SidataAsnReconciliationType;
    q?: string;
  } {
    const type = query.type?.trim().toUpperCase();

    return {
      page: this.normalizePositiveNumber(query.page, 1, 1, 10000),
      limit: this.normalizePositiveNumber(query.limit, 20, 1, 100),
      type: this.normalizeReconciliationType(type),
      q: query.q?.trim() || undefined,
    };
  }

  private normalizeReconciliationType(
    value: string | undefined,
  ): SidataAsnReconciliationType | undefined {
    if (
      value === 'ONLY_IN_BATCH' ||
      value === 'ONLY_IN_MASTER' ||
      value === 'DIFFERENT' ||
      value === 'SAME'
    ) {
      return value;
    }

    return undefined;
  }

  async extractReferencesFromAsnBatch(batchId: string): Promise<ExtractReferencesResult> {
    const batch = await this.sidataImportRepository.findAsnImportBatchById(batchId.trim());

    if (!batch) {
      throw new NotFoundException('Batch import ASN tidak ditemukan');
    }

    const result = await this.sidataImportRepository.extractReferencesFromAsnBatch(batch.id);

    await this.sidataImportRepository.createImportAuditLog({
      action: SIDATA_IMPORT_AUDIT_ACTION.EXTRACT_REFERENCES,
      batchId: batch.id,
      batchType: 'ASN',
      metadata: result as unknown as Record<string, unknown>,
    });

    return result;
  }

  async listAuditLogs(query: SidataAuditLogQueryDto): Promise<PaginatedAuditLogResponse> {
    const filters = this.normalizeAuditLogQuery(query);
    const { items, total } = await this.sidataImportRepository.listAuditLogs(filters);

    return {
      items: items.map(
        (item): AuditLogRow => ({
          id: item.id,
          batchId: item.batchId,
          batchType: item.batchType,
          action: item.action,
          actorId: item.actorId,
          metadata: item.metadata as Record<string, unknown> | null,
          createdAt: item.createdAt.toISOString(),
        }),
      ),
      page: filters.page,
      limit: filters.limit,
      total,
    };
  }

  private normalizeAuditLogQuery(query: SidataAuditLogQueryDto): NormalizedAuditLogFilters {
    const batchType = query.batchType?.trim().toUpperCase();

    if (batchType && batchType !== 'ASN' && batchType !== 'REFERENCE') {
      throw new BadRequestException('batchType harus ASN atau REFERENCE');
    }

    return {
      batchId: query.batchId?.trim() || undefined,
      batchType: batchType || undefined,
      action: query.action?.trim().toUpperCase() || undefined,
      dateFrom: this.parseDate(query.dateFrom),
      dateTo: this.parseDate(query.dateTo),
      page: this.normalizePositiveNumber(query.page, 1, 1, 10000),
      limit: this.normalizePositiveNumber(query.limit, 20, 1, 100),
    };
  }

  private parseDate(value: string | undefined): Date | undefined {
    if (!value) return undefined;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  private normalizePositiveNumber(
    value: string | undefined,
    defaultValue: number,
    min: number,
    max: number,
  ): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return defaultValue;
    return Math.min(Math.max(Math.trunc(parsed), min), max);
  }

  private toAsnBatchResponse(batch: {
    id: string;
    source: string;
    importType: string;
    fileName: string | null;
    status: string;
    totalRows: number;
    validRows: number;
    invalidRows: number;
    duplicateRows: number;
    warningRows: number;
    importedById: string | null;
    startedAt: Date | null;
    finishedAt: Date | null;
    errorMessage: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): SiasnAsnBatchResponse {
    return {
      id: batch.id,
      source: batch.source,
      importType: batch.importType,
      fileName: batch.fileName,
      status: batch.status,
      totalRows: batch.totalRows,
      validRows: batch.validRows,
      invalidRows: batch.invalidRows,
      duplicateRows: batch.duplicateRows,
      warningRows: batch.warningRows,
      importedById: batch.importedById,
      startedAt: batch.startedAt?.toISOString() ?? null,
      finishedAt: batch.finishedAt?.toISOString() ?? null,
      errorMessage: batch.errorMessage,
      createdAt: batch.createdAt.toISOString(),
      updatedAt: batch.updatedAt.toISOString(),
    };
  }
}
