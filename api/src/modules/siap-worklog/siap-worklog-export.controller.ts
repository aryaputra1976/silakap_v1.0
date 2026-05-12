import { Controller, Get, Inject, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WorklogExportQueryDto } from './dto/worklog-export-query.dto';
import { SiapWorklogExportService } from './siap-worklog-export.service';

const SIAP_WORKLOG_EXPORT_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
];

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...SIAP_WORKLOG_EXPORT_ROLES)
@Controller('api/v1/siap/worklogs/export')
export class SiapWorklogExportController {
  constructor(
    @Inject(SiapWorklogExportService)
    private readonly exportService: SiapWorklogExportService,
  ) {}

  @Get('excel')
  async exportExcel(
    @Query() query: WorklogExportQueryDto,
    @CurrentUser() user: AuthUser,
    @Res() response: Response,
  ) {
    const result = await this.exportService.exportExcel(query, user);

    response.setHeader('Content-Type', result.mimeType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.fileName}"`,
    );

    response.send(result.buffer);
  }

  @Get('pdf')
  async exportPdf(
    @Query() query: WorklogExportQueryDto,
    @CurrentUser() user: AuthUser,
    @Res() response: Response,
  ) {
    const result = await this.exportService.exportPdf(query, user);

    response.setHeader('Content-Type', result.mimeType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.fileName}"`,
    );

    response.send(result.buffer);
  }
}