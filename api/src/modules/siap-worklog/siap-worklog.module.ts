import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { EventsModule } from '../events/events.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SiapWorklogController } from './siap-worklog.controller';
import { SiapWorklogRepository } from './siap-worklog.repository';
import { SiapWorklogService } from './siap-worklog.service';

@Module({
  imports: [AuthModule, PrismaModule, EventsModule, AuditModule],
  controllers: [SiapWorklogController],
  providers: [SiapWorklogRepository, SiapWorklogService],
  exports: [SiapWorklogRepository, SiapWorklogService],
})
export class SiapWorklogModule {}
