import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { SopChecklistController } from './sop-checklist.controller';
import { SopChecklistService } from './sop-checklist.service';
import { SopChecklistRepository } from './sop-checklist.repository';

@Module({
  imports: [AuthModule, PrismaModule, AuditModule],
  controllers: [SopChecklistController],
  providers: [SopChecklistService, SopChecklistRepository],
  exports: [SopChecklistService],
})
export class SopChecklistModule {}
