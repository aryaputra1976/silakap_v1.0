import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { EventsModule } from '../events/events.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SiarsipModule } from '../siarsip/siarsip.module';
import { SiapWorklogDashboardController } from './siap-worklog-dashboard.controller';
import { SiapWorklogDashboardRepository } from './siap-worklog-dashboard.repository';
import { SiapWorklogDashboardService } from './siap-worklog-dashboard.service';
import { SiapWorklogExportController } from './siap-worklog-export.controller';
import { SiapWorklogExportService } from './siap-worklog-export.service';
import { SiapWorklogController } from './siap-worklog.controller';
import { SiapWorklogRepository } from './siap-worklog.repository';
import { SiapWorklogService } from './siap-worklog.service';

@Module({
  imports: [AuthModule, PrismaModule, EventsModule, AuditModule, SiarsipModule],
  controllers: [
    SiapWorklogController,
    SiapWorklogDashboardController,
    SiapWorklogExportController,
  ],
  providers: [
    SiapWorklogRepository,
    SiapWorklogService,
    SiapWorklogDashboardRepository,
    SiapWorklogDashboardService,
    SiapWorklogExportService,
  ],
  exports: [
    SiapWorklogRepository,
    SiapWorklogService,
    SiapWorklogDashboardRepository,
    SiapWorklogDashboardService,
    SiapWorklogExportService,
  ],
})
export class SiapWorklogModule {}