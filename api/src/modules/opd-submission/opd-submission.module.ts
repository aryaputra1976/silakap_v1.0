import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import {
  InternalOpdSubmissionController,
  OpdSubmissionController,
} from './opd-submission.controller';
import { OpdSubmissionRepository } from './opd-submission.repository';
import { OpdSubmissionService } from './opd-submission.service';

@Module({
  imports: [AuthModule, PrismaModule, AuditModule],
  controllers: [OpdSubmissionController, InternalOpdSubmissionController],
  providers: [OpdSubmissionRepository, OpdSubmissionService],
  exports: [OpdSubmissionRepository, OpdSubmissionService],
})
export class OpdSubmissionModule {}
