import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ok } from '../shared/respond';
import { AnalyticsService } from './analytics.service';
import { AnalyticsDashboardQueryDto } from './dto/analytics-dashboard-query.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'KEPALA_BADAN', 'KABID', 'ANALIS_MADYA')
@Controller('api/v1/analytics')
export class AnalyticsController {
  constructor(
    @Inject(AnalyticsService)
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Get('dashboard')
  async dashboard(@Query() query: AnalyticsDashboardQueryDto) {
    const result = await this.analyticsService.getDashboard(query);
    return ok(result, 'Analytics dashboard berhasil dimuat');
  }
}
