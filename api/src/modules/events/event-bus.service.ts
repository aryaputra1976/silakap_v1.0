import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EventsRepository } from './events.repository';
import { NotificationEventPayload } from './events.types';

@Injectable()
export class EventBusService {
  constructor(
    @Inject(EventsRepository)
    private readonly eventsRepository: EventsRepository,
  ) {}

  async publishNotification(payload: NotificationEventPayload) {
    return this.eventsRepository.publish({
      eventType: 'NOTIFICATION_REQUESTED',
      entityType: payload.caseId ? 'SIAP_CASE' : 'SYSTEM',
      entityId: payload.caseId ?? 'SYSTEM',
      payload: payload as Prisma.InputJsonValue,
      status: 'PENDING',
    });
  }
}
