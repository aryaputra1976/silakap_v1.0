import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AsnMonthlyArchiveController } from './asn-monthly-archive.controller';
import { AsnMonthlyArchiveRepository } from './asn-monthly-archive.repository';
import { AsnMonthlyArchiveService } from './asn-monthly-archive.service';

@Module({
  imports: [PrismaModule],
  controllers: [AsnMonthlyArchiveController],
  providers: [AsnMonthlyArchiveService, AsnMonthlyArchiveRepository],
  exports: [AsnMonthlyArchiveService],
})
export class AsnMonthlyArchiveModule {}
