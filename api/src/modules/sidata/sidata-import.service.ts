import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as XLSX from 'xlsx';
import { SidataImportRepository } from './sidata-import.repository';
import {
  CommitGenericReferenceResult,
  CommitReferenceJabatanResult,
  CommitSiasnAsnBatchResult,
  GenericReferenceConfig,
  MapSiasnAsnBatchResult,
  NormalizedSidataImportIssueQuery,
  PaginatedImportIssuesResponse,
  ParsedReferenceJabatanRow,
  ParsedSiasnAsnRow,
  ReferenceJabatanUploadResult,
  RemapSiasnAsnBatchResult,
  SIDATA_ASN_IMPORT_TYPE,
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
  SidataImportSummaryResponse,
  SidataGenericReferenceType,
  SidataJenisJabatan,
  SidataReferenceType,
  SidataValidationStatus,
  ValidatedReferenceJabatanRow,
  ValidatedSiasnAsnRow,
} from './sidata-import.types';

@Injectable()
export class SidataImportService {
  constructor(
    @Inject(SidataImportRepository)
    private readonly sidataImportRepository: SidataImportRepository,
  ) {}

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

  async findStagingByBatchId(batchId: string) {
    const batch = await this.sidataImportRepository.findBatchById(batchId.trim());

    if (!batch) {
      throw new NotFoundException('Batch import tidak ditemukan');
    }

    const rows = await this.sidataImportRepository.findStagingByBatchId(batch.id);

    return rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  async uploadReferenceJabatan(params: {
    file?: SidataBufferedFile;
    jenisJabatan?: string;
    importedById?: string | null;
  }): Promise<ReferenceJabatanUploadResult> {
    const jenisJabatan = this.normalizeJenisJabatan(params.jenisJabatan);
    const file = this.validateExcelFile(params.file);

    const parsedRows = this.parseReferenceJabatanExcel(file);
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

    const result = await this.sidataImportRepository.commitReferenceJabatanBatch({
      batchId: batch.id,
      jenisJabatanId: jenisJabatan.id,
    });

    await this.sidataImportRepository.createImportAuditLog({
      action: SIDATA_IMPORT_AUDIT_ACTION.COMMIT_REFERENCE,
      batchId: batch.id,
      batchType: 'REFERENCE',
      metadata: result,
    });

    return result;
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

    return file;
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
      'name',
    ]);

    if (!sourceNameHeader) {
      throw new BadRequestException(
        'Kolom nama jabatan tidak ditemukan. Gunakan header nama/nama_jabatan/jabatan.',
      );
    }

    const sourceCodeHeader = this.findHeader(headers, [
      'kode',
      'id',
      'kode_jabatan',
      'id_jabatan',
      'siasn_id',
      'siasn kode',
      'kode jabatan',
    ]);

    const descriptionHeader = this.findHeader(headers, [
      'deskripsi',
      'keterangan',
      'uraian',
    ]);

