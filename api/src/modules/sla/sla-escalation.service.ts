import { Inject, Injectable, Logger } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { AuditContext, AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/auth.types';
import { EventBusService } from '../events/event-bus.service';
import { OverdueSlaRecord, SiapRepository } from '../siap/siap.repository';

const DEFAULT_OVERDUE_LIMIT = 100;

@Injectable()
export class SlaEscalationService {
  private readonly logger = new Logger(SlaEscalationService.name);

  constructor(
    @Inject(SiapRepository)
    private readonly siapRepository: SiapRepository,
    @Inject(EventBusService)
    private readonly eventBusService: EventBusService,
    @Inject(AuditService)
    private readonly auditService: AuditService,
  ) {}

  async processOverdue(
    limit = DEFAULT_OVERDUE_LIMIT,
    actor?: AuthUser,
    context?: AuditContext,
  ) {
    const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 500);
    const now = new Date();
    const candidates = await this.siapRepository.findOverdueSlaCandidates(
      now,
      safeLimit,
    );

    let escalated = 0;
    let failed = 0;

    for (const item of candidates) {
      try {
        await this.escalateOne(item, now, actor, context);
        escalated += 1;
      } catch (caught) {
        failed += 1;
        const message =
          caught instanceof Error ? caught.message : 'Gagal eskalasi SLA';
        this.logger.error(`SLA ${item.id} escalation failed: ${message}`);
      }
    }

    return {
      total: candidates.length,
      escalated,
      failed,
    };
  }

  private async escalateOne(
    item: OverdueSlaRecord,
    now: Date,
    actor?: AuthUser,
    context?: AuditContext,
  ) {
    if (!item.task) {
      return;
    }

    const task = item.task;

    await this.siapRepository.withTransaction(async (client) => {
      await this.siapRepository.markSlaOverdue(item.id, client);

      if (task.status !== TaskStatus.OVERDUE) {
        await this.siapRepository.updateTask(
          task.id,
          {
            status: TaskStatus.OVERDUE,
            updatedBy: 'system',
          },
          client,
        );
      }

      await this.siapRepository.createWorkflowLog(
        {
          caseId: item.caseId,
          fromState: item.case.currentState,
          toState: item.case.currentState,
          action: 'SLA_OVERDUE',
          note: `SLA melewati batas waktu pada task ${task.title}`,
          performedBy: null,
          performedAt: now,
        },
        client,
      );

      await this.siapRepository.createTimelineEntry(
        {
          caseId: item.caseId,
          taskId: task.id,
          eventType: 'SLA_OVERDUE',
          title: 'SLA melewati batas waktu',
          description: `${task.title} melewati batas waktu penyelesaian`,
          performedBy: null,
          createdAt: now,
        },
        client,
      );
    });

    await this.eventBusService.publishNotification({
      type: 'SLA_OVERDUE',
      title: 'SLA task melewati batas waktu',
      body: `${item.case.caseNumber} - ${task.title} melewati batas waktu`,
      caseId: item.caseId,
      actionUrl: '/siap/tasks',
      recipientUserIds: task.assignedTo ? [task.assignedTo] : [],
      recipientRoleCodes: ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID'],
      createdBy: undefined,
      metadata: {
        slaId: item.id,
        taskId: task.id,
        taskType: task.taskType,
        dueAt: item.dueAt.toISOString(),
        caseNumber: item.case.caseNumber,
        serviceType: item.case.serviceType,
      },
    });

    await this.auditService.record({
      entityType: 'SLA_TRACKING',
      entityId: item.id,
      action: 'SLA_ESCALATED_OVERDUE',
      performedBy: actor?.id ?? null,
      beforeData: {
        status: item.status,
        taskStatus: task.status,
      },
      afterData: {
        status: 'OVERDUE',
        taskStatus: 'OVERDUE',
        caseId: item.caseId,
        taskId: task.id,
        dueAt: item.dueAt.toISOString(),
        triggeredBy: actor ? 'MANUAL' : 'WORKER',
      },
      context,
    });
  }
}
