import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { DmsDocumentCategory, DmsDocumentStatus } from '@prisma/client';
import { AuthUser } from '../auth/auth.types';
import { DmsReportQueryDto } from './dto/dms-report-query.dto';
import {
  DmsReportRepository,
  DmsReportRow,
  NormalizedDmsReportFilters,
} from './dms-report.repository';

export interface DmsCsvExportPayload {
  fileName: string;
  contentType: string;
  content: string;
}

@Injectable()
export class DmsReportService {
  constructor(
    @Inject(DmsReportRepository)
    private readonly dmsReportRepository: DmsReportRepository,
  ) {}

  async exportCsv(
    query: DmsReportQueryDto,
    user: AuthUser,
  ): Promise<DmsCsvExportPayload> {
    const filters = this.normalizeFilters(query);
    const rows = await this.dmsReportRepository.findRows(filters, user);
    const content = this.toCsv(rows);
    const fileName = this.buildFileName(filters);

    return {
      fileName,
      contentType: 'text/csv; charset=utf-8',
      content,
    };
  }

  private normalizeFilters(query: DmsReportQueryDto): NormalizedDmsReportFilters {
    return {
      year: this.normalizeNumber(query.year, 'Tahun tidak valid', 2000, 2100),
      month: this.normalizeNumber(query.month, 'Bulan tidak valid', 1, 12),
      quarter: this.normalizeNumber(
        query.quarter,
        'Triwulan tidak valid',
        1,
        4,
      ),
      unitKerjaId: this.normalizeOptionalText(query.unitKerjaId),
      category: query.category,
      status: query.status,
    };
  }

  private normalizeOptionalText(value: string | undefined) {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }

  private normalizeNumber(
    value: string | undefined,
    message: string,
    min: number,
    max: number,
  ) {
    const normalized = value?.trim();

    if (!normalized) {
      return undefined;
    }

    const parsed = Number(normalized);

    if (!Number.isFinite(parsed)) {
      throw new BadRequestException(message);
    }

    const number = Math.trunc(parsed);

    if (number < min || number > max) {
      throw new BadRequestException(message);
    }

    return number;
  }

  private buildFileName(filters: NormalizedDmsReportFilters) {
    const parts = ['laporan-dms'];

    if (filters.year) {
      parts.push(String(filters.year));
    }

    if (filters.month) {
      parts.push(`bulan-${filters.month}`);
    }

    if (filters.quarter) {
      parts.push(`triwulan-${filters.quarter}`);
    }

    if (filters.category) {
      parts.push(filters.category.toLowerCase());
    }

    if (filters.status) {
      parts.push(filters.status.toLowerCase());
    }

    return `${parts.join('-')}.csv`;
  }

  private toCsv(rows: DmsReportRow[]) {
    const header = [
      'No',
      'ID Dokumen',
      'Judul',
      'Deskripsi',
      'Kategori',
      'Status',
      'Tahun',
      'Bulan',
      'Triwulan',
      'Unit Kerja Kode',
      'Unit Kerja Nama',
      'ASN NIP',
      'ASN Nama',
      'ASN Jabatan',
      'ASN Golongan',
      'Case Number',
      'Case Judul',
      'Worklog Judul',
      'Nama File',
      'Nama File Asli',
      'MIME Type',
      'Ukuran File',
      'Dibuat Oleh',
      'Disubmit Oleh',
      'Diverifikasi Oleh',
      'Submitted At',
      'Verified At',
      'Rejected At',
      'Archived At',
      'Catatan Penolakan',
      'Created At',
      'Updated At',
    ];

    const lines = rows.map((row, index) => [
      index + 1,
      row.id,
      row.title,
      row.description,
      row.category,
      row.status,
      row.periodYear,
      row.periodMonth,
      row.periodQuarter,
      row.unitKerja?.kode,
      row.unitKerja?.nama,
      row.asn?.nip,
      row.asn?.nama,
      row.asn?.jabatanNama,
      row.asn?.golonganNama,
      row.case?.caseNumber,
      row.case?.title,
      row.worklog?.title,
      row.fileName,
      row.originalFileName,
      row.mimeType,
      row.fileSize,
      row.createdBy?.name,
      row.submittedBy?.name,
      row.verifiedBy?.name,
      this.formatDate(row.submittedAt),
      this.formatDate(row.verifiedAt),
      this.formatDate(row.rejectedAt),
      this.formatDate(row.archivedAt),
      row.rejectionNote,
      this.formatDate(row.createdAt),
      this.formatDate(row.updatedAt),
    ]);

    return [
      header.map((value) => this.escapeCsv(value)).join(','),
      ...lines.map((line) =>
        line.map((value) => this.escapeCsv(value)).join(','),
      ),
    ].join('\n');
  }

  private escapeCsv(value: unknown) {
    if (value === null || value === undefined) {
      return '';
    }

    const text = String(value);
    const escaped = text.replaceAll('"', '""');

    if (
      escaped.includes(',') ||
      escaped.includes('"') ||
      escaped.includes('\n') ||
      escaped.includes('\r')
    ) {
      return `"${escaped}"`;
    }

    return escaped;
  }

  private formatDate(value: Date | null) {
    return value ? value.toISOString() : '';
  }
}