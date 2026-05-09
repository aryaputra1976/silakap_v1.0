import { Controller, Get } from '@nestjs/common';
import { ok } from '../shared/respond';

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
