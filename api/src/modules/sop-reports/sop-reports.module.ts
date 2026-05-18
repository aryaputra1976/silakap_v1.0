import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SopReportsController } from './sop-reports.controller';
import { SopReportsService } from './sop-reports.service';
import { SopReportsRepository } from './sop-reports.repository';

@Module({
  imports: [AuthModule, AuditModule, PrismaModule],
  controllers: [SopReportsController],
  providers: [SopReportsService, SopReportsRepository],
})
export class SopReportsModule {}
