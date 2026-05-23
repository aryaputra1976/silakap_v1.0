import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { KinerjaRhkRealizationController } from './kinerja-rhk-realization.controller';
import { KinerjaRhkRealizationRepository } from './kinerja-rhk-realization.repository';
import { KinerjaRhkRealizationService } from './kinerja-rhk-realization.service';

@Module({
  imports: [AuthModule, PrismaModule, AuditModule],
  controllers: [KinerjaRhkRealizationController],
  providers: [KinerjaRhkRealizationRepository, KinerjaRhkRealizationService],
  exports: [KinerjaRhkRealizationRepository, KinerjaRhkRealizationService],
})
export class KinerjaRhkRealizationModule {}
