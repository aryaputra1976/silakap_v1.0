import { Controller, Get, Inject, Param, UseGuards } from '@nestjs/common';
import { AuthUser } from '../../auth/auth.types';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { ok } from '../../shared/respond';
import { DMS_VIEW_ROLES } from '../constants/dms-permission.constant';
import { DmsAuditService } from './dms-audit.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...DMS_VIEW_ROLES)
@Controller('api/v1/dms/documents/:documentId/audit')
export class DmsAuditController {
  constructor(
    @Inject(DmsAuditService)
    private readonly dmsAuditService: DmsAuditService,
  ) {}

  @Get()
  async getDocumentTimeline(
    @Param('documentId') documentId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.dmsAuditService.getDocumentTimeline(
      documentId,
      user,
    );

    return ok(result);
  }
}
