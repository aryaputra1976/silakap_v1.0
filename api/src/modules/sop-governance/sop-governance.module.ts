import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SopGovernanceController } from './sop-governance.controller';
import { SopGovernanceService } from './sop-governance.service';
import { SopGovernanceRepository } from './sop-governance.repository';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [SopGovernanceController],
  providers: [SopGovernanceService, SopGovernanceRepository],
  exports: [SopGovernanceService],
})
export class SopGovernanceModule {}
