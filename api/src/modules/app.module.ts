import { Module } from '@nestjs/common';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health/health.controller';
import { SiapModule } from './siap/siap.module';
import { SiarsipModule } from './siarsip/siarsip.module';
import { SidataModule } from './sidata/sidata.module';
import { SipensiunModule } from './sipensiun/sipensiun.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    AnalyticsModule,
    AuthModule,
    SidataModule,
    SiapModule,
    SipensiunModule,
    SiarsipModule,
  ],
  controllers: [
    HealthController,
  ],
})
export class AppModule {}
