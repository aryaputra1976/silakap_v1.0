import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SopAnalyticsController } from './sop-analytics.controller';
import { SopAnalyticsService } from './sop-analytics.service';
import { SopAnalyticsRepository } from './sop-analytics.repository';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [SopAnalyticsController],
  providers: [SopAnalyticsService, SopAnalyticsRepository],
})
export class SopAnalyticsModule {}
