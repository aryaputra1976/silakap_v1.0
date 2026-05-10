import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { EventsModule } from '../events/events.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SiapController } from './siap.controller';
import { SiapRepository } from './siap.repository';
import { SiapService } from './siap.service';

@Module({
  imports: [AuditModule, AuthModule, PrismaModule, EventsModule],
  controllers: [SiapController],
  providers: [SiapRepository, SiapService],
  exports: [SiapRepository, SiapService],
})
export class SiapModule {}
