Phase 9C — SLA Escalation Automation kita buat di backend dulu.

Target:

SLA dueAt lewat
↓
task ASSIGNED / IN_PROGRESS / WAITING / RETURNED
↓
task menjadi OVERDUE
↓
sla_tracking menjadi OVERDUE
↓
timeline entry dibuat
↓
workflow log dibuat
↓
notification event dipublish ke ADMIN_BKPSDM / KABID / assigned user
↓
EventWorker memproses menjadi notification

SiapRepository saat ini sudah punya updateTask, createWorkflowLog, createTimelineEntry, dan createSlaTracking, tapi belum ada query khusus untuk mencari task/SLA overdue.

1. Update repository
api/src/modules/siap/siap.repository.ts

Tambahkan import enum:

import { Prisma, SlaStatus, TaskStatus } from '@prisma/client';

Ganti import lama:

import { Prisma } from '@prisma/client';

menjadi:

import { Prisma, SlaStatus, TaskStatus } from '@prisma/client';

Lalu tambahkan type ini setelah export type SiapTaskRecord...:

const overdueSlaInclude = {
  case: {
    select: {
      id: true,
      caseNumber: true,
      serviceType: true,
      title: true,
      currentState: true,
      status: true,
    },
  },
  task: {
    include: taskInclude,
  },
} satisfies Prisma.SlaTrackingInclude;

export type OverdueSlaRecord = Prisma.SlaTrackingGetPayload<{
  include: typeof overdueSlaInclude;
}>;

Tambahkan method ini di dalam class SiapRepository:

  async findOverdueSlaCandidates(
    now: Date,
    limit: number,
  ): Promise<OverdueSlaRecord[]> {
    return this.prisma.slaTracking.findMany({
      where: {
        status: {
          in: [SlaStatus.ON_TRACK, SlaStatus.WARNING],
        },
        completedAt: null,
        dueAt: {
          lt: now,
        },
        taskId: {
          not: null,
        },
        task: {
          deletedAt: null,
          status: {
            in: [
              TaskStatus.ASSIGNED,
              TaskStatus.IN_PROGRESS,
              TaskStatus.WAITING,
              TaskStatus.RETURNED,
            ],
          },
        },
        case: {
          deletedAt: null,
        },
      },
      include: overdueSlaInclude,
      orderBy: [{ dueAt: 'asc' }],
      take: limit,
    });
  }

  async markSlaOverdue(
    id: string,
    client: SiapDbClient = this.prisma,
  ) {
    return client.slaTracking.update({
      where: { id },
      data: {
        status: SlaStatus.OVERDUE,
      },
    });
  }
2. Buat folder/module SLA
api/src/modules/sla/sla-escalation.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { EventBusService } from '../events/event-bus.service';
import {
  OverdueSlaRecord,
  SiapRepository,
} from '../siap/siap.repository';

const DEFAULT_OVERDUE_LIMIT = 100;

@Injectable()
export class SlaEscalationService {
  private readonly logger = new Logger(SlaEscalationService.name);

  constructor(
    @Inject(SiapRepository)
    private readonly siapRepository: SiapRepository,
    @Inject(EventBusService)
    private readonly eventBusService: EventBusService,
  ) {}

  async processOverdue(limit = DEFAULT_OVERDUE_LIMIT) {
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
        await this.escalateOne(item, now);
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

  private async escalateOne(item: OverdueSlaRecord, now: Date) {
    if (!item.task) {
      return;
    }

    await this.siapRepository.withTransaction(async (client) => {
      await this.siapRepository.markSlaOverdue(item.id, client);

      if (item.task?.status !== TaskStatus.OVERDUE) {
        await this.siapRepository.updateTask(
          item.task.id,
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
          note: `SLA melewati batas waktu pada task ${item.task.title}`,
          performedBy: null,
          performedAt: now,
        },
        client,
      );

      await this.siapRepository.createTimelineEntry(
        {
          caseId: item.caseId,
          taskId: item.task.id,
          eventType: 'SLA_OVERDUE',
          title: 'SLA melewati batas waktu',
          description: `${item.task.title} melewati batas waktu penyelesaian`,
          performedBy: null,
          createdAt: now,
        },
        client,
      );
    });

    await this.eventBusService.publishNotification({
      type: 'SLA_OVERDUE',
      title: 'SLA task melewati batas waktu',
      body: `${item.case.caseNumber} - ${item.task.title} melewati batas waktu`,
      caseId: item.caseId,
      actionUrl: '/siap/tasks',
      recipientUserIds: item.task.assignedTo ? [item.task.assignedTo] : [],
      recipientRoleCodes: ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID'],
      createdBy: undefined,
      metadata: {
        slaId: item.id,
        taskId: item.task.id,
        taskType: item.task.taskType,
        dueAt: item.dueAt.toISOString(),
        caseNumber: item.case.caseNumber,
        serviceType: item.case.serviceType,
      },
    });
  }
}
api/src/modules/sla/sla-worker.service.ts
import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { SlaEscalationService } from './sla-escalation.service';

const DEFAULT_INTERVAL_MS = 60_000;

@Injectable()
export class SlaWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SlaWorkerService.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    @Inject(SlaEscalationService)
    private readonly slaEscalationService: SlaEscalationService,
  ) {}

  onModuleInit() {
    if (process.env.SLA_WORKER_ENABLED === 'false') {
      this.logger.warn('SLA worker disabled by SLA_WORKER_ENABLED=false');
      return;
    }

    const intervalMs = this.getIntervalMs();

    this.timer = setInterval(() => {
      void this.process();
    }, intervalMs);

    void this.process();

    this.logger.log(`SLA worker started. interval=${intervalMs}ms`);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async process() {
    if (this.running) {
      return;
    }

    this.running = true;

    try {
      const result = await this.slaEscalationService.processOverdue();

      if (result.escalated > 0 || result.failed > 0) {
        this.logger.log(
          `SLA escalation result: total=${result.total}, escalated=${result.escalated}, failed=${result.failed}`,
        );
      }
    } finally {
      this.running = false;
    }
  }

  private getIntervalMs() {
    const value = Number(process.env.SLA_WORKER_INTERVAL_MS);

    if (!Number.isFinite(value)) {
      return DEFAULT_INTERVAL_MS;
    }

    return Math.min(Math.max(Math.trunc(value), 10_000), 600_000);
  }
}
api/src/modules/sla/sla.controller.ts
import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ok } from '../shared/respond';
import { SlaEscalationService } from './sla-escalation.service';

