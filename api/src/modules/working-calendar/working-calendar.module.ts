import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkingCalendarController } from './working-calendar.controller';
import { WorkingCalendarRepository } from './working-calendar.repository';
import { WorkingCalendarService } from './working-calendar.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [WorkingCalendarController],
  providers: [WorkingCalendarRepository, WorkingCalendarService],
  exports: [WorkingCalendarService],
})
export class WorkingCalendarModule {}
