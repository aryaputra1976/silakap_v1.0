import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { EventsModule } from '../events/events.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SiapModule } from '../siap/siap.module';
import { SlaController } from './sla.controller';
import { SlaEscalationService } from './sla-escalation.service';
import { SlaWorkerService } from './sla-worker.service';

@Module({
  imports: [AuditModule, AuthModule, PrismaModule, SiapModule, EventsModule],
  controllers: [SlaController],
  providers: [SlaEscalationService, SlaWorkerService],
  exports: [SlaEscalationService],
})
export class SlaModule {}