type ProcessOverdueBody = {
  limit?: number;
};

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN_BKPSDM')
@Controller('api/v1/sla')
export class SlaController {
  constructor(
    @Inject(SlaEscalationService)
    private readonly slaEscalationService: SlaEscalationService,
  ) {}

  @Post('process-overdue')
  async processOverdue(@Body() body: ProcessOverdueBody) {
    const result = await this.slaEscalationService.processOverdue(
      body.limit ?? 100,
    );

    return ok(result, 'SLA overdue berhasil diproses');
  }
}
api/src/modules/sla/sla.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EventsModule } from '../events/events.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SiapModule } from '../siap/siap.module';
import { SlaController } from './sla.controller';
import { SlaEscalationService } from './sla-escalation.service';
import { SlaWorkerService } from './sla-worker.service';

@Module({
  imports: [AuthModule, PrismaModule, SiapModule, EventsModule],
  controllers: [SlaController],
  providers: [SlaEscalationService, SlaWorkerService],
  exports: [SlaEscalationService],
})
export class SlaModule {}
3. Update app.module.ts
api/src/modules/app.module.ts

Tambahkan import:

import { SlaModule } from './sla/sla.module';

Tambahkan ke imports:

SlaModule,

Contoh:

@Module({
  imports: [
    PrismaModule,
    AnalyticsModule,
    AuthModule,
    EventsModule,
    NotificationsModule,
    SidataModule,
    SiapModule,
    SipensiunModule,
    SiarsipModule,
    SlaModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
4. Perhatian: potensi circular dependency

Karena SlaModule import SiapModule, dan SiapModule sudah import EventsModule, ini masih aman. Tapi kalau build nanti error circular dependency, ganti pendekatan menjadi SlaModule langsung pakai repository provider sendiri. Untuk sekarang pola ini paling bersih karena SiapModule memang export SiapRepository.

5. Build
cd D:\Silakap_V1.0\api

npm run build
npm run dev

Log yang diharapkan:

Event worker started. interval=30000ms
SLA worker started. interval=60000ms

Untuk dev bisa tambah .env:

SLA_WORKER_ENABLED=true
SLA_WORKER_INTERVAL_MS=15000
6. Smoke test manual endpoint

Login:

$login = Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:3000/api/v1/auth/login `
  -ContentType "application/json" `
  -Body '{"username":"admin","password":"admin123"}'

$token = $login.data.accessToken

Jalankan SLA processor manual:

Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:3000/api/v1/sla/process-overdue `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body '{"limit":100}'

Cek notifikasi setelah event worker memproses:

Invoke-RestMethod `
  -Uri http://localhost:3000/api/v1/notifications `
  -Headers @{ Authorization = "Bearer $token" }
7. Smoke test paksa data overdue lokal

Kalau tidak ada task overdue, hasil processor akan:

total=0
escalated=0
failed=0

Untuk test lokal saja, buat salah satu task aktif menjadi overdue via Prisma Studio atau SQL.

Contoh SQL lokal:

UPDATE siap_tasks
SET status = 'ASSIGNED'
WHERE deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 1;

UPDATE sla_tracking
SET status = 'ON_TRACK',
    due_at = DATE_SUB(NOW(), INTERVAL 1 DAY),
    completed_at = NULL
WHERE task_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 1;

Lalu jalankan:

Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:3000/api/v1/sla/process-overdue `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body '{"limit":100}'

Expected:

total: 1
escalated: 1
failed: 0

Setelah itu cek task:

Invoke-RestMethod `
  -Uri http://localhost:3000/api/v1/siap/tasks `
  -Headers @{ Authorization = "Bearer $token" }

Task harus menjadi:

OVERDUE