import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SiarsipController } from './siarsip.controller';
import { SiarsipRepository } from './siarsip.repository';
import { SiarsipService } from './siarsip.service';

@Module({
  imports: [AuditModule, AuthModule, PrismaModule],
  controllers: [SiarsipController],
  providers: [SiarsipRepository, SiarsipService],
  exports: [SiarsipService],
})
export class SiarsipModule {}