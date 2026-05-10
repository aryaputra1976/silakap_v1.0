import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CasePriority,
  CaseStatus,
  SlaStatus,
  TaskPriority,
  TaskStatus,
} from '@prisma/client';
import { AuthUser } from '../auth/auth.types';
import { CaseListQueryDto } from './dto/case-list-query.dto';
import { CompleteTaskDto } from './dto/complete-task.dto';
import { CreateCaseDto } from './dto/create-case.dto';
import { TaskListQueryDto } from './dto/task-list-query.dto';
import {
  SiapCaseDetailRecord,
  SiapCaseListRecord,
  SiapRepository,
  SiapTaskRecord,
} from './siap.repository';
import { NormalizedCaseFilters, NormalizedTaskFilters } from './siap.types';

const SUBMITTED_STATE = 'SUBMITTED';
const DRAFT_STATE = 'DRAFT';
const FIRST_TASK_TYPE = 'VERIFIKASI_ADMIN';
const FIRST_TASK_SLA_DAYS = 3;

@Injectable()
export class SiapService {
  constructor(
    @Inject(SiapRepository)
    private readonly siapRepository: SiapRepository,
  ) {}

  async createCase(dto: CreateCaseDto, user: AuthUser) {
    const created = await this.siapRepository.createCase({
      caseNumber: this.createCaseNumber(dto.serviceType),
      serviceType: dto.serviceType.trim().toUpperCase(),
      title: dto.title.trim(),
      description: this.normalizeOptionalText(dto.description),
      asnId: this.normalizeOptionalText(dto.asnId),
      currentState: DRAFT_STATE,
      status: CaseStatus.DRAFT,
      priority: dto.priority ?? CasePriority.NORMAL,
      createdBy: user.id,
      updatedBy: user.id,
    });

    await this.siapRepository.createTimelineEntry({
      caseId: created.id,
      eventType: 'CASE_CREATED',
      title: 'Case dibuat',
      description: 'Case dibuat dalam status DRAFT',
      performedBy: user.id,
    });

    return this.toCaseListResponse(created);
  }

  async submitCase(id: string, user: AuthUser) {
    const existing = await this.siapRepository.findCaseById(id.trim());

    if (!existing) {
      throw new NotFoundException('Case tidak ditemukan');
    }

    if (existing.currentState !== DRAFT_STATE) {
      throw new BadRequestException('Hanya case DRAFT yang dapat disubmit');
    }

    const now = new Date();
    const dueAt = this.addDays(now, FIRST_TASK_SLA_DAYS);

    await this.siapRepository.updateCaseState(existing.id, {
      currentState: SUBMITTED_STATE,
      status: CaseStatus.ACTIVE,
      submittedAt: now,
      updatedBy: user.id,
    });

    await this.siapRepository.createWorkflowLog({
      caseId: existing.id,
      fromState: DRAFT_STATE,
      toState: SUBMITTED_STATE,
      action: 'SUBMIT',
      note: 'Case disubmit untuk verifikasi admin',
      performedBy: user.id,
      performedAt: now,
    });

    const task = await this.siapRepository.createTask({
      caseId: existing.id,
      taskType: FIRST_TASK_TYPE,
      title: 'Verifikasi administrasi berkas',
      description: 'Verifikasi awal kelengkapan data dan dokumen usulan',
      status: TaskStatus.ASSIGNED,
      priority: this.toTaskPriority(existing.priority),
      assignedTo: user.id,
      assignedBy: user.id,
      dueDate: dueAt,
      createdBy: user.id,
      updatedBy: user.id,
    });

    await this.siapRepository.createSlaTracking({
      caseId: existing.id,
      taskId: task.id,
      workflowState: SUBMITTED_STATE,
      startedAt: now,
      dueAt,
      status: SlaStatus.ON_TRACK,
    });

    await this.siapRepository.createTimelineEntry({
      caseId: existing.id,
      taskId: task.id,
      eventType: 'CASE_SUBMITTED',
      title: 'Case disubmit',
      description: 'Task verifikasi admin dibuat',
      performedBy: user.id,
      createdAt: now,
    });

    const submitted = await this.siapRepository.findCaseById(existing.id);
    return submitted ? this.toCaseDetailResponse(submitted) : null;
  }

  async findCases(query: CaseListQueryDto) {
    const filters = this.normalizeCaseFilters(query);
    const result = await this.siapRepository.findCases(filters);

    return {
      items: result.items.map((item) => this.toCaseListResponse(item)),
      page: filters.page,
      limit: filters.limit,
      total: result.total,
    };
  }

  async findCaseById(id: string) {
    const found = await this.siapRepository.findCaseById(id.trim());

    if (!found) {
      throw new NotFoundException('Case tidak ditemukan');
    }

    return this.toCaseDetailResponse(found);
  }

  async findTasks(query: TaskListQueryDto, user: AuthUser) {
    const filters = this.normalizeTaskFilters(query, user);
    const result = await this.siapRepository.findTasks(filters);

    return {
      items: result.items.map((item) => this.toTaskResponse(item)),
      page: filters.page,
      limit: filters.limit,
      total: result.total,
    };
  }

  async findTaskById(id: string, user: AuthUser) {
    const task = await this.getTaskForUser(id, user);
    return this.toTaskResponse(task);
  }

