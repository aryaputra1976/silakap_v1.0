import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ok } from '../shared/respond';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID')
@Controller('api/v1/analytics')
export class AnalyticsController {
  @Get('dashboard')
  dashboard() {
    return ok(
      {
        approvalPending: 0,
        slaMerah: 0,
        backlog: 0,
        workloadStaf: [],
      },
      'SIANALITIK dashboard endpoint ready',
    );
  }
}
