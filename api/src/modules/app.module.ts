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
import { SopChecklistModule } from './sop-checklist/sop-checklist.module';
import { SopGovernanceModule } from './sop-governance/sop-governance.module';

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
    SopChecklistModule,
    SopGovernanceModule,
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
