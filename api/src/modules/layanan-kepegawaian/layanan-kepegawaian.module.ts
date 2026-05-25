import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OpdSubmissionModule } from '../opd-submission/opd-submission.module';
import { PrismaModule } from '../prisma/prisma.module';
import {
  AdminLayananSopConfigController,
  InternalLayananKepegawaianController,
  LayananKepegawaianController,
  LayananSopConfigController,
} from './layanan-kepegawaian.controller';
import { LayananSopConfigRepository } from './layanan-sop-config.repository';

@Module({
  imports: [AuthModule, OpdSubmissionModule, PrismaModule],
  controllers: [
    LayananSopConfigController,
    AdminLayananSopConfigController,
    LayananKepegawaianController,
    InternalLayananKepegawaianController,
  ],
  providers: [LayananSopConfigRepository],
})
export class LayananKepegawaianModule {}
