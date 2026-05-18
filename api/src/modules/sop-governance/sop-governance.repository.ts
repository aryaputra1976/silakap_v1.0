import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { GovernanceListQueryDto } from './dto/governance-list-query.dto';
import type { CreateGovernanceRecordDto } from './dto/create-governance-record.dto';
import type { UpdateGovernanceRecordDto } from './dto/update-governance-record.dto';
import type { CreateReminderDto } from './dto/create-reminder.dto';

// ─── Exported types ────────────────────────────────────────────────────────────

export interface GovernanceChangeLogRow {
  id: string;
  governanceId: string;
  action: string;
  beforeJson: Record<string, unknown> | null;
  afterJson: Record<string, unknown> | null;
  actorId: string | null;
  actorRole: string | null;
  note: string | null;
  createdAt: Date;
  sopCode?: string;
  title?: string;
}

export interface GovernanceSummaryByModule {
  moduleKey: string;
  total: number;
  active: number;
}

export interface GovernanceSummary {
  total: number;
  active: number;
  draft: number;
  needsReview: number;
  revision: number;
  archived: number;
  dueIn30Days: number;
  overdueReview: number;
  byModule: GovernanceSummaryByModule[];
  recentChanges: GovernanceChangeLogRow[];
}

// ─── Review workflow types ────────────────────────────────────────────────────

export interface ReviewQueueItem {
  id: string;
  sopCode: string;
  title: string;
  moduleKey: string;
  version: string;
  status: string;
  isCurrent: boolean;
  reviewDueDate: Date | null;
  effectiveDate: Date | null;
}

export interface ReviewQueue {
  dueSoon: ReviewQueueItem[];
  overdue: ReviewQueueItem[];
  needsReview: ReviewQueueItem[];
  inRevision: ReviewQueueItem[];
  recentReviewActions: GovernanceChangeLogRow[];
}

// ─── Repository ────────────────────────────────────────────────────────────────

