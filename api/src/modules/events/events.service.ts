import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthUser } from '../auth/auth.types';
import { DomainEventRecord, EventsRepository } from './events.repository';
import { NotificationEventPayload } from './events.types';

@Injectable()
export class EventsService {
  constructor(
    @Inject(EventsRepository)
    private readonly eventsRepository: EventsRepository,
  ) {}

  async processPending(limit = 50, user: AuthUser) {
    const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 200);
    const events = await this.eventsRepository.findPending(safeLimit);

    let processed = 0;
    let failed = 0;

    for (const event of events) {
      try {
        await this.processOne(event, user);
        await this.eventsRepository.markProcessed(event.id);
        processed += 1;
      } catch (caught) {
        const message =
          caught instanceof Error ? caught.message : 'Gagal memproses event';
        await this.eventsRepository.markFailed(event.id, message);
        failed += 1;
      }
    }

    return {
      total: events.length,
      processed,
      failed,
    };
  }

  private async processOne(event: DomainEventRecord, user: AuthUser) {
    if (event.eventType !== 'NOTIFICATION_REQUESTED') {
      return;
    }

    const payload = this.parseNotificationPayload(event.payload);

    const recipientIds = new Set<string>();

    for (const userId of payload.recipientUserIds ?? []) {
      recipientIds.add(userId);
    }

    const roleCodes = payload.recipientRoleCodes ?? [];
    const usersByRole =
      await this.eventsRepository.findUsersByRoleCodes(roleCodes);

    for (const roleUser of usersByRole) {
      recipientIds.add(roleUser.id);
    }

    const notifications: Prisma.NotificationUncheckedCreateInput[] =
      Array.from(recipientIds).map((userId) => ({
        userId,
        caseId: payload.caseId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        actionUrl: payload.actionUrl,
        metadata: payload.metadata as Prisma.InputJsonValue | undefined,
        createdBy: payload.createdBy ?? user.id,
      }));

    await this.eventsRepository.createNotifications(notifications);
  }

  private parseNotificationPayload(payload: unknown): NotificationEventPayload {
    if (!payload || typeof payload !== 'object') {
      throw new BadRequestException('Payload event tidak valid');
    }

    const candidate = payload as NotificationEventPayload;

    if (!candidate.type || !candidate.title) {
      throw new BadRequestException('Payload notifikasi tidak lengkap');
    }

    if (
      (!candidate.recipientUserIds ||
        candidate.recipientUserIds.length === 0) &&
      (!candidate.recipientRoleCodes ||
        candidate.recipientRoleCodes.length === 0)
    ) {
      throw new BadRequestException('Penerima notifikasi belum ditentukan');
    }

    return candidate;
  }
}
