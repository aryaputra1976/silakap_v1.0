import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { DmsAuditController } from './dms-audit.controller';
import { DmsAuditRepository } from './dms-audit.repository';
import { DmsAuditService } from './dms-audit.service';
import { DmsDashboardController } from './dms-dashboard.controller';
import { DmsDashboardRepository } from './dms-dashboard.repository';
import { DmsDashboardService } from './dms-dashboard.service';
import { DmsReportController } from './dms-report.controller';
import { DmsReportRepository } from './dms-report.repository';
import { DmsReportService } from './dms-report.service';
import { DmsController } from './dms.controller';
import { DmsRepository } from './dms.repository';
import { DmsService } from './dms.service';

@Module({
  imports: [AuthModule, PrismaModule, AuditModule],
  controllers: [
    DmsController,
    DmsDashboardController,
    DmsReportController,
    DmsAuditController,
  ],
  providers: [
    DmsRepository,
    DmsService,
    DmsDashboardRepository,
    DmsDashboardService,
    DmsReportRepository,
    DmsReportService,
    DmsAuditRepository,
    DmsAuditService,
  ],
  exports: [
    DmsRepository,
    DmsService,
    DmsDashboardRepository,
    DmsDashboardService,
    DmsReportRepository,
    DmsReportService,
    DmsAuditRepository,
    DmsAuditService,
  ],
})
export class DmsModule {}