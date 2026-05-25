import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { DmsAuditController } from './audit/dms-audit.controller';
import { DmsAuditRepository } from './audit/dms-audit.repository';
import { DmsAuditService } from './audit/dms-audit.service';
import { DmsDashboardController } from './dashboard/dms-dashboard.controller';
import { DmsDashboardRepository } from './dashboard/dms-dashboard.repository';
import { DmsDashboardService } from './dashboard/dms-dashboard.service';
import { DmsFolderController } from './folder/dms-folder.controller';
import { DmsFolderRepository } from './folder/dms-folder.repository';
import { DmsFolderService } from './folder/dms-folder.service';
import { DmsReportController } from './report/dms-report.controller';
import { DmsReportRepository } from './report/dms-report.repository';
import { DmsReportService } from './report/dms-report.service';
import { DmsStorageService } from './storage/dms-storage.service';
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
    DmsFolderController,
  ],
  providers: [
    DmsRepository,
    DmsService,
    DmsStorageService,
    DmsDashboardRepository,
    DmsDashboardService,
    DmsReportRepository,
    DmsReportService,
    DmsAuditRepository,
    DmsAuditService,
    DmsFolderRepository,
    DmsFolderService,
  ],
  exports: [
    DmsRepository,
    DmsService,
    DmsStorageService,
    DmsDashboardRepository,
    DmsDashboardService,
    DmsReportRepository,
    DmsReportService,
    DmsAuditRepository,
    DmsAuditService,
    DmsFolderRepository,
    DmsFolderService,
  ],
})
export class DmsModule {}
