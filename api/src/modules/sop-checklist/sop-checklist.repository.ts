import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SopChecklistInstance, SopChecklistItem, SopChecklistAuditLog } from '@prisma/client';
import { CreateInstanceDto } from './dto/create-instance.dto';
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';
import { ListInstancesQueryDto } from './dto/list-instances-query.dto';

export type InstanceWithItems = SopChecklistInstance & { items: SopChecklistItem[] };

@Injectable()
export class SopChecklistRepository {
  constructor(private readonly prisma: PrismaService) {}

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
}
