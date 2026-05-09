import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SidataController } from './sidata.controller';
import { SidataRepository } from './sidata.repository';
import { SidataService } from './sidata.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [SidataController],
  providers: [SidataRepository, SidataService],
})
export class SidataModule {}
