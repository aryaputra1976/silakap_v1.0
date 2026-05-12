import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ok } from '../shared/respond';
import { DmsDashboardQueryDto } from './dto/dms-dashboard-query.dto';
import { DmsDashboardService } from './dms-dashboard.service';

const DMS_DASHBOARD_ROLES = [
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

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...DMS_DASHBOARD_ROLES)
@Controller('api/v1/dms/dashboard')
export class DmsDashboardController {
  constructor(
    @Inject(DmsDashboardService)
    private readonly dmsDashboardService: DmsDashboardService,
  ) {}

  @Get('summary')
  async getSummary(
    @Query() query: DmsDashboardQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.dmsDashboardService.getSummary(query, user);
    return ok(result);
  }
}