@Injectable()
export class SopGovernanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private buildWhere(q: GovernanceListQueryDto) {
    return {
      ...(q.moduleKey ? { moduleKey: q.moduleKey } : {}),
      ...(q.status ? { status: q.status } : {}),
      ...(q.sopCode ? { sopCode: q.sopCode } : {}),
    };
  }

  // ── Queries ──────────────────────────────────────────────────────────────────

  findMany(q: GovernanceListQueryDto) {
    return this.prisma.sopGovernanceRecord.findMany({
      where: this.buildWhere(q),
      orderBy: [{ isCurrent: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  findById(id: string) {
    return this.prisma.sopGovernanceRecord.findUnique({ where: { id } });
  }

  findDueReview(q: GovernanceListQueryDto) {
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return this.prisma.sopGovernanceRecord.findMany({
      where: {
        ...this.buildWhere(q),
        reviewDueDate: { lte: in30 },
        status: { not: 'ARCHIVED' },
      },
      orderBy: { reviewDueDate: 'asc' },
    });
  }

  // ── Mutations ────────────────────────────────────────────────────────────────

  async create(
    dto: CreateGovernanceRecordDto,
    actorId: string | null,
    actorRole: string | null,
  ) {
    const record = await this.prisma.sopGovernanceRecord.create({
      data: {
        sopCode: dto.sopCode,
        title: dto.title,
        moduleKey: dto.moduleKey,
        version: dto.version,
        status: dto.status ?? 'DRAFT',
        effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : null,
        reviewDueDate: dto.reviewDueDate ? new Date(dto.reviewDueDate) : null,
        dmsDocumentId: dto.dmsDocumentId ?? null,
        ownerRole: dto.ownerRole ?? null,
        notes: dto.notes ?? null,
        createdById: actorId,
        updatedById: actorId,
      },
    });

    await this.writeChangeLog(record.id, 'CREATED', null, record, actorId, actorRole, null);
    return record;
  }

  async update(
    id: string,
    dto: UpdateGovernanceRecordDto,
    actorId: string | null,
    actorRole: string | null,
  ) {
    const before = await this.prisma.sopGovernanceRecord.findUniqueOrThrow({ where: { id } });

    const record = await this.prisma.sopGovernanceRecord.update({
      where: { id },
      data: {
        ...(dto.sopCode !== undefined ? { sopCode: dto.sopCode } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.moduleKey !== undefined ? { moduleKey: dto.moduleKey } : {}),
        ...(dto.version !== undefined ? { version: dto.version } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.effectiveDate !== undefined ? { effectiveDate: new Date(dto.effectiveDate) } : {}),
        ...(dto.reviewDueDate !== undefined ? { reviewDueDate: new Date(dto.reviewDueDate) } : {}),
        ...(dto.dmsDocumentId !== undefined ? { dmsDocumentId: dto.dmsDocumentId } : {}),
        ...(dto.ownerRole !== undefined ? { ownerRole: dto.ownerRole } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        updatedById: actorId,
      },
    });

    await this.writeChangeLog(record.id, 'UPDATED', before, record, actorId, actorRole, null);
    return record;
  }

  async changeStatus(
    id: string,
    newStatus: string,
    actorId: string | null,
    actorRole: string | null,
    note: string | null,
    extra?: { approvedById?: string; approvedAt?: Date },
  ) {
    const before = await this.prisma.sopGovernanceRecord.findUniqueOrThrow({ where: { id } });

    const data: Record<string, unknown> = {
      status: newStatus,
      updatedById: actorId,
    };

    if (newStatus === 'ACTIVE') {
      data.isCurrent = true;
      if (extra?.approvedById) data.approvedById = extra.approvedById;
      if (extra?.approvedAt) data.approvedAt = extra.approvedAt;
      // Demote other ACTIVE records with same sopCode to isCurrent=false
      await this.prisma.sopGovernanceRecord.updateMany({
        where: { sopCode: before.sopCode, isCurrent: true, id: { not: id } },
        data: { isCurrent: false },
      });
    } else if (newStatus === 'ARCHIVED') {
      data.isCurrent = false;
    }

    const record = await this.prisma.sopGovernanceRecord.update({
      where: { id },
      data,
    });

    const action =
      newStatus === 'ACTIVE'
        ? 'ACTIVATED'
        : newStatus === 'ARCHIVED'
          ? 'ARCHIVED'
          : newStatus === 'NEEDS_REVIEW'
            ? 'MARKED_REVIEW'
            : newStatus === 'REVISION'
              ? 'SET_REVISION'
              : 'STATUS_CHANGED';

    await this.writeChangeLog(record.id, action, before, record, actorId, actorRole, note);
    return record;
  }

  // ── Summary ──────────────────────────────────────────────────────────────────

  async getSummary(q: GovernanceListQueryDto): Promise<GovernanceSummary> {
    const baseWhere = this.buildWhere(q);
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [total, active, draft, needsReview, revision, archived, dueIn30Days, overdueReview, byModuleRaw, recentChangesRaw] =
      await Promise.all([
        this.prisma.sopGovernanceRecord.count({ where: baseWhere }),
        this.prisma.sopGovernanceRecord.count({ where: { ...baseWhere, status: 'ACTIVE' } }),
        this.prisma.sopGovernanceRecord.count({ where: { ...baseWhere, status: 'DRAFT' } }),
        this.prisma.sopGovernanceRecord.count({ where: { ...baseWhere, status: 'NEEDS_REVIEW' } }),
        this.prisma.sopGovernanceRecord.count({ where: { ...baseWhere, status: 'REVISION' } }),
        this.prisma.sopGovernanceRecord.count({ where: { ...baseWhere, status: 'ARCHIVED' } }),
        this.prisma.sopGovernanceRecord.count({
          where: { ...baseWhere, reviewDueDate: { lte: in30 }, status: { not: 'ARCHIVED' } },
        }),
        this.prisma.sopGovernanceRecord.count({
          where: { ...baseWhere, reviewDueDate: { lt: now }, status: { not: 'ARCHIVED' } },
        }),
        this.prisma.sopGovernanceRecord.groupBy({
          by: ['moduleKey'],
          where: baseWhere,
          _count: { id: true },
        }),
        this.prisma.sopGovernanceChangeLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { record: { select: { sopCode: true, title: true } } },
        }),
      ]);

    const activeByModule = await this.prisma.sopGovernanceRecord.groupBy({
      by: ['moduleKey'],
      where: { ...baseWhere, status: 'ACTIVE' },
      _count: { id: true },
    });

    const activeMap = new Map(activeByModule.map((r) => [r.moduleKey, r._count.id]));

    const byModule: GovernanceSummaryByModule[] = byModuleRaw.map((r) => ({
      moduleKey: r.moduleKey,
      total: r._count.id,
      active: activeMap.get(r.moduleKey) ?? 0,
    }));

    const recentChanges: GovernanceChangeLogRow[] = recentChangesRaw.map((log) => ({
      id: log.id,
      governanceId: log.governanceId,
      action: log.action,
      beforeJson: log.beforeJson as Record<string, unknown> | null,
      afterJson: log.afterJson as Record<string, unknown> | null,
      actorId: log.actorId,
      actorRole: log.actorRole,
      note: log.note,
      createdAt: log.createdAt,
      sopCode: log.record.sopCode,
      title: log.record.title,
    }));

    return { total, active, draft, needsReview, revision, archived, dueIn30Days, overdueReview, byModule, recentChanges };
  }

  // ── Change logs ──────────────────────────────────────────────────────────────

  async getChangeLogs(governanceId: string | undefined, limit: number): Promise<GovernanceChangeLogRow[]> {
    const logs = await this.prisma.sopGovernanceChangeLog.findMany({
      where: governanceId ? { governanceId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { record: { select: { sopCode: true, title: true } } },
    });

    return logs.map((log) => ({
      id: log.id,
      governanceId: log.governanceId,
      action: log.action,
      beforeJson: log.beforeJson as Record<string, unknown> | null,
      afterJson: log.afterJson as Record<string, unknown> | null,
      actorId: log.actorId,
      actorRole: log.actorRole,
      note: log.note,
      createdAt: log.createdAt,
      sopCode: log.record.sopCode,
      title: log.record.title,
    }));
  }

  // ── Review workflow ──────────────────────────────────────────────────────────

  async getReviewQueue(): Promise<ReviewQueue> {
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [dueSoon, overdue, needsReview, inRevision, recentRaw] = await Promise.all([
      this.prisma.sopGovernanceRecord.findMany({
        where: {
          reviewDueDate: { gte: now, lte: in30 },
          status: { notIn: ['ARCHIVED'] },
        },
        orderBy: { reviewDueDate: 'asc' },
      }),
      this.prisma.sopGovernanceRecord.findMany({
        where: {
          reviewDueDate: { lt: now },
          status: { notIn: ['ARCHIVED'] },
        },
        orderBy: { reviewDueDate: 'asc' },
      }),
      this.prisma.sopGovernanceRecord.findMany({
        where: { status: 'NEEDS_REVIEW' },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.sopGovernanceRecord.findMany({
        where: { status: 'REVISION' },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.sopGovernanceChangeLog.findMany({
        where: {
          action: {
            in: ['REVIEW_STARTED', 'REVIEW_COMPLETED', 'KEPT_ACTIVE', 'REVISION_REQUESTED'],
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { record: { select: { sopCode: true, title: true } } },
      }),
    ]);

    const mapRecord = (r: {
      id: string; sopCode: string; title: string; moduleKey: string;
      version: string; status: string; isCurrent: boolean;
      reviewDueDate: Date | null; effectiveDate: Date | null;
    }): ReviewQueueItem => ({
      id: r.id, sopCode: r.sopCode, title: r.title, moduleKey: r.moduleKey,
      version: r.version, status: r.status, isCurrent: r.isCurrent,
      reviewDueDate: r.reviewDueDate, effectiveDate: r.effectiveDate,
    });

    const recentReviewActions: GovernanceChangeLogRow[] = recentRaw.map((log) => ({
      id: log.id, governanceId: log.governanceId, action: log.action,
      beforeJson: log.beforeJson as Record<string, unknown> | null,
      afterJson: log.afterJson as Record<string, unknown> | null,
      actorId: log.actorId, actorRole: log.actorRole, note: log.note, createdAt: log.createdAt,
      sopCode: log.record.sopCode, title: log.record.title,
    }));

    return {
      dueSoon: dueSoon.map(mapRecord),
      overdue: overdue.map(mapRecord),
      needsReview: needsReview.map(mapRecord),
      inRevision: inRevision.map(mapRecord),
      recentReviewActions,
    };
  }

  async startReview(id: string, actorId: string | null, actorRole: string | null, note: string | null) {
    const before = await this.prisma.sopGovernanceRecord.findUniqueOrThrow({ where: { id } });
    const record = await this.prisma.sopGovernanceRecord.update({
      where: { id },
      data: { status: 'NEEDS_REVIEW', updatedById: actorId },
    });
    await this.writeChangeLog(record.id, 'REVIEW_STARTED', before, record, actorId, actorRole, note);
    return record;
  }

  async completeReview(
    id: string,
    decision: string,
    actorId: string | null,
    actorRole: string | null,
    note: string | null,
    newReviewDueDate: string | null,
  ) {
    const before = await this.prisma.sopGovernanceRecord.findUniqueOrThrow({ where: { id } });

    let newStatus = before.status;
    const extra: Record<string, unknown> = { updatedById: actorId };

    if (decision === 'KEEP_ACTIVE') {
      newStatus = 'ACTIVE';
      extra.isCurrent = true;
      if (newReviewDueDate) extra.reviewDueDate = new Date(newReviewDueDate);
      await this.prisma.sopGovernanceRecord.updateMany({
        where: { sopCode: before.sopCode, isCurrent: true, id: { not: id } },
        data: { isCurrent: false },
      });
    } else if (decision === 'REVISION_REQUIRED') {
      newStatus = 'REVISION';
    } else if (decision === 'ARCHIVED') {
      newStatus = 'ARCHIVED';
      extra.isCurrent = false;
    }

    const record = await this.prisma.sopGovernanceRecord.update({
      where: { id },
      data: { ...extra, status: newStatus },
    });
    await this.writeChangeLog(record.id, 'REVIEW_COMPLETED', before, record, actorId, actorRole, note);
    return record;
  }

  async keepActive(
    id: string,
    actorId: string | null,
    actorRole: string | null,
    note: string | null,
    newReviewDueDate: string | null,
  ) {
    const before = await this.prisma.sopGovernanceRecord.findUniqueOrThrow({ where: { id } });
    await this.prisma.sopGovernanceRecord.updateMany({
      where: { sopCode: before.sopCode, isCurrent: true, id: { not: id } },
      data: { isCurrent: false },
    });
    const record = await this.prisma.sopGovernanceRecord.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        isCurrent: true,
        ...(newReviewDueDate ? { reviewDueDate: new Date(newReviewDueDate) } : {}),
        updatedById: actorId,
      },
    });
    await this.writeChangeLog(record.id, 'KEPT_ACTIVE', before, record, actorId, actorRole, note);
    return record;
  }

  async requestRevision(id: string, actorId: string | null, actorRole: string | null, note: string | null) {
    const before = await this.prisma.sopGovernanceRecord.findUniqueOrThrow({ where: { id } });
    const record = await this.prisma.sopGovernanceRecord.update({
      where: { id },
      data: { status: 'REVISION', updatedById: actorId },
    });
    await this.writeChangeLog(record.id, 'REVISION_REQUESTED', before, record, actorId, actorRole, note);
    return record;
  }

  // ── Reminders ────────────────────────────────────────────────────────────────

  async createReminder(
    governanceId: string,
    dto: CreateReminderDto,
    actorId: string | null,
  ) {
    const record = await this.prisma.sopGovernanceRecord.findUniqueOrThrow({
      where: { id: governanceId },
    });
    return this.prisma.sopReviewReminder.create({
      data: {
        governanceId,
        sopCode: record.sopCode,
        title: record.title,
        moduleKey: record.moduleKey,
        reminderType: dto.reminderType,
        status: 'OPEN',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        sentToRole: dto.sentToRole ?? null,
        sentToUserId: dto.sentToUserId ?? null,
        message: dto.message ?? null,
        createdById: actorId,
      },
    });
  }

  getReminders(params: { governanceId?: string; status?: string; moduleKey?: string }) {
    return this.prisma.sopReviewReminder.findMany({
      where: {
        ...(params.governanceId ? { governanceId: params.governanceId } : {}),
        ...(params.status ? { status: params.status } : {}),
        ...(params.moduleKey ? { moduleKey: params.moduleKey } : {}),
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async resolveReminder(id: string, userId: string | null) {
    return this.prisma.sopReviewReminder.update({
      where: { id },
      data: { status: 'RESOLVED', resolvedById: userId, resolvedAt: new Date() },
    });
  }

  async dismissReminder(id: string, userId: string | null) {
    return this.prisma.sopReviewReminder.update({
      where: { id },
      data: { status: 'DISMISSED', resolvedById: userId, resolvedAt: new Date() },
    });
  }

  // ── Internal helpers ─────────────────────────────────────────────────────────

  private async writeChangeLog(
    governanceId: string,
    action: string,
    before: Record<string, unknown> | null,
    after: Record<string, unknown>,
    actorId: string | null,
    actorRole: string | null,
    note: string | null,
  ) {
    await this.prisma.sopGovernanceChangeLog.create({
      data: {
        governanceId,
        action,
        beforeJson: before !== null ? (before as Prisma.InputJsonValue) : Prisma.JsonNull,
        afterJson: after as Prisma.InputJsonValue,
        actorId,
        actorRole,
        note,
      },
    });
  }
}
