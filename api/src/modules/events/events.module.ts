import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EventBusService } from './event-bus.service';
import { EventWorkerService } from './event-worker.service';
import { EventsController } from './events.controller';
import { EventsRepository } from './events.repository';
import { EventsService } from './events.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [EventsController],
  providers: [
    EventsRepository,
    EventsService,
    EventBusService,
    EventWorkerService,
  ],
  exports: [EventBusService, EventsService],
})
export class EventsModule {}