import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SopChecklistInstance, SopChecklistItem, SopChecklistAuditLog } from '@prisma/client';
import { CreateInstanceDto } from './dto/create-instance.dto';
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';
import { ListInstancesQueryDto } from './dto/list-instances-query.dto';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

export type InstanceWithItems = SopChecklistInstance & { items: SopChecklistItem[] };

// ─── Dashboard shapes ────────────────────────────────────────────────────────

export interface DashboardSummary {
  totalInstances: number;
  totalItems: number;
  completedItems: number;
  approved: number;
  rejected: number;
  inReview: number;
  draft: number;
  averageProgress: number;
  pendingItems: number;
  perluPerbaikanItems: number;
  byModule: Array<{ moduleKey: string; total: number; approved: number; averageProgress: number }>;
  bySop: Array<{
    sopCode: string;
    moduleKey: string;
    total: number;
    approved: number;
    rejected: number;
    inReview: number;
    draft: number;
    averageProgress: number;
    lastUpdatedAt: string | null;
  }>;
  byStatus: Array<{ status: string; count: number }>;
}

export interface DashboardBySopRow {
  sopCode: string;
  moduleKey: string;
  total: number;
  approved: number;
  rejected: number;
  inReview: number;
  draft: number;
  averageProgress: number;
  lastUpdatedAt: string | null;
}

export interface DashboardActivity {
  id: string;
  instanceId: string;
  sopCode: string;
  moduleKey: string;
  entityType: string;
  entityId: string;
  action: string;
  actorId: string | null;
  fromStatus: string | null;
  toStatus: string | null;
  notes: string | null;
  createdAt: string;
}

export interface RhkProgressRow {
  sopCode: string;
  moduleKey: string;
  checklistTotal: number;
  checklistApproved: number;
  checklistProgress: number;
  rhkCodes: string[];
  targetQuantity: number | null;
  realizationQuantity: number;
  evidenceCount: number;
}

