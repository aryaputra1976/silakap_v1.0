import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { HealthController } from './health/health.controller';
import { NotificationsModule } from './notifications/notifications.module';
import { SiapModule } from './siap/siap.module';
import { SiapWorklogModule } from './siap-worklog/siap-worklog.module';
import { SiarsipModule } from './siarsip/siarsip.module';
import { SidataModule } from './sidata/sidata.module';
import { SipensiunModule } from './sipensiun/sipensiun.module';
import { SlaModule } from './sla/sla.module';
import { PrismaModule } from './prisma/prisma.module';
import { DmsModule } from './dms/dms.module';
import { KinerjaBidangModule } from './kinerja-bidang/kinerja-bidang.module';
import { KinerjaRhkCandidateModule } from './kinerja-rhk-candidate/kinerja-rhk-candidate.module';
import { KinerjaRhkRealizationModule } from './kinerja-rhk-realization/kinerja-rhk-realization.module';
import { KinerjaExecutiveReportModule } from './kinerja-executive-report/kinerja-executive-report.module';
import { SopChecklistModule } from './sop-checklist/sop-checklist.module';
import { SopGovernanceModule } from './sop-governance/sop-governance.module';
import { SopAnalyticsModule } from './sop-analytics/sop-analytics.module';
import { SopReportsModule } from './sop-reports/sop-reports.module';
import { OpdSubmissionModule } from './opd-submission/opd-submission.module';
import { WorkingCalendarModule } from './working-calendar/working-calendar.module';
import { ReconciliationBpkadModule } from './reconciliation-bpkad/reconciliation-bpkad.module';
import { AdminModule } from './admin/admin.module';
import { IkmModule } from './ikm/ikm.module';
import { SiformenModule } from './siformen/siformen.module';
import { AsnMonthlyArchiveModule } from './asn-monthly-archive/asn-monthly-archive.module';
import { RefGajiPokokModule } from './ref-gaji-pokok/ref-gaji-pokok.module';
import { PemberhentianModule } from './pemberhentian/pemberhentian.module';
import { LayananKepegawaianModule } from './layanan-kepegawaian/layanan-kepegawaian.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      name: 'default',
      ttl: 60_000,
      limit: 120,
    }]),
    PrismaModule,
    AnalyticsModule,
    AuthModule,
    EventsModule,
    NotificationsModule,
    SidataModule,
    SiapModule,
    SiapWorklogModule,
    SipensiunModule,
    SiarsipModule,
    SlaModule,
    DmsModule,
    KinerjaBidangModule,
    KinerjaRhkCandidateModule,
    KinerjaRhkRealizationModule,
    KinerjaExecutiveReportModule,
    SopChecklistModule,
    SopGovernanceModule,
    SopAnalyticsModule,
    SopReportsModule,
    OpdSubmissionModule,
    WorkingCalendarModule,
    ReconciliationBpkadModule,
    AdminModule,
    IkmModule,
    SiformenModule,
    AsnMonthlyArchiveModule,
    RefGajiPokokModule,
    PemberhentianModule,
    LayananKepegawaianModule,
  ],
  controllers: [
    HealthController,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    
  }
}