  async startTask(id: string, user: AuthUser) {
    const task = await this.getTaskForUser(id, user);

    if (task.status === TaskStatus.COMPLETED) {
      throw new BadRequestException('Task sudah selesai');
    }

    if (task.status === TaskStatus.CANCELLED) {
      throw new BadRequestException('Task sudah dibatalkan');
    }

    const now = new Date();
    const updated = await this.siapRepository.updateTask(task.id, {
      status: TaskStatus.IN_PROGRESS,
      startedAt: task.startedAt ?? now,
      updatedBy: user.id,
    });

    await this.siapRepository.createTimelineEntry({
      caseId: task.caseId,
      taskId: task.id,
      eventType: 'TASK_STARTED',
      title: 'Task mulai diproses',
      description: task.title,
      performedBy: user.id,
      createdAt: now,
    });

    return this.toTaskResponse(updated);
  }

  async completeTask(id: string, dto: CompleteTaskDto, user: AuthUser) {
    const task = await this.getTaskForUser(id, user);

    if (task.status === TaskStatus.COMPLETED) {
      throw new BadRequestException('Task sudah selesai');
    }

    const now = new Date();
    const updated = await this.siapRepository.updateTask(task.id, {
      status: TaskStatus.COMPLETED,
      startedAt: task.startedAt ?? now,
      completedAt: now,
      updatedBy: user.id,
    });

    await this.siapRepository.createWorkflowLog({
      caseId: task.caseId,
      fromState: task.case.currentState,
      toState: task.case.currentState,
      action: 'COMPLETE_TASK',
      note: this.normalizeOptionalText(dto.note) ?? `${task.taskType} selesai`,
      performedBy: user.id,
      performedAt: now,
    });

    await this.siapRepository.createTimelineEntry({
      caseId: task.caseId,
      taskId: task.id,
      eventType: 'TASK_COMPLETED',
      title: 'Task selesai',
      description: this.normalizeOptionalText(dto.note) ?? task.title,
      performedBy: user.id,
      createdAt: now,
    });

    return this.toTaskResponse(updated);
  }

  private async getTaskForUser(id: string, user: AuthUser) {
    const task = await this.siapRepository.findTaskById(id.trim());

    if (!task) {
      throw new NotFoundException('Task tidak ditemukan');
    }

    if (!this.canAccessTask(task, user)) {
      throw new NotFoundException('Task tidak ditemukan');
    }

    return task;
  }

  private canAccessTask(task: SiapTaskRecord, user: AuthUser) {
    if (this.canSeeAllTasks(user)) {
      return true;
    }

    return task.assignedTo === user.id;
  }

  private canSeeAllTasks(user: AuthUser) {
    return user.roles.some((role) =>
      ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID'].includes(role),
    );
  }

  private normalizeCaseFilters(query: CaseListQueryDto): NormalizedCaseFilters {
    return {
      q: this.normalizeOptionalText(query.q),
      serviceType: this.normalizeOptionalText(query.serviceType)?.toUpperCase(),
      currentState: this.normalizeOptionalText(query.currentState),
      status: query.status,
      page: this.normalizePositiveNumber(query.page, 1, 1, 10000),
      limit: this.normalizePositiveNumber(query.limit, 10, 1, 100),
    };
  }

  private normalizeTaskFilters(
    query: TaskListQueryDto,
    user: AuthUser,
  ): NormalizedTaskFilters {
    return {
      q: this.normalizeOptionalText(query.q),
      taskType: this.normalizeOptionalText(query.taskType),
      status: query.status,
      page: this.normalizePositiveNumber(query.page, 1, 1, 10000),
      limit: this.normalizePositiveNumber(query.limit, 10, 1, 100),
      assigneeId: this.canSeeAllTasks(user) ? undefined : user.id,
    };
  }

  private normalizeOptionalText(value: string | undefined) {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }

  private normalizePositiveNumber(
    value: string | undefined,
    defaultValue: number,
    min: number,
    max: number,
  ) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      return defaultValue;
    }

    return Math.min(Math.max(Math.trunc(parsed), min), max);
  }

  private createCaseNumber(serviceType: string) {
    const now = new Date();
    const date = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('');
    const time = String(now.getTime()).slice(-6);
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();

    return `${serviceType.trim().toUpperCase()}-${date}-${time}${random}`;
  }

  private addDays(date: Date, days: number) {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  }

  private toTaskPriority(priority: CasePriority): TaskPriority {
    return priority as unknown as TaskPriority;
  }

  private toCaseListResponse(record: SiapCaseListRecord) {
    return {
      id: record.id,
      caseNumber: record.caseNumber,
      serviceType: record.serviceType,
      title: record.title,
      description: record.description,
      asnId: record.asnId,
      asn: record.asn,
      currentState: record.currentState,
      status: record.status,
      priority: record.priority,
      submittedAt: record.submittedAt,
      completedAt: record.completedAt,
      closedAt: record.closedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private toCaseDetailResponse(record: SiapCaseDetailRecord) {
    return {
      id: record.id,
      caseNumber: record.caseNumber,
      serviceType: record.serviceType,
      title: record.title,
      description: record.description,
      asnId: record.asnId,
      asn: record.asn,
      currentState: record.currentState,
      status: record.status,
      priority: record.priority,
      submittedAt: record.submittedAt,
      completedAt: record.completedAt,
      closedAt: record.closedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      tasks: record.tasks,
      workflowLogs: record.workflowLogs,
      slaTracking: record.slaTracking,
      timelines: record.timelines,
    };
  }

  private toTaskResponse(record: SiapTaskRecord) {
    return {
      id: record.id,
      caseId: record.caseId,
      case: record.case,
      taskType: record.taskType,
      title: record.title,
      description: record.description,
      status: record.status,
      priority: record.priority,
      assignedTo: record.assignedTo,
      assignedBy: record.assignedBy,
      assignee: record.assignee,
      assigner: record.assigner,
      dueDate: record.dueDate,
      startedAt: record.startedAt,
      completedAt: record.completedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      slaTracking: record.slaTracking,
    };
  }
}