@Injectable()
export class SopChecklistRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async findInstances(query: ListInstancesQueryDto): Promise<SopChecklistInstance[]> {
    return this.prisma.sopChecklistInstance.findMany({
      where: {
        ...(query.sopCode ? { sopCode: query.sopCode } : {}),
        ...(query.moduleKey ? { moduleKey: query.moduleKey } : {}),
        ...(query.entityType ? { entityType: query.entityType } : {}),
        ...(query.entityId ? { entityId: query.entityId } : {}),
        ...(query.status ? { status: query.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findInstanceById(id: string): Promise<InstanceWithItems | null> {
    return this.prisma.sopChecklistInstance.findUnique({
      where: { id },
      include: { items: true },
    });
  }

  async findInstanceBySopAndEntity(
    sopCode: string,
    entityType: string,
    entityId: string,
  ): Promise<InstanceWithItems | null> {
    return this.prisma.sopChecklistInstance.findFirst({
      where: { sopCode, entityType, entityId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createInstance(
    dto: CreateInstanceDto,
    totalItems: number,
    createdById: string,
  ): Promise<InstanceWithItems> {
    return this.prisma.sopChecklistInstance.create({
      data: {
        sopCode: dto.sopCode,
        moduleKey: dto.moduleKey,
        entityType: dto.entityType,
        entityId: dto.entityId,
        totalItems,
        createdById,
        updatedById: createdById,
      },
      include: { items: true },
    });
  }

  async upsertItem(
    instanceId: string,
    dto: UpdateChecklistItemDto,
    updatedById: string,
  ): Promise<SopChecklistItem> {
    return this.prisma.sopChecklistItem.upsert({
      where: { instanceId_itemId: { instanceId, itemId: dto.itemId } },
      create: {
        instanceId,
        itemId: dto.itemId,
        status: dto.status,
        notes: dto.notes,
        dmsDocumentId: dto.dmsDocumentId,
        updatedById,
      },
      update: {
        status: dto.status,
        notes: dto.notes,
        dmsDocumentId: dto.dmsDocumentId,
        updatedById,
      },
    });
  }

  async updateInstanceProgress(
    instanceId: string,
    completedItems: number,
    totalItems: number,
    status: string,
    updatedById: string,
  ): Promise<SopChecklistInstance> {
    const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    return this.prisma.sopChecklistInstance.update({
      where: { id: instanceId },
      data: { completedItems, totalItems, progress, status, updatedById },
    });
  }

  async approveRejectInstance(
    instanceId: string,
    action: 'APPROVED' | 'REJECTED',
    actorId: string,
    approvalNote?: string,
  ): Promise<SopChecklistInstance> {
    const now = new Date();
    return this.prisma.sopChecklistInstance.update({
      where: { id: instanceId },
      data: {
        status: action,
        approvalNote: approvalNote ?? null,
        approvedById: action === 'APPROVED' ? actorId : null,
        approvedAt: action === 'APPROVED' ? now : null,
        rejectedById: action === 'REJECTED' ? actorId : null,
        rejectedAt: action === 'REJECTED' ? now : null,
        updatedById: actorId,
      },
    });
  }

  async createAuditLog(
    instanceId: string,
    actorId: string,
    action: string,
    extra?: {
      itemId?: string;
      fromStatus?: string;
      toStatus?: string;
      notes?: string;
    },
  ): Promise<SopChecklistAuditLog> {
    return this.prisma.sopChecklistAuditLog.create({
      data: {
        instanceId,
        actorId,
        action,
        itemId: extra?.itemId,
        fromStatus: extra?.fromStatus,
        toStatus: extra?.toStatus,
        notes: extra?.notes,
      },
    });
  }

  async findAuditLogs(instanceId: string): Promise<SopChecklistAuditLog[]> {
    return this.prisma.sopChecklistAuditLog.findMany({
      where: { instanceId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ─── Dashboard aggregates ────────────────────────────────────────────────────

  private buildInstanceWhere(q: DashboardQueryDto) {
    const where: Record<string, unknown> = {};
    if (q.moduleKey) where['moduleKey'] = q.moduleKey;
    if (q.sopCode) where['sopCode'] = q.sopCode;
    if (q.status) where['status'] = q.status;
    if (q.entityType) where['entityType'] = q.entityType;
    const createdAt: Record<string, Date> = {};
    if (q.from) createdAt['gte'] = new Date(q.from);
    if (q.to) createdAt['lte'] = new Date(q.to);
    if (Object.keys(createdAt).length) where['createdAt'] = createdAt;
    return where;
  }

  async getDashboardSummary(q: DashboardQueryDto): Promise<DashboardSummary> {
    const where = this.buildInstanceWhere(q);

    const [agg, groupedByStatus, groupedByModule, groupedBySop, itemAgg] = await Promise.all([
      this.prisma.sopChecklistInstance.aggregate({
        where,
        _count: { id: true },
        _avg: { progress: true },
        _sum: { completedItems: true, totalItems: true },
      }),
      this.prisma.sopChecklistInstance.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
      this.prisma.sopChecklistInstance.groupBy({
        by: ['moduleKey'],
        where,
        _count: { id: true },
        _avg: { progress: true },
      }),
      this.prisma.sopChecklistInstance.groupBy({
        by: ['sopCode', 'moduleKey'],
        where,
        _count: { id: true },
        _avg: { progress: true },
        _max: { updatedAt: true },
      }),
      this.prisma.sopChecklistItem.aggregate({
        where: {
          instance: { is: where },
          status: 'PERLU_PERBAIKAN',
        },
        _count: { id: true },
      }),
    ]);

    const countByStatus = (s: string) =>
      groupedByStatus.find((g) => g.status === s)?._count.id ?? 0;

    const bySop: DashboardSummary['bySop'] = [];
    for (const g of groupedBySop) {
      const statusRows = await this.prisma.sopChecklistInstance.groupBy({
        by: ['status'],
        where: { ...where, sopCode: g.sopCode, moduleKey: g.moduleKey },
        _count: { id: true },
      });
      const cs = (s: string) => statusRows.find((r) => r.status === s)?._count.id ?? 0;
      bySop.push({
        sopCode: g.sopCode,
        moduleKey: g.moduleKey,
        total: g._count.id,
        approved: cs('APPROVED'),
        rejected: cs('REJECTED'),
        inReview: cs('IN_REVIEW'),
        draft: cs('DRAFT'),
        averageProgress: Math.round(g._avg.progress ?? 0),
        lastUpdatedAt: g._max.updatedAt?.toISOString() ?? null,
      });
    }

    const approvedByModule = await this.prisma.sopChecklistInstance.groupBy({
      by: ['moduleKey'],
      where: { ...where, status: 'APPROVED' },
      _count: { id: true },
    });

    const byModule = groupedByModule.map((g) => ({
      moduleKey: g.moduleKey,
      total: g._count.id,
      approved: approvedByModule.find((a) => a.moduleKey === g.moduleKey)?._count.id ?? 0,
      averageProgress: Math.round(g._avg.progress ?? 0),
    }));

    return {
      totalInstances: agg._count.id,
      totalItems: agg._sum.totalItems ?? 0,
      completedItems: agg._sum.completedItems ?? 0,
      approved: countByStatus('APPROVED'),
      rejected: countByStatus('REJECTED'),
      inReview: countByStatus('IN_REVIEW'),
      draft: countByStatus('DRAFT'),
      averageProgress: Math.round(agg._avg.progress ?? 0),
      pendingItems: (agg._sum.totalItems ?? 0) - (agg._sum.completedItems ?? 0),
      perluPerbaikanItems: itemAgg._count.id,
      byModule,
      bySop,
      byStatus: groupedByStatus.map((g) => ({ status: g.status, count: g._count.id })),
    };
  }

  async getDashboardBySop(q: DashboardQueryDto): Promise<DashboardBySopRow[]> {
    const summary = await this.getDashboardSummary(q);
    return summary.bySop;
  }

  async getRecentActivities(limit = 20): Promise<DashboardActivity[]> {
    const logs = await this.prisma.sopChecklistAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { instance: true },
    });

    return logs.map((log) => ({
      id: log.id,
      instanceId: log.instanceId,
      sopCode: log.instance.sopCode,
      moduleKey: log.instance.moduleKey,
      entityType: log.instance.entityType,
      entityId: log.instance.entityId,
      action: log.action,
      actorId: log.actorId,
      fromStatus: log.fromStatus,
      toStatus: log.toStatus,
      notes: log.notes,
      createdAt: log.createdAt.toISOString(),
    }));
  }

  async getRhkProgress(q: DashboardQueryDto): Promise<RhkProgressRow[]> {
    const where = this.buildInstanceWhere(q);

    const grouped = await this.prisma.sopChecklistInstance.groupBy({
      by: ['sopCode', 'moduleKey'],
      where,
      _count: { id: true },
      _avg: { progress: true },
    });

    const approvedGrouped = await this.prisma.sopChecklistInstance.groupBy({
      by: ['sopCode'],
      where: { ...where, status: 'APPROVED' },
      _count: { id: true },
    });

    const sopCodes = grouped.map((g) => g.sopCode);

    const kinerjaSops = await this.prisma.kinerjaBidangSop.findMany({
      where: { code: { in: sopCodes } },
      include: {
        rhkMappings: true,
        targets: { where: { year: new Date().getFullYear() } },
        realizations: {
          where: { year: new Date().getFullYear() },
          include: { evidence: true },
        },
      },
    });

    return grouped.map((g) => {
      const kb = kinerjaSops.find((k) => k.code === g.sopCode);
      const rhkCodes = kb?.rhkMappings.map((r) => r.rhkCode) ?? [];
      const targetQty = kb?.targets.reduce((sum, t) => sum + t.targetQuantity, 0) ?? null;
      const realizationQty = kb?.realizations.reduce((sum, r) => sum + r.realizationQuantity, 0) ?? 0;
      const evidenceCount = kb?.realizations.reduce((sum, r) => sum + r.evidence.length, 0) ?? 0;
      const approved = approvedGrouped.find((a) => a.sopCode === g.sopCode)?._count.id ?? 0;

      return {
        sopCode: g.sopCode,
        moduleKey: g.moduleKey,
        checklistTotal: g._count.id,
        checklistApproved: approved,
        checklistProgress: Math.round(g._avg.progress ?? 0),
        rhkCodes,
        targetQuantity: targetQty && targetQty > 0 ? targetQty : null,
        realizationQuantity: realizationQty,
        evidenceCount,
      };
    });
  }
}
