import {
  BadRequestException,
  ForbiddenException,
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
  SiapDbClient,
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
    const created = await this.createCaseRecord(dto, user);
    return this.toCaseListResponse(created);
  }

  async createCaseRecord(
    dto: CreateCaseDto,
    user: AuthUser,
    client?: SiapDbClient,
  ): Promise<SiapCaseListRecord> {
    const serviceType = dto.serviceType.trim().toUpperCase();
    const created = await this.siapRepository.createCase({
      caseNumber: await this.createCaseNumber(serviceType, client),
      serviceType,
      title: dto.title.trim(),
      description: this.normalizeOptionalText(dto.description),
      asnId: this.normalizeOptionalText(dto.asnId),
      currentState: DRAFT_STATE,
      status: CaseStatus.DRAFT,
      priority: dto.priority ?? CasePriority.NORMAL,
      createdBy: user.id,
      updatedBy: user.id,
    }, client);

    await this.siapRepository.createTimelineEntry(
      {
        caseId: created.id,
        eventType: 'CASE_CREATED',
        title: 'Case dibuat',
        description: `Case ${created.caseNumber} dibuat dalam status DRAFT`,
        performedBy: user.id,
      },
      client,
    );

    return created;
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

    await this.siapRepository.withTransaction(async (client) => {
      await this.siapRepository.updateCaseState(
        existing.id,
        {
          currentState: SUBMITTED_STATE,
          status: CaseStatus.ACTIVE,
          submittedAt: now,
          updatedBy: user.id,
        },
        client,
      );

      await this.siapRepository.createWorkflowLog(
        {
          caseId: existing.id,
          fromState: DRAFT_STATE,
          toState: SUBMITTED_STATE,
          action: 'SUBMIT',
          note: 'Case disubmit untuk verifikasi admin',
          performedBy: user.id,
          performedAt: now,
        },
        client,
      );

      const task = await this.siapRepository.createTask(
        {
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
        },
        client,
      );

      await this.siapRepository.createSlaTracking(
        {
          caseId: existing.id,
          taskId: task.id,
          workflowState: SUBMITTED_STATE,
          startedAt: now,
          dueAt,
          status: SlaStatus.ON_TRACK,
        },
        client,
      );

      await this.siapRepository.createTimelineEntry(
        {
          caseId: existing.id,
          eventType: 'CASE_SUBMITTED',
          title: 'Case disubmit',
          description: `Case ${existing.caseNumber} disubmit dari DRAFT ke SUBMITTED`,
          performedBy: user.id,
          createdAt: now,
        },
        client,
      );

      await this.siapRepository.createTimelineEntry(
        {
          caseId: existing.id,
          taskId: task.id,
          eventType: 'TASK_CREATED',
          title: 'Task verifikasi admin dibuat',
          description: `Task ${FIRST_TASK_TYPE} dibuat dan ditugaskan untuk verifikasi awal`,
          performedBy: user.id,
          createdAt: now,
        },
        client,
      );
    });

    const submitted = await this.siapRepository.findCaseById(existing.id);

    if (!submitted) {
      throw new NotFoundException('Case tidak ditemukan setelah submit');
    }

    return this.toCaseDetailResponse(submitted);
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

    this.ensureTaskCanStart(task);

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
      description: `Task ${task.taskType} mulai diproses`,
      performedBy: user.id,
      createdAt: now,
    });

    return this.toTaskResponse(updated);
  }

  async completeTask(id: string, dto: CompleteTaskDto, user: AuthUser) {
    const task = await this.getTaskForUser(id, user);

    this.ensureTaskCanComplete(task);

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
      description:
        this.normalizeOptionalText(dto.note) ??
        `Task ${task.taskType} selesai diproses`,
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

    if (!this.canActOnTask(task, user)) {
      throw new ForbiddenException('Anda tidak berwenang mengakses task ini');
    }

    return task;
  }

  private canActOnTask(task: SiapTaskRecord, user: AuthUser) {
    if (this.hasRole(user, 'SUPER_ADMIN')) {
      return true;
    }

    if (task.assignedTo === user.id) {
      return true;
    }

    if (!task.assignedTo && this.hasPrivilegedRole(user)) {
      return true;
    }

    return false;
  }

  private canSeeAllTasks(user: AuthUser) {
    return this.hasPrivilegedRole(user);
  }

  private hasPrivilegedRole(user: AuthUser) {
    return user.roles.some((role) =>
      ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID'].includes(role),
    );
  }

  private hasRole(user: AuthUser, expectedRole: string) {
    return user.roles.includes(expectedRole);
  }

  private ensureTaskCanStart(task: SiapTaskRecord) {
    this.ensureTaskCanBeModified(task);

    if (task.status !== TaskStatus.ASSIGNED) {
      throw new BadRequestException(
        'Task hanya dapat dimulai dari status ASSIGNED',
      );
    }
  }

  private ensureTaskCanComplete(task: SiapTaskRecord) {
    this.ensureTaskCanBeModified(task);

    if (task.status !== TaskStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Task hanya dapat diselesaikan dari status IN_PROGRESS',
      );
    }
  }

  private ensureTaskCanBeModified(task: SiapTaskRecord) {
    if (task.status === TaskStatus.COMPLETED) {
      throw new BadRequestException('Task sudah selesai dan tidak dapat diubah');
    }

    if (task.status === TaskStatus.CANCELLED) {
      throw new BadRequestException(
        'Task sudah dibatalkan dan tidak dapat diubah',
      );
    }
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

  private async createCaseNumber(serviceType: string, client?: SiapDbClient) {
    const now = new Date();
    const prefix = `${serviceType}-${now.getFullYear()}-`;
    let sequence =
      (await this.siapRepository.countCasesByNumberPrefix(prefix, client)) + 1;

    while (true) {
      const candidate = `${prefix}${String(sequence).padStart(6, '0')}`;

      if (!(await this.siapRepository.caseNumberExists(candidate, client))) {
        return candidate;
      }

      sequence += 1;
    }
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
