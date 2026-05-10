import { Body, Controller, Inject, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ok } from '../shared/respond';
import { getAuditContext } from '../shared/request-context';
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
  async processOverdue(
    @Body() body: ProcessOverdueBody,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    const result = await this.slaEscalationService.processOverdue(
      body.limit ?? 100,
      user,
      getAuditContext(request),
    );

    return ok(result, 'SLA overdue berhasil diproses');
  }
}
