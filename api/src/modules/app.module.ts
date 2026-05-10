import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics/analytics.controller';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health/health.controller';
import { SiapModule } from './siap/siap.module';
import { SiarsipController } from './siarsip/siarsip.controller';
import { SidataModule } from './sidata/sidata.module';
import { SipensiunController } from './sipensiun/sipensiun.controller';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, AuthModule, SidataModule, SiapModule],
  controllers: [
    HealthController,
    SipensiunController,
    SiarsipController,
    AnalyticsController,
  ],
})
export class AppModule {}
