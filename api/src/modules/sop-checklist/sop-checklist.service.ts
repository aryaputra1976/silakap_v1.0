import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SopChecklistRepository, InstanceWithItems } from './sop-checklist.repository';
import { CreateInstanceDto } from './dto/create-instance.dto';
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';
import { ApproveRejectDto } from './dto/approve-reject.dto';
import { ListInstancesQueryDto } from './dto/list-instances-query.dto';
import { AuditService } from '../audit/audit.service';

// Roles that can approve/reject — mirrors frontend canApproveChecklist
const APPROVER_ROLES = new Set([
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
  'ANALIS_MADYA',
]);

// Roles that cannot view internal checklists (OPD)
const BLOCKED_VIEW_ROLES = new Set(['OPD']);

// Roles that cannot approve/reject
const BLOCKED_APPROVE_ROLES = new Set(['OPD', 'PPPK']);

// SOP → required item count for progress calculation
// These are the template sizes from frontend checklist-templates.ts
const SOP_ITEM_COUNTS: Record<string, number> = {
  'SOP-BKPSDM-PAN-002': 10,
  'SOP-BKPSDM-LAY-001': 7,
  'SOP-BKPSDM-LAY-002': 6,
  'SOP-BKPSDM-DAT-002': 8,
  'SOP-BKPSDM-DMS-001': 8,
};

function getTotalItems(sopCode: string): number {
  return SOP_ITEM_COUNTS[sopCode] ?? 0;
}

function countCompleted(items: { status: string }[]): number {
  return items.filter((i) => i.status === 'TERPENUHI' || i.status === 'TIDAK_RELEVAN').length;
}

function deriveStatus(
  completedItems: number,
  totalItems: number,
  currentStatus: string,
): string {
  if (currentStatus === 'APPROVED' || currentStatus === 'REJECTED') return currentStatus;
  if (totalItems === 0) return 'DRAFT';
  if (completedItems >= totalItems) return 'IN_REVIEW';
  return 'DRAFT';
}

@Injectable()
export class SopChecklistService {
  constructor(
    private readonly repo: SopChecklistRepository,
    private readonly auditService: AuditService,
  ) {}

  async listInstances(query: ListInstancesQueryDto, userRoles: string[]) {
    if (userRoles.some((r) => BLOCKED_VIEW_ROLES.has(r))) {
      return [];
    }
    return this.repo.findInstances(query);
  }

  async getOrCreateInstance(
    dto: CreateInstanceDto,
    userId: string,
    userRoles: string[],
  ): Promise<InstanceWithItems> {
    if (userRoles.some((r) => BLOCKED_VIEW_ROLES.has(r))) {
      throw new ForbiddenException('Role tidak memiliki akses checklist ini');
    }

    const existing = await this.repo.findInstanceBySopAndEntity(
      dto.sopCode,
      dto.entityType,
      dto.entityId,
    );
    if (existing) return existing;

    const totalItems = getTotalItems(dto.sopCode);
    const instance = await this.repo.createInstance(dto, totalItems, userId);
    await this.repo.createAuditLog(instance.id, userId, 'CREATED');
    return instance;
  }

  async getInstanceById(id: string, userRoles: string[]): Promise<InstanceWithItems> {
    if (userRoles.some((r) => BLOCKED_VIEW_ROLES.has(r))) {
      throw new ForbiddenException('Role tidak memiliki akses checklist ini');
    }
    const instance = await this.repo.findInstanceById(id);
    if (!instance) throw new NotFoundException(`Checklist instance ${id} tidak ditemukan`);
    return instance;
  }

  async updateItem(
    instanceId: string,
    dto: UpdateChecklistItemDto,
    userId: string,
    userRoles: string[],
  ): Promise<InstanceWithItems> {
    if (userRoles.some((r) => BLOCKED_VIEW_ROLES.has(r))) {
      throw new ForbiddenException('Role tidak memiliki akses checklist ini');
    }

    const instance = await this.repo.findInstanceById(instanceId);
    if (!instance) throw new NotFoundException(`Checklist instance ${instanceId} tidak ditemukan`);

    if (instance.status === 'APPROVED' || instance.status === 'REJECTED') {
      throw new BadRequestException('Checklist yang sudah disetujui/ditolak tidak dapat diubah');
    }

    const prevItem = instance.items.find((i) => i.itemId === dto.itemId);
    const prevStatus = prevItem?.status ?? 'PENDING';

    await this.repo.upsertItem(instanceId, dto, userId);
    await this.repo.createAuditLog(instanceId, userId, 'ITEM_UPDATED', {
      itemId: dto.itemId,
      fromStatus: prevStatus,
      toStatus: dto.status,
      notes: dto.notes,
    });

    // Reload items after upsert to recalculate progress
    const updated = await this.repo.findInstanceById(instanceId);
    if (!updated) throw new NotFoundException(`Checklist instance ${instanceId} tidak ditemukan`);

    const completedItems = countCompleted(updated.items);
    const totalItems = updated.totalItems || getTotalItems(instance.sopCode);
    const newStatus = deriveStatus(completedItems, totalItems, updated.status);

    await this.repo.updateInstanceProgress(instanceId, completedItems, totalItems, newStatus, userId);
    await this.auditService.record({
      entityType: 'SopChecklistInstance',
      entityId: instanceId,
      action: 'UPDATE_ITEM',
      performedBy: userId,
      afterData: { itemId: dto.itemId, status: dto.status },
    });

    const final = await this.repo.findInstanceById(instanceId);
    return final!;
  }

  async approveReject(
    instanceId: string,
    dto: ApproveRejectDto,
    userId: string,
    userRoles: string[],
  ): Promise<InstanceWithItems> {
    if (userRoles.some((r) => BLOCKED_APPROVE_ROLES.has(r))) {
      throw new ForbiddenException('Role tidak memiliki wewenang untuk menyetujui checklist');
    }
    if (!userRoles.some((r) => APPROVER_ROLES.has(r))) {
      throw new ForbiddenException('Role tidak memiliki wewenang untuk menyetujui checklist');
    }

    const instance = await this.repo.findInstanceById(instanceId);
    if (!instance) throw new NotFoundException(`Checklist instance ${instanceId} tidak ditemukan`);

    if (instance.status === 'APPROVED' || instance.status === 'REJECTED') {
      throw new BadRequestException('Checklist sudah dalam status final');
    }

    if (dto.action === 'APPROVED' && instance.status !== 'IN_REVIEW') {
      throw new BadRequestException('Checklist belum selesai diisi sebelum dapat disetujui');
    }

    await this.repo.approveRejectInstance(instanceId, dto.action, userId, dto.approvalNote);
    await this.repo.createAuditLog(instanceId, userId, dto.action, {
      notes: dto.approvalNote,
    });
    await this.auditService.record({
      entityType: 'SopChecklistInstance',
      entityId: instanceId,
      action: dto.action,
      performedBy: userId,
      afterData: { approvalNote: dto.approvalNote },
    });

    const final = await this.repo.findInstanceById(instanceId);
    return final!;
  }

  async getAuditLogs(instanceId: string, userRoles: string[]) {
    if (userRoles.some((r) => BLOCKED_VIEW_ROLES.has(r))) {
      throw new ForbiddenException('Role tidak memiliki akses log ini');
    }
    const instance = await this.repo.findInstanceById(instanceId);
    if (!instance) throw new NotFoundException(`Checklist instance ${instanceId} tidak ditemukan`);
    return this.repo.findAuditLogs(instanceId);
  }
}
