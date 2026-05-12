import {
  Controller,
  Get,
  Header,
  Inject,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { DmsReportQueryDto } from './dto/dms-report-query.dto';
import { DmsReportService } from './dms-report.service';

const DMS_REPORT_ROLES = [
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
@Roles(...DMS_REPORT_ROLES)
@Controller('api/v1/dms/reports')
export class DmsReportController {
  constructor(
    @Inject(DmsReportService)
    private readonly dmsReportService: DmsReportService,
  ) {}

  @Get('export')
  @Header('Cache-Control', 'no-store')
  async exportCsv(
    @Query() query: DmsReportQueryDto,
    @CurrentUser() user: AuthUser,
    @Res() response: Response,
  ) {
    const result = await this.dmsReportService.exportCsv(query, user);

    response.setHeader('Content-Type', result.contentType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.fileName}"`,
    );

    response.send(result.content);
  }
}