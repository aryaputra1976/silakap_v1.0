import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DomainEventRecord, EventsRepository } from './events.repository';
import { NotificationEventPayload } from './events.types';

const DEFAULT_INTERVAL_MS = 30_000;
const DEFAULT_BATCH_LIMIT = 50;

@Injectable()
export class EventWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventWorkerService.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    @Inject(EventsRepository)
    private readonly eventsRepository: EventsRepository,
  ) {}

  onModuleInit() {
    if (process.env.EVENT_WORKER_ENABLED === 'false') {
      this.logger.warn('Event worker disabled by EVENT_WORKER_ENABLED=false');
      return;
    }

    const intervalMs = this.getIntervalMs();

    this.timer = setInterval(() => {
      void this.processPending();
    }, intervalMs);

    void this.processPending();

    this.logger.log(`Event worker started. interval=${intervalMs}ms`);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async processPending() {
    if (this.running) {
      return;
    }

    this.running = true;

    try {
      const events = await this.eventsRepository.findPending(
        DEFAULT_BATCH_LIMIT,
      );

      for (const event of events) {
        await this.processEventSafely(event);
      }
    } finally {
      this.running = false;
    }
  }

  private async processEventSafely(event: DomainEventRecord) {
    try {
      await this.processOne(event);
      await this.eventsRepository.markProcessed(event.id);
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : 'Gagal memproses event';

      await this.eventsRepository.markFailed(event.id, message);
      this.logger.error(`Event ${event.id} failed: ${message}`);
    }
  }

  private async processOne(event: DomainEventRecord) {
    if (event.eventType !== 'NOTIFICATION_REQUESTED') {
      return;
    }

    const payload = this.parseNotificationPayload(event.payload);

    const recipientIds = new Set<string>();

    for (const userId of payload.recipientUserIds ?? []) {
      recipientIds.add(userId);
    }

    const roleCodes = payload.recipientRoleCodes ?? [];
    const usersByRole = await this.eventsRepository.findUsersByRoleCodes(
      roleCodes,
    );

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
        createdBy: payload.createdBy,
      }));

    await this.eventsRepository.createNotifications(notifications);
  }

  private parseNotificationPayload(payload: unknown): NotificationEventPayload {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Payload event tidak valid');
    }

    const candidate = payload as NotificationEventPayload;

    if (!candidate.type || !candidate.title) {
      throw new Error('Payload notifikasi tidak lengkap');
    }

    const hasUserRecipients =
      Array.isArray(candidate.recipientUserIds) &&
      candidate.recipientUserIds.length > 0;

    const hasRoleRecipients =
      Array.isArray(candidate.recipientRoleCodes) &&
      candidate.recipientRoleCodes.length > 0;

    if (!hasUserRecipients && !hasRoleRecipients) {
      throw new Error('Penerima notifikasi belum ditentukan');
    }

    return candidate;
  }

  private getIntervalMs() {
    const value = Number(process.env.EVENT_WORKER_INTERVAL_MS);

    if (!Number.isFinite(value)) {
      return DEFAULT_INTERVAL_MS;
    }

    return Math.min(Math.max(Math.trunc(value), 5_000), 300_000);
  }
}
