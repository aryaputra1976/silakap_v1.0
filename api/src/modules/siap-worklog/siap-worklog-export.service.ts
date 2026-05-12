import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { AuthUser } from '../auth/auth.types';
import { WorklogExportQueryDto } from './dto/worklog-export-query.dto';
import {
  DashboardStaffRecord,
  DashboardWorklogRecord,
  SiapWorklogDashboardRepository,
  WorklogDashboardScope,
} from './siap-worklog-dashboard.repository';
import { buildWorklogExportPdf } from './siap-worklog-export-pdf';

const EXPORT_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
];

@Injectable()
export class SiapWorklogExportService {
  constructor(
    @Inject(SiapWorklogDashboardRepository)
    private readonly dashboardRepository: SiapWorklogDashboardRepository,
  ) {}

  async exportExcel(query: WorklogExportQueryDto, user: AuthUser) {
    this.ensureCanExport(user);

    const scope = this.buildScope(query, user);
    const [staff, worklogs] = await Promise.all([
      this.dashboardRepository.findStaff(scope),
      this.dashboardRepository.findPeriodWorklogs(scope),
    ]);

    const csv = this.buildCsv(staff, worklogs);

    return {
      buffer: Buffer.from(`\uFEFF${csv}`, 'utf8'),
      mimeType: 'text/csv; charset=utf-8',
      fileName: this.buildFileName('laporan-buku-kerja', scope, 'csv'),
    };
  }

  async exportPdf(query: WorklogExportQueryDto, user: AuthUser) {
    this.ensureCanExport(user);

    const scope = this.buildScope(query, user);
    const [staff, worklogs] = await Promise.all([
      this.dashboardRepository.findStaff(scope),
      this.dashboardRepository.findPeriodWorklogs(scope),
    ]);

    const summary = this.buildSummary(staff, worklogs);
    const lines = this.buildPdfLines(worklogs, summary);

    return {
      buffer: buildWorklogExportPdf({
        title: 'LAPORAN BUKU KERJA SIAP',
        subtitle: `Periode ${formatDate(scope.from)} s.d. ${formatDate(
          scope.to,
        )}${scope.unitKerjaId ? ` | Unit: ${scope.unitKerjaId}` : ''}`,
        lines,
      }),
      mimeType: 'application/pdf',
      fileName: this.buildFileName('laporan-buku-kerja', scope, 'pdf'),
    };
  }

  private buildCsv(
    staff: DashboardStaffRecord[],
    worklogs: DashboardWorklogRecord[],
  ) {
    const staffById = new Map(staff.map((item) => [item.id, item]));
    const rows: string[][] = [
      [
        'Tanggal',
        'Nama Staf',
        'Username',
        'Unit Kerja',
        'Kategori',
        'Judul Kegiatan',
        'Uraian',
        'Output',
        'Volume',
        'Kendala',
        'Status',
        'Tanggal Submit',
        'Reviewer',
        'Tanggal Review',
        'Catatan Review',
      ],
    ];

    for (const item of worklogs) {
      const staffRecord = staffById.get(item.userId);

      rows.push([
        formatDate(item.workDate),
        item.user.name,
        item.user.username,
        item.unitKerja?.nama ?? staffRecord?.unitKerja?.nama ?? '',
        item.category,
        item.title,
        item.description,
        item.output ?? '',
        item.volume === null ? '' : String(item.volume),
        item.obstacle ?? '',
        item.status,
        item.submittedAt ? formatDateTime(item.submittedAt) : '',
        item.reviewer?.name ?? '',
        item.reviewedAt ? formatDateTime(item.reviewedAt) : '',
        item.reviewNote ?? '',
      ]);
    }

    return rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n');
  }

