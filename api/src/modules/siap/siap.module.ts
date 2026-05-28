import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { EventsModule } from '../events/events.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SiapController } from './siap.controller';
import { SiapRepository } from './siap.repository';
import { SiapService } from './siap.service';
import { SiapAssignmentService } from './services/siap-assignment.service';
import { SiapTaskRepository } from './services/siap-task.repository';

@Module({
  imports: [AuditModule, AuthModule, PrismaModule, EventsModule],
  controllers: [SiapController],
  providers: [
    SiapRepository,
    SiapTaskRepository,
    SiapAssignmentService,
    SiapService,
  ],
  exports: [
    SiapRepository,
    SiapTaskRepository,
    SiapAssignmentService,
    SiapService,
  ],
})
export class SiapModule {}