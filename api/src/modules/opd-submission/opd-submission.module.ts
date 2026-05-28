import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { DmsModule } from '../dms/dms.module';
import { KinerjaRhkCandidateModule } from '../kinerja-rhk-candidate/kinerja-rhk-candidate.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SiapModule } from '../siap/siap.module';
import { WorkingCalendarModule } from '../working-calendar/working-calendar.module';
import {
  InternalOpdSubmissionController,
  OpdSubmissionController,
} from './opd-submission.controller';
import { OpdSubmissionRepository } from './opd-submission.repository';
import { OpdSubmissionService } from './opd-submission.service';

@Module({
  imports: [AuthModule, PrismaModule, AuditModule, DmsModule, KinerjaRhkCandidateModule, WorkingCalendarModule, SiapModule],
  controllers: [OpdSubmissionController, InternalOpdSubmissionController],
  providers: [OpdSubmissionRepository, OpdSubmissionService],
  exports: [OpdSubmissionRepository, OpdSubmissionService],
})
export class OpdSubmissionModule {}
