import { Body, Controller, Get, Inject, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ok } from '../shared/respond';
import type { AuthUser } from '../auth/auth.types';
import { ExecutiveReportQueryDto } from './dto/executive-report-query.dto';
import { ExecutiveExportLogDto } from './dto/export-log.dto';
import { KinerjaExecutiveReportService } from './kinerja-executive-report.service';

const VIEW_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
];

const EXPORT_ROLES = ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID'];

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/kinerja/executive-report')
export class KinerjaExecutiveReportController {
  constructor(
    @Inject(KinerjaExecutiveReportService)
    private readonly service: KinerjaExecutiveReportService,
  ) {}

  @Get('summary')
  @Roles(...VIEW_ROLES)
  async summary(@Query() query: ExecutiveReportQueryDto, @CurrentUser() user: AuthUser) {
    return ok(await this.service.getSummary(query, user));
  }

  @Get('monthly')
  @Roles(...VIEW_ROLES)
  async monthly(@Query() query: ExecutiveReportQueryDto, @CurrentUser() user: AuthUser) {
    return ok(await this.service.getMonthlyReport(query, user));
  }

  @Get('quarterly')
  @Roles(...VIEW_ROLES)
  async quarterly(@Query() query: ExecutiveReportQueryDto, @CurrentUser() user: AuthUser) {
    return ok(await this.service.getQuarterlyReport(query, user));
  }

  @Get('evidence-bundle')
  @Roles(...VIEW_ROLES)
  async evidenceBundle(@Query() query: ExecutiveReportQueryDto, @CurrentUser() user: AuthUser) {
    return ok(await this.service.getEvidenceBundle(query, user));
  }

  @Get('print-summary')
  @Roles(...VIEW_ROLES)
  async printSummary(@Query() query: ExecutiveReportQueryDto, @CurrentUser() user: AuthUser) {
    return ok(await this.service.getPrintSummary(query, user));
  }

  @Post('export-log')
  @Roles(...EXPORT_ROLES)
  async exportLog(@Body() dto: ExecutiveExportLogDto, @CurrentUser() user: AuthUser) {
    return ok(await this.service.writeExportLog(dto, user), 'Log ekspor berhasil dicatat');
  }

  @Post('archive-to-dms')
  @Roles(...EXPORT_ROLES)
  archiveToDms(@Query() query: ExecutiveReportQueryDto, @CurrentUser() user: AuthUser) {
    return ok(this.service.archiveToDms(query, user));
  }
}
