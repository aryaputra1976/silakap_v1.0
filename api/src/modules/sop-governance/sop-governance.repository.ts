import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { GovernanceListQueryDto } from './dto/governance-list-query.dto';
import type { CreateGovernanceRecordDto } from './dto/create-governance-record.dto';
import type { UpdateGovernanceRecordDto } from './dto/update-governance-record.dto';

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
