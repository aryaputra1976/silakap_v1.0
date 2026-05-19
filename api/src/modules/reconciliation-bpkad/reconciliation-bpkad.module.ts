import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ReconciliationBpkadController } from './reconciliation-bpkad.controller';
import { ReconciliationBpkadRepository } from './reconciliation-bpkad.repository';
import { ReconciliationBpkadService } from './reconciliation-bpkad.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [ReconciliationBpkadController],
  providers: [ReconciliationBpkadRepository, ReconciliationBpkadService],
  exports: [ReconciliationBpkadRepository, ReconciliationBpkadService],
})
export class ReconciliationBpkadModule {}
