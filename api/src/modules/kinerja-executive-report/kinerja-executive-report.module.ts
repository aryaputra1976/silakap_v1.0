import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { KinerjaRhkRealizationModule } from '../kinerja-rhk-realization/kinerja-rhk-realization.module';
import { PrismaModule } from '../prisma/prisma.module';
import { KinerjaExecutiveReportController } from './kinerja-executive-report.controller';
import { KinerjaExecutiveReportRepository } from './kinerja-executive-report.repository';
import { KinerjaExecutiveReportService } from './kinerja-executive-report.service';

@Module({
  imports: [AuthModule, PrismaModule, AuditModule, KinerjaRhkRealizationModule],
  controllers: [KinerjaExecutiveReportController],
  providers: [KinerjaExecutiveReportRepository, KinerjaExecutiveReportService],
})
export class KinerjaExecutiveReportModule {}
