import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { SopReportsRepository } from './sop-reports.repository';
import type { ReportQueryDto } from './dto/report-query.dto';
import type { ExportLogDto } from './dto/export-log.dto';
import type { AuthUser } from '../auth/auth.types';

const BLOCKED = new Set(['OPD', 'PPPK']);

function getPrimary(user: AuthUser): string {
  return Array.isArray(user.roles) ? (user.roles[0] ?? 'OPD') : 'OPD';
}

@Injectable()
export class SopReportsService {
  constructor(
    private readonly repo: SopReportsRepository,
    private readonly audit: AuditService,
  ) {}

  private assertNotBlocked(user: AuthUser) {
    const role = getPrimary(user);
    if (BLOCKED.has(role)) throw new ForbiddenException('Akses tidak diizinkan.');
  }

  getExecutiveReport(user: AuthUser, q: ReportQueryDto) {
    this.assertNotBlocked(user);
    const role = getPrimary(user);
    return this.repo.getExecutiveReport(q, role);
  }

  getEvidencePackage(user: AuthUser, q: ReportQueryDto) {
    this.assertNotBlocked(user);
    return this.repo.getEvidencePackage(q);
  }

  getSummaryPrint(user: AuthUser, q: ReportQueryDto) {
    this.assertNotBlocked(user);
    return this.repo.getSummaryPrint(q);
  }

  async writeExportLog(user: AuthUser, dto: ExportLogDto): Promise<{ ok: boolean }> {
    this.assertNotBlocked(user);
    const role = getPrimary(user);
    const userId = (user as { id?: string }).id ?? null;

    await this.audit.record({
      entityType: 'SOP_REPORT_EXPORT',
      entityId: dto.reportType,
      action: `EXPORT_${dto.reportType}`,
      performedBy: userId,
      afterData: {
        reportType: dto.reportType,
        format: dto.format ?? 'JSON',
        moduleKey: dto.moduleKey ?? null,
        sopCode: dto.sopCode ?? null,
        exportedByRole: role,
        exportedAt: new Date().toISOString(),
      },
    });

    return { ok: true };
  }
}
