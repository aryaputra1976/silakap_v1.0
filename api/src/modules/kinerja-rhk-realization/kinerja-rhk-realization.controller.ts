import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthUser } from '../auth/auth.types';
import { ok } from '../shared/respond';
import { ArchiveRealizationDto } from './dto/archive-realization.dto';
import { CreateRealizationFromCandidateDto } from './dto/create-realization-from-candidate.dto';
import { QueryRealizationDto } from './dto/query-realization.dto';
import { ReportQueryDto } from './dto/report-query.dto';
import { KinerjaRhkRealizationService } from './kinerja-rhk-realization.service';

const VIEW_ROLES = [
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

const REPORT_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
];

const APPROVE_ROLES = ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID'];

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/kinerja/rhk-realizations')
export class KinerjaRhkRealizationController {
  constructor(private readonly service: KinerjaRhkRealizationService) {}

  @Get()
  @Roles(...VIEW_ROLES)
  async list(@Query() query: QueryRealizationDto, @CurrentUser() user: AuthUser) {
    return ok(await this.service.list(query, user));
  }

  @Get('summary')
  @Roles(...REPORT_ROLES)
  async summary(@Query() query: QueryRealizationDto, @CurrentUser() user: AuthUser) {
    return ok(await this.service.getSummary(query, user));
  }

  @Get('report/monthly')
  @Roles(...REPORT_ROLES)
  async monthlyReport(@Query() query: ReportQueryDto, @CurrentUser() user: AuthUser) {
    return ok(await this.service.getMonthlyReport(query, user));
  }

  @Get('report/quarterly')
  @Roles(...REPORT_ROLES)
  async quarterlyReport(@Query() query: ReportQueryDto, @CurrentUser() user: AuthUser) {
    return ok(await this.service.getQuarterlyReport(query, user));
  }

  @Get('report/print-summary')
  @Roles(...REPORT_ROLES)
  async printSummary(@Query() query: ReportQueryDto, @CurrentUser() user: AuthUser) {
    return ok(await this.service.getPrintSummary(query, user));
  }

  @Get(':id')
  @Roles(...VIEW_ROLES)
  async getById(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return ok(await this.service.getById(id, user));
  }

  @Post('from-candidate/:candidateId')
  @Roles(...APPROVE_ROLES)
  async createFromCandidate(
    @Param('candidateId') candidateId: string,
    @Body() dto: CreateRealizationFromCandidateDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(
      await this.service.createFromCandidate(candidateId, dto, user),
      'Realisasi RHK berhasil dibuat dari kandidat',
    );
  }

  @Post(':id/archive')
  @Roles(...APPROVE_ROLES)
  async archive(
    @Param('id') id: string,
    @Body() dto: ArchiveRealizationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.archive(id, dto, user), 'Realisasi RHK berhasil diarsipkan');
  }
}