    return rawRows.map((row, index) => ({
      rowNumber: index + 2,
      sourceCode: sourceCodeHeader ? this.toNullableString(row[sourceCodeHeader]) : null,
      sourceName: this.toNullableString(row[sourceNameHeader]),
      sourceDescription: descriptionHeader
        ? this.toNullableString(row[descriptionHeader])
        : null,
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
    const normalizedCandidates = new Set(
      candidates.map((c) => this.normalizeHeader(c)),
    );

    return headers.find((h) => normalizedCandidates.has(this.normalizeHeader(h))) ?? null;
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

  // ─── Phase 4: Generic Reference ─────────────────────────────────────────────

  async uploadGenericReference(params: {
    file?: SidataBufferedFile;
    referenceType?: string;
    importedById?: string | null;
  }): Promise<ReferenceJabatanUploadResult> {
    const config = this.resolveGenericReferenceConfig(params.referenceType);
    const file = this.validateExcelFile(params.file);

    const parsedRows = this.parseReferenceJabatanExcel(file);
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

    const result = await this.sidataImportRepository.commitGenericReferenceBatch({
      batchId: batch.id,
      targetTable: config.targetTable,
    });

    await this.sidataImportRepository.createImportAuditLog({
      action: SIDATA_IMPORT_AUDIT_ACTION.COMMIT_REFERENCE,
      batchId: batch.id,
      batchType: 'REFERENCE',
      metadata: result,
    });

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

  async findAsnStagingByBatchId(batchId: string): Promise<SiasnAsnStagingResponse[]> {
    const batch = await this.sidataImportRepository.findAsnImportBatchById(batchId.trim());

    if (!batch) {
      throw new NotFoundException('Batch import ASN tidak ditemukan');
    }

    const rows = await this.sidataImportRepository.findAsnStagingByBatchId(batch.id);

    return rows.map((row) => ({
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
    }));
  }

  async uploadSiasnAsn(params: {
    file?: SidataBufferedFile;
    importedById?: string | null;
  }): Promise<SiasnAsnUploadResult> {
    const file = this.validateExcelFile(params.file);

    const parsedRows = this.parseSiasnAsnExcel(file);
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
      importType: SIDATA_ASN_IMPORT_TYPE.SIASN_ASN,
      fileName: file.originalname,
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
      importType: SIDATA_ASN_IMPORT_TYPE.SIASN_ASN,
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
      metadata: result,
    });

    return result;
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
    const hNamaJabatan = h(['nama_jabatan', 'jabatan', 'nama jabatan']);
    const hJenisJabatan = h(['jenis_jabatan', 'jenis jabatan']);
    const hKdJabatan = h(['kd_jabatan', 'kode_jabatan', 'kd jabatan', 'kode jabatan']);
    const hKdJabatanSiasn = h(['kd_jabatan_siasn', 'id_jabatan']);
    const hTmtJabatan = h(['tmt_jabatan', 'tmt jabatan']);
    const hNamaGolongan = h(['nama_golongan', 'golongan', 'nama golongan']);
    const hNamaRuang = h(['nama_ruang', 'ruang', 'nama ruang']);
    const hKdGolongan = h(['kd_golongan', 'kode_golongan', 'kd golongan', 'kode golongan']);
    const hKdGolonganSiasn = h(['kd_golongan_siasn', 'id_golongan']);
    const hTmtGolongan = h(['tmt_golongan', 'tmt golongan']);
    const hMasaKerjaGol = h(['masa_kerja_golongan', 'masa kerja golongan', 'mk_golongan']);
    const hMasaKerjaSeluruh = h(['masa_kerja_seluruh', 'masa kerja seluruh', 'total_masa_kerja']);
    const hEselon1 = h(['nama_unor_eselon1', 'unor_eselon1', 'eselon_i', 'eselon i', 'unor 1']);
    const hEselon2 = h(['nama_unor_eselon2', 'unor_eselon2', 'eselon_ii', 'eselon ii', 'unor 2']);
    const hEselon3 = h(['nama_unor_eselon3', 'unor_eselon3', 'eselon_iii', 'eselon iii', 'unor 3']);
    const hEselon4 = h(['nama_unor_eselon4', 'unor_eselon4', 'eselon_iv', 'eselon iv', 'unor 4']);
    const hKdUnor = h(['kd_unor', 'kode_unor', 'kd unor', 'kode unor']);
    const hTempatLahir = h(['tempat_lahir', 'tempat lahir']);
    const hTanggalLahir = h(['tanggal_lahir', 'tgl_lahir', 'tgl lahir', 'tanggal lahir']);
    const hJenisKelamin = h(['jenis_kelamin', 'jenis kelamin', 'kelamin']);
    const hAgama = h(['agama']);
    const hStatusKawin = h(['status_kawin', 'status kawin', 'kawin']);
    const hPendidikan = h(['pendidikan_terakhir', 'pendidikan', 'pendidikan terakhir']);
    const hNamaSekolah = h(['nama_sekolah', 'sekolah', 'nama sekolah', 'institusi']);
    const hTmtPns = h(['tmt_pns', 'tmt_cpns', 'tmt pns', 'tmt cpns']);
    const hTmtPensiun = h(['tmt_pensiun', 'tmt pensiun', 'bup', 'tanggal_pensiun']);
    const hStatusKepeg = h(['status_kepegawaian', 'status kepegawaian']);
    const hJenisAsn = h(['jenis_asn', 'jenis asn']);
    const hKedudukanHukum = h(['kedudukan_hukum', 'kedudukan hukum']);
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
      const nip = row.nip?.trim() ?? null;
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

  async commitSiasnAsnBatch(batchId: string): Promise<CommitSiasnAsnBatchResult> {
    const normalizedBatchId = batchId.trim();
    const batch = await this.sidataImportRepository.findAsnImportBatchById(normalizedBatchId);

    if (!batch) {
      throw new NotFoundException('Batch import ASN tidak ditemukan');
    }

    if (batch.status === SIDATA_IMPORT_STATUS.COMMITTED) {
      throw new BadRequestException('Batch ASN sudah pernah di-commit');
    }

    if (batch.status === SIDATA_IMPORT_STATUS.FAILED) {
      throw new BadRequestException('Batch ASN gagal dan tidak dapat di-commit');
    }

    if (batch.status === SIDATA_IMPORT_STATUS.CANCELLED) {
      throw new BadRequestException('Batch ASN dibatalkan dan tidak dapat di-commit');
    }

    const result = await this.sidataImportRepository.commitSiasnAsnBatch({ batchId: batch.id });

    await this.sidataImportRepository.createImportAuditLog({
      action: SIDATA_IMPORT_AUDIT_ACTION.COMMIT_ASN,
      batchId: batch.id,
      batchType: 'ASN',
      metadata: result,
    });

    return result;
  }

  async mapSiasnAsnBatch(batchId: string): Promise<MapSiasnAsnBatchResult> {
    const normalizedBatchId = batchId.trim();
    const batch = await this.sidataImportRepository.findAsnImportBatchById(normalizedBatchId);

    if (!batch) {
      throw new NotFoundException('Batch import ASN tidak ditemukan');
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

    const result = await this.sidataImportRepository.mapSiasnAsnBatch({ batchId: batch.id });

    await this.sidataImportRepository.createImportAuditLog({
      action: SIDATA_IMPORT_AUDIT_ACTION.MAP_ASN,
      batchId: batch.id,
      batchType: 'ASN',
      metadata: result,
    });

    return result;
  }

  // ─── Phase 8: Summary, Issues, Remap ─────────────────────────────────────────

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

  async remapSiasnAsnBatch(batchId: string): Promise<RemapSiasnAsnBatchResult> {
    const normalizedBatchId = batchId.trim();
    const batch = await this.sidataImportRepository.findAsnImportBatchById(normalizedBatchId);

    if (!batch) {
      throw new NotFoundException('Batch import ASN tidak ditemukan');
    }

    if (batch.status === SIDATA_IMPORT_STATUS.COMMITTED) {
      throw new BadRequestException('Batch ASN sudah di-commit dan tidak dapat di-remap');
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
