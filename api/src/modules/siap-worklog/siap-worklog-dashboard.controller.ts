import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ok } from '../shared/respond';
import { WorklogDashboardQueryDto } from './dto/worklog-dashboard-query.dto';
import { SiapWorklogDashboardService } from './siap-worklog-dashboard.service';

const SIAP_WORKLOG_DASHBOARD_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
];

const SIAP_WORKLOG_EXECUTIVE_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
];

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...SIAP_WORKLOG_DASHBOARD_ROLES)
@Controller('api/v1/siap/worklogs/dashboard')
export class SiapWorklogDashboardController {
  constructor(
    @Inject(SiapWorklogDashboardService)
    private readonly dashboardService: SiapWorklogDashboardService,
  ) {}

  @Get('team')
  async getTeamDashboard(
    @Query() query: WorklogDashboardQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.dashboardService.getTeamDashboard(query, user);
    return ok(result);
  }

  @Get('executive')
  @Roles(...SIAP_WORKLOG_EXECUTIVE_ROLES)
  async getExecutiveDashboard(
    @Query() query: WorklogDashboardQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.dashboardService.getExecutiveDashboard(query, user);
    return ok(result);
  }
}