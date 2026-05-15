import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EventsModule } from '../events/events.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SidataImportController } from './sidata-import.controller';
import { SidataImportRepository } from './sidata-import.repository';
import { SidataImportService } from './sidata-import.service';
import { SidataReferenceController } from './sidata-reference.controller';
import { SidataReferenceRepository } from './sidata-reference.repository';
import { SidataReferenceService } from './sidata-reference.service';
import { SidataController } from './sidata.controller';
import { SidataRepository } from './sidata.repository';
import { SidataService } from './sidata.service';

@Module({
  imports: [AuthModule, PrismaModule, EventsModule],
  controllers: [SidataController, SidataReferenceController, SidataImportController],
  providers: [
    SidataRepository,
    SidataService,
    SidataReferenceRepository,
    SidataReferenceService,
    SidataImportRepository,
    SidataImportService,
  ],
  exports: [SidataRepository, SidataService, SidataReferenceRepository, SidataReferenceService],
})
export class SidataModule {}
