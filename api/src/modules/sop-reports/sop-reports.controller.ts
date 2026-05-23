import { Body, Controller, Get, Inject, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth.types';
import { ok } from '../shared/respond';
import { SopReportsService } from './sop-reports.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { ExportLogDto } from './dto/export-log.dto';

// All internal roles except OPD, PPPK
const VIEW_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
  'ANALIS_PERTAMA',
  'PENELAAH',
] as const;

// Only roles that can trigger an export action
const WRITE_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
] as const;

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/sop-reports')
export class SopReportsController {
  constructor(
    @Inject(SopReportsService)
    private readonly service: SopReportsService,
  ) {}

  @Get('executive')
  @Roles(...VIEW_ROLES)
  async getExecutive(
    @CurrentUser() user: AuthUser,
    @Query() q: ReportQueryDto,
  ) {
    return ok(await this.service.getExecutiveReport(user, q));
  }

  @Get('evidence-package')
  @Roles(...VIEW_ROLES)
  async getEvidencePackage(
    @CurrentUser() user: AuthUser,
    @Query() q: ReportQueryDto,
  ) {
    return ok(await this.service.getEvidencePackage(user, q));
  }

  @Get('summary-print')
  @Roles(...VIEW_ROLES)
  async getSummaryPrint(
    @CurrentUser() user: AuthUser,
    @Query() q: ReportQueryDto,
  ) {
    return ok(await this.service.getSummaryPrint(user, q));
  }

  @Post('export-log')
  @Roles(...WRITE_ROLES)
  async postExportLog(
    @CurrentUser() user: AuthUser,
    @Body() dto: ExportLogDto,
  ) {
    return ok(await this.service.writeExportLog(user, dto));
  }
}
