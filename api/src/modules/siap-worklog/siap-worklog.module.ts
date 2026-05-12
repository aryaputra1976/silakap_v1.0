import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { EventsModule } from '../events/events.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SiarsipModule } from '../siarsip/siarsip.module';
import { SiapWorklogDashboardController } from './siap-worklog-dashboard.controller';
import { SiapWorklogDashboardRepository } from './siap-worklog-dashboard.repository';
import { SiapWorklogDashboardService } from './siap-worklog-dashboard.service';
import { SiapWorklogController } from './siap-worklog.controller';
import { SiapWorklogRepository } from './siap-worklog.repository';
import { SiapWorklogService } from './siap-worklog.service';

@Module({
  imports: [AuthModule, PrismaModule, EventsModule, AuditModule, SiarsipModule],
  controllers: [SiapWorklogController, SiapWorklogDashboardController],
  providers: [
    SiapWorklogRepository,
    SiapWorklogService,
    SiapWorklogDashboardRepository,
    SiapWorklogDashboardService,
  ],
  exports: [
    SiapWorklogRepository,
    SiapWorklogService,
    SiapWorklogDashboardRepository,
    SiapWorklogDashboardService,
  ],
})
export class SiapWorklogModule {}
