import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth.types';
import { ok } from '../shared/respond';
import { SopAnalyticsService } from './sop-analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

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

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/sop-analytics')
export class SopAnalyticsController {
  constructor(private readonly service: SopAnalyticsService) {}

  @Get('compliance-summary')
  @Roles(...VIEW_ROLES)
  async getComplianceSummary(
    @CurrentUser() user: AuthUser,
    @Query() q: AnalyticsQueryDto,
  ) {
    return ok(await this.service.getComplianceSummary(user, q));
  }

  @Get('compliance-by-sop')
  @Roles(...VIEW_ROLES)
  async getComplianceBySop(
    @CurrentUser() user: AuthUser,
    @Query() q: AnalyticsQueryDto,
  ) {
    return ok(await this.service.getComplianceBySop(user, q));
  }

  @Get('risk-insights')
  @Roles(...VIEW_ROLES)
  async getRiskInsights(
    @CurrentUser() user: AuthUser,
    @Query() q: AnalyticsQueryDto,
  ) {
    return ok(await this.service.getRiskInsights(user, q));
  }

  @Get('evidence-completeness')
  @Roles(...VIEW_ROLES)
  async getEvidenceCompleteness(
    @CurrentUser() user: AuthUser,
    @Query() q: AnalyticsQueryDto,
  ) {
    return ok(await this.service.getEvidenceCompleteness(user, q));
  }

  @Get('executive-summary')
  @Roles(...VIEW_ROLES)
  async getExecutiveSummary(
    @CurrentUser() user: AuthUser,
    @Query() q: AnalyticsQueryDto,
  ) {
    return ok(await this.service.getExecutiveSummary(user, q));
  }
}
