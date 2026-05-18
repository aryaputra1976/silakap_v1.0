import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { KinerjaRhkRealizationModule } from '../kinerja-rhk-realization/kinerja-rhk-realization.module';
import { PrismaModule } from '../prisma/prisma.module';
import { KinerjaRhkCandidateController } from './kinerja-rhk-candidate.controller';
import { KinerjaRhkCandidateRepository } from './kinerja-rhk-candidate.repository';
import { KinerjaRhkCandidateService } from './kinerja-rhk-candidate.service';

@Module({
  imports: [AuthModule, PrismaModule, forwardRef(() => KinerjaRhkRealizationModule)],
  controllers: [KinerjaRhkCandidateController],
  providers: [KinerjaRhkCandidateRepository, KinerjaRhkCandidateService],
  exports: [KinerjaRhkCandidateRepository, KinerjaRhkCandidateService],
})
export class KinerjaRhkCandidateModule {}