  private buildPdfLines(
    worklogs: DashboardWorklogRecord[],
    summary: {
      totalStaff: number;
      totalWorklogs: number;
      totalVolume: number;
      submitted: number;
      approved: number;
      revision: number;
      obstacle: number;
    },
  ) {
    const lines = [
      {
        text: `Ringkasan: Staf ${summary.totalStaff} | Worklog ${summary.totalWorklogs} | Volume ${summary.totalVolume} | Submitted ${summary.submitted} | Approved ${summary.approved} | Revisi ${summary.revision} | Kendala ${summary.obstacle}`,
        bold: true,
        gap: 0,
      },
      { text: repeat('-', 142), gap: 8 },
      {
        text:
          pad('Tanggal', 12) +
          pad('Staf', 24) +
          pad('Unit', 24) +
          pad('Status', 18) +
          pad('Vol', 6) +
          'Kegiatan',
        bold: true,
      },
      { text: repeat('-', 142) },
    ];

    if (worklogs.length === 0) {
      lines.push({
        text: 'Belum ada data buku kerja pada periode ini.',
        gap: 8,
      });

      return lines;
    }

    for (const item of worklogs) {
      lines.push({
        text:
          pad(formatDate(item.workDate), 12) +
          pad(truncate(item.user.name, 23), 24) +
          pad(truncate(item.unitKerja?.nama ?? '-', 23), 24) +
          pad(item.status, 18) +
          pad(item.volume === null ? '-' : String(item.volume), 6) +
          truncate(item.title, 55),
      });

      lines.push({
        text: `  Output : ${truncate(item.output ?? '-', 124)}`,
      });

      if (item.obstacle) {
        lines.push({
          text: `  Kendala: ${truncate(item.obstacle, 124)}`,
        });
      }

      lines.push({ text: repeat('-', 142) });
    }

    return lines;
  }

  private buildSummary(
    staff: DashboardStaffRecord[],
    worklogs: DashboardWorklogRecord[],
  ) {
    return {
      totalStaff: staff.length,
      totalWorklogs: worklogs.length,
      totalVolume: worklogs.reduce((sum, item) => sum + (item.volume ?? 0), 0),
      submitted: worklogs.filter((item) => item.status === 'SUBMITTED').length,
      approved: worklogs.filter((item) => item.status === 'APPROVED').length,
      revision: worklogs.filter((item) => item.status === 'REVISION_REQUIRED')
        .length,
      obstacle: worklogs.filter((item) => item.obstacle?.trim()).length,
    };
  }

  private buildScope(
    query: WorklogExportQueryDto,
    user: AuthUser,
  ): WorklogDashboardScope {
    const today = new Date();

    const from = query.from
      ? startOfDay(this.parseDateOnly(query.from, 'Tanggal awal tidak valid'))
      : startOfDay(addDays(today, -30));

    const to = query.to
      ? endOfDay(this.parseDateOnly(query.to, 'Tanggal akhir tidak valid'))
      : endOfDay(today);

    if (from.getTime() > to.getTime()) {
      throw new BadRequestException(
        'Tanggal awal tidak boleh melebihi tanggal akhir',
      );
    }

    const requestedUnitKerjaId = query.unitKerjaId?.trim() || undefined;

    if (this.hasAnyRole(user, ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'KEPALA_BADAN'])) {
      return {
        unitKerjaId: requestedUnitKerjaId,
        from,
        to,
        todayStart: startOfDay(today),
        todayEnd: endOfDay(today),
      };
    }

    if (
      this.hasAnyRole(user, ['KABID', 'ANALIS_MADYA', 'ANALIS_MUDA']) &&
      user.unitKerjaId
    ) {
      return {
        unitKerjaId: user.unitKerjaId,
        from,
        to,
        todayStart: startOfDay(today),
        todayEnd: endOfDay(today),
      };
    }

    throw new ForbiddenException('Unit kerja user belum tersedia');
  }

  private ensureCanExport(user: AuthUser) {
    if (!this.hasAnyRole(user, EXPORT_ROLES)) {
      throw new ForbiddenException(
        'Anda tidak berwenang export laporan buku kerja',
      );
    }
  }

  private parseDateOnly(value: string, message: string) {
    const parsed = new Date(`${value}T00:00:00.000`);

    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(message);
    }

    return parsed;
  }

  private buildFileName(
    prefix: string,
    scope: WorklogDashboardScope,
    ext: string,
  ) {
    return `${prefix}-${toFileDate(scope.from)}-${toFileDate(scope.to)}.${ext}`;
  }

  private hasAnyRole(user: AuthUser, roles: string[]) {
    return user.roles.some((role) => roles.includes(role));
  }
}

function escapeCsv(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(value);
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
}

function toFileDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

function addDays(value: Date, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

function pad(value: string, length: number) {
  return value.padEnd(length, ' ').slice(0, length);
}

function truncate(value: string, length: number) {
  return value.length <= length ? value : `${value.slice(0, length - 3)}...`;
}

function repeat(value: string, length: number) {
  return value.repeat(length).slice(0, length);
}