import { Controller, Get } from '@nestjs/common';
import { ok } from '../shared/respond';

@Controller('health')
export class HealthController {
  @Get()
  health() {
    return ok({
      service: 'silakap-hostinger-api',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  }
}
