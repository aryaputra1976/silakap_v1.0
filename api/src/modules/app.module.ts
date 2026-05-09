import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics/analytics.controller';
import { HealthController } from './health/health.controller';
import { SiapController } from './siap/siap.controller';
import { SiarsipController } from './siarsip/siarsip.controller';
import { SidataController } from './sidata/sidata.controller';
import { SipensiunController } from './sipensiun/sipensiun.controller';

@Module({
  controllers: [
    HealthController,
    SidataController,
    SiapController,
    SipensiunController,
    SiarsipController,
    AnalyticsController,
  ],
})
export class AppModule {}
