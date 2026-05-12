import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { DmsController } from './dms.controller';
import { DmsRepository } from './dms.repository';
import { DmsService } from './dms.service';

@Module({
  imports: [AuthModule, PrismaModule, AuditModule],
  controllers: [DmsController],
  providers: [DmsRepository, DmsService],
  exports: [DmsRepository, DmsService],
})
export class DmsModule {}