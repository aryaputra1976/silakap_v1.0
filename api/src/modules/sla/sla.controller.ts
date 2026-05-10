import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ok } from '../shared/respond';
import { SlaEscalationService } from './sla-escalation.service';

type ProcessOverdueBody = {
  limit?: number;
};

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN_BKPSDM')
@Controller('api/v1/sla')
export class SlaController {
  constructor(
    @Inject(SlaEscalationService)
    private readonly slaEscalationService: SlaEscalationService,
  ) {}

  @Post('process-overdue')
  async processOverdue(@Body() body: ProcessOverdueBody) {
    const result = await this.slaEscalationService.processOverdue(
      body.limit ?? 100,
    );

    return ok(result, 'SLA overdue berhasil diproses');
  }
}
