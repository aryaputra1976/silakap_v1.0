import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { KinerjaRhkRealizationService } from '../kinerja-rhk-realization/kinerja-rhk-realization.service';
import type { QueryRealizationDto } from '../kinerja-rhk-realization/dto/query-realization.dto';
import type { ReportQueryDto } from '../kinerja-rhk-realization/dto/report-query.dto';
import type { AuthUser } from '../auth/auth.types';
import { KinerjaExecutiveReportRepository } from './kinerja-executive-report.repository';
import type { ExecutiveReportQueryDto } from './dto/executive-report-query.dto';
import type { ExecutiveExportLogDto } from './dto/export-log.dto';

const BLOCKED = new Set(['OPD', 'PPPK']);
const EXPORT_ROLES = new Set(['SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID']);

function getPrimary(user: AuthUser): string {
  return Array.isArray(user.roles) ? (user.roles[0] ?? 'OPD') : 'OPD';
}

@Injectable()
export class KinerjaExecutiveReportService {
  constructor(
    @Inject(KinerjaExecutiveReportRepository)
    private readonly repo: KinerjaExecutiveReportRepository,
    @Inject(KinerjaRhkRealizationService)
    private readonly realizationService: KinerjaRhkRealizationService,
    @Inject(AuditService)
    private readonly audit: AuditService,
  ) {}

  private assertViewAllowed(user: AuthUser) {
    if (BLOCKED.has(getPrimary(user))) {
      throw new ForbiddenException('Akses laporan eksekutif tidak diizinkan.');
    }
  }

  private assertExportAllowed(user: AuthUser) {
    if (!EXPORT_ROLES.has(getPrimary(user))) {
      throw new ForbiddenException('Hanya KABID atau Admin yang dapat mengekspor laporan.');
    }
  }

  async getSummary(query: ExecutiveReportQueryDto, user: AuthUser) {
    this.assertViewAllowed(user);
    const summaryQuery = { ...query, status: 'APPROVED' } as QueryRealizationDto;
    return this.realizationService.getSummary(summaryQuery, user);
  }

  async getMonthlyReport(query: ExecutiveReportQueryDto, user: AuthUser) {
    this.assertViewAllowed(user);
    const report = await this.realizationService.getMonthlyReport(
      query as ReportQueryDto,
      user,
    );
    void this.audit.record({
      entityType: 'KINERJA_EXECUTIVE_REPORT',
      entityId: `monthly-${query.periodYear ?? 'all'}-${query.periodMonth ?? 'all'}`,
      action: 'KINERJA_EXECUTIVE_REPORT_GENERATED',
      performedBy: user.id,
      afterData: {
        reportType: 'MONTHLY',
        periodYear: query.periodYear ?? null,
        periodMonth: query.periodMonth ?? null,
        generatedAt: new Date().toISOString(),
      },
    });
    return report;
  }

  async getQuarterlyReport(query: ExecutiveReportQueryDto, user: AuthUser) {
    this.assertViewAllowed(user);
    const report = await this.realizationService.getQuarterlyReport(
      query as ReportQueryDto,
      user,
    );
    void this.audit.record({
      entityType: 'KINERJA_EXECUTIVE_REPORT',
      entityId: `quarterly-${query.periodYear ?? 'all'}-Q${query.periodQuarter ?? 'all'}`,
      action: 'KINERJA_EXECUTIVE_REPORT_GENERATED',
      performedBy: user.id,
      afterData: {
        reportType: 'QUARTERLY',
        periodYear: query.periodYear ?? null,
        periodQuarter: query.periodQuarter ?? null,
        generatedAt: new Date().toISOString(),
      },
    });
    return report;
  }

  async getEvidenceBundle(query: ExecutiveReportQueryDto, user: AuthUser) {
    this.assertViewAllowed(user);
    const items = await this.repo.getEvidenceBundle(query);
    void this.audit.record({
      entityType: 'KINERJA_EXECUTIVE_REPORT',
      entityId: `evidence-bundle-${query.periodYear ?? 'all'}`,
      action: 'KINERJA_EVIDENCE_BUNDLE_GENERATED',
      performedBy: user.id,
      afterData: {
        count: items.length,
        periodYear: query.periodYear ?? null,
        generatedAt: new Date().toISOString(),
      },
    });
    return items;
  }

  async getPrintSummary(query: ExecutiveReportQueryDto, user: AuthUser) {
    this.assertViewAllowed(user);
    return this.realizationService.getPrintSummary(query as ReportQueryDto, user);
  }

  async writeExportLog(dto: ExecutiveExportLogDto, user: AuthUser) {
    this.assertExportAllowed(user);
    const role = getPrimary(user);
    await this.audit.record({
      entityType: 'KINERJA_EXECUTIVE_REPORT',
      entityId: dto.reportType,
      action: 'KINERJA_EXECUTIVE_REPORT_EXPORTED',
      performedBy: user.id,
      afterData: {
        reportType: dto.reportType,
        format: dto.format ?? 'JSON',
        rhkCode: dto.rhkCode ?? null,
        moduleKey: dto.moduleKey ?? null,
        exportedByRole: role,
        note: dto.note ?? null,
        exportedAt: new Date().toISOString(),
      },
    });
    return { ok: true };
  }

  archiveToDms(_query: ExecutiveReportQueryDto, _user: AuthUser): never {
    throw new BadRequestException(
      'Arsip ke DMS belum tersedia. Laporan eksekutif belum memiliki dokumen PDF yang dapat disimpan ke DMS.',
    );
  }
}
