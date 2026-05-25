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
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { AuditContext, AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/auth.types';
import { EventBusService } from '../events/event-bus.service';
import { AssignTaskDto } from './dto/assign-task.dto';
import { CaseListQueryDto } from './dto/case-list-query.dto';
import { CompleteTaskDto } from './dto/complete-task.dto';
import { CreateCaseDto } from './dto/create-case.dto';
import { ReturnTaskDto } from './dto/return-task.dto';
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
const STAFF_ROLES = [
  'ANALIS_PERTAMA',
  'ANALIS_MUDA',
  'ANALIS_MADYA',
  'PENELAAH',
  'PPPK',
];
const SUPERVISOR_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
];

@Injectable()
export class SiapService {
  constructor(
    @Inject(SiapRepository)
    private readonly siapRepository: SiapRepository,
    @Inject(EventBusService)
    private readonly eventBusService: EventBusService,
    @Inject(AuditService)
    private readonly auditService: AuditService,
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

    let created: SiapCaseListRecord | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        created = await this.siapRepository.createCase({
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
        break;
      } catch (err) {
        if (
          err instanceof PrismaClientKnownRequestError &&
          err.code === 'P2002' &&
          attempt < 3
        ) {
          continue;
        }
        throw err;
      }
    }

    await this.siapRepository.createTimelineEntry(
      {
        caseId: created!.id,
        eventType: 'CASE_CREATED',
        title: 'Case dibuat',
        description: `Case ${created!.caseNumber} dibuat dalam status DRAFT`,
        performedBy: user.id,
      },
      client,
    );

    return created!;
  }

  async submitCase(id: string, user: AuthUser, context?: AuditContext) {
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

    await this.eventBusService.publishNotification({
      type: 'CASE_SUBMITTED',
      title: 'Case baru disubmit',
      body: `${submitted.caseNumber} menunggu verifikasi administrasi`,
      caseId: submitted.id,
      actionUrl: '/siap/tasks',
      recipientRoleCodes: ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID'],
      createdBy: user.id,
      metadata: {
        caseNumber: submitted.caseNumber,
        serviceType: submitted.serviceType,
        currentState: submitted.currentState,
      },
    });

    await this.auditService.record({
      entityType: 'SIAP_CASE',
      entityId: submitted.id,
      action: 'SIAP_CASE_SUBMITTED',
      performedBy: user.id,
      afterData: {
        caseNumber: submitted.caseNumber,
        serviceType: submitted.serviceType,
        currentState: submitted.currentState,
        status: submitted.status,
      },
      context,
    });

    return this.toCaseDetailResponse(submitted);
  }

  async findCases(query: CaseListQueryDto, user: AuthUser) {
    const filters = this.normalizeCaseFilters(query, user);
    const result = await this.siapRepository.findCases(filters);

    return {
      items: result.items.map((item) => this.toCaseListResponse(item)),
      page: filters.page,
      limit: filters.limit,
      total: result.total,
    };
  }

  async findCaseById(id: string, user: AuthUser) {
    const found = await this.siapRepository.findCaseById(id.trim());

    if (!found) {
      throw new NotFoundException('Case tidak ditemukan');
    }

    if (!this.canSeeCase(found, user)) {
      throw new ForbiddenException('Anda tidak berwenang mengakses case ini');
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

  async findMyTasks(query: TaskListQueryDto, user: AuthUser) {
    const filters = this.normalizeTaskFilters(query, user, {
      forceAssigneeId: user.id,
      activeOnly: !query.status,
    });
    const result = await this.siapRepository.findTasks(filters);

    return {
      items: result.items.map((item) => this.toTaskResponse(item)),
      page: filters.page,
      limit: filters.limit,
      total: result.total,
    };
  }

  async findTeamTasks(query: TaskListQueryDto, user: AuthUser) {
    if (!this.canSeeTeamTasks(user)) {
      throw new ForbiddenException('Anda tidak berwenang melihat team task');
    }

    const filters = this.normalizeTaskFilters(query, user, {
      forceAllAssignees: true,
      activeOnly: !query.status,
    });
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

  async startTask(id: string, user: AuthUser, context?: AuditContext) {
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

    await this.eventBusService.publishNotification({
      type: 'TASK_STARTED',
      title: 'Task mulai diproses',
      body: `${updated.title} mulai diproses`,
      caseId: updated.caseId,
      actionUrl: '/siap/tasks',
      recipientUserIds: [user.id],
      recipientRoleCodes: ['SUPER_ADMIN', 'ADMIN_BKPSDM'],
      createdBy: user.id,
      metadata: {
        taskId: updated.id,
        taskType: updated.taskType,
        status: updated.status,
      },
    });

    await this.auditService.record({
      entityType: 'SIAP_TASK',
      entityId: updated.id,
      action: 'TASK_STARTED',
      performedBy: user.id,
      beforeData: {
        status: task.status,
        startedAt: task.startedAt?.toISOString() ?? null,
      },
      afterData: {
        status: updated.status,
        startedAt: updated.startedAt?.toISOString() ?? null,
        caseId: updated.caseId,
        taskType: updated.taskType,
      },
      context,
    });

    return this.toTaskResponse(updated);
  }

  async completeTask(
    id: string,
    dto: CompleteTaskDto,
    user: AuthUser,
    context?: AuditContext,
  ) {
    const task = await this.getTaskForUser(id, user);

    this.ensureTaskCanComplete(task);

    const now = new Date();
    const note =
      this.normalizeOptionalText(dto.note) ?? `${task.taskType} selesai`;
    const updated = await this.siapRepository.withTransaction(async (client) => {
      const updatedTask = await this.siapRepository.updateTask(
        task.id,
        {
          status: TaskStatus.COMPLETED,
          startedAt: task.startedAt ?? now,
          completedAt: now,
          updatedBy: user.id,
        },
        client,
      );

      await this.siapRepository.completeSlaForTask(task.id, now, client);

      await this.siapRepository.createWorkflowLog(
        {
          caseId: task.caseId,
          fromState: task.case.currentState,
          toState: task.case.currentState,
          action: 'COMPLETE_TASK',
          note,
          performedBy: user.id,
          performedAt: now,
        },
        client,
      );

      await this.siapRepository.createTimelineEntry(
        {
          caseId: task.caseId,
          taskId: task.id,
          eventType: 'TASK_COMPLETED',
          title: 'Task selesai',
          description: note,
          performedBy: user.id,
          createdAt: now,
        },
        client,
      );

      return updatedTask;
    });

    await this.eventBusService.publishNotification({
      type: 'TASK_COMPLETED',
      title: 'Task selesai',
      body: `${updated.title} selesai diproses`,
      caseId: updated.caseId,
      actionUrl: '/siap/tasks',
      recipientUserIds: [user.id],
      recipientRoleCodes: ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID'],
      createdBy: user.id,
      metadata: {
        taskId: updated.id,
        taskType: updated.taskType,
        status: updated.status,
      },
    });

    await this.auditService.record({
      entityType: 'SIAP_TASK',
      entityId: updated.id,
      action: 'TASK_COMPLETED',
      performedBy: user.id,
      beforeData: {
        status: task.status,
        completedAt: task.completedAt?.toISOString() ?? null,
      },
      afterData: {
        status: updated.status,
        completedAt: updated.completedAt?.toISOString() ?? null,
        caseId: updated.caseId,
        taskType: updated.taskType,
      },
      context,
    });

    return this.toTaskResponse(updated);
  }

  async assignTask(id: string, dto: AssignTaskDto, user: AuthUser) {
    if (!this.canAssignTask(user)) {
      throw new ForbiddenException('Anda tidak berwenang membagi task');
    }

    const task = await this.siapRepository.findTaskById(id.trim());

    if (!task) {
      throw new NotFoundException('Task tidak ditemukan');
    }

    this.ensureTaskCanBeModified(task);

    const assigneeId = dto.assignedTo.trim();
    const assigneeExists = await this.siapRepository.userExists(assigneeId);

    if (!assigneeExists) {
      throw new NotFoundException('User penerima task tidak ditemukan/aktif');
    }

    const now = new Date();
    const note =
      this.normalizeOptionalText(dto.note) ??
      `Task ditugaskan kepada user ${assigneeId}`;

    const updated = await this.siapRepository.withTransaction(async (client) => {
      const updatedTask = await this.siapRepository.updateTask(
        task.id,
        {
          status:
            task.status === TaskStatus.CREATED
              ? TaskStatus.ASSIGNED
              : task.status,
          assignedTo: assigneeId,
          assignedBy: user.id,
          updatedBy: user.id,
        },
        client,
      );

      await this.siapRepository.createWorkflowLog(
        {
          caseId: task.caseId,
          fromState: task.case.currentState,
          toState: task.case.currentState,
          action: 'ASSIGN_TASK',
          note,
          performedBy: user.id,
          performedAt: now,
        },
        client,
      );

      await this.siapRepository.createTimelineEntry(
        {
          caseId: task.caseId,
          taskId: task.id,
          eventType: 'TASK_ASSIGNED',
          title: 'Task ditugaskan',
          description: note,
          performedBy: user.id,
          createdAt: now,
        },
        client,
      );

      return updatedTask;
    });

    await this.eventBusService.publishNotification({
      type: 'TASK_ASSIGNED',
      title: 'Task baru ditugaskan',
      body: `${updated.title} ditugaskan kepada Anda`,
      caseId: updated.caseId,
      actionUrl: '/siap/tasks',
      recipientUserIds: [assigneeId],
      recipientRoleCodes: ['SUPER_ADMIN', 'ADMIN_BKPSDM'],
      createdBy: user.id,
      metadata: {
        taskId: updated.id,
        taskType: updated.taskType,
        assignedBy: user.id,
      },
    });

    await this.auditService.record({
      entityType: 'SIAP_TASK',
      entityId: updated.id,
      action: 'TASK_ASSIGNED',
      performedBy: user.id,
      beforeData: {
        assignedTo: task.assignedTo,
        assignedBy: task.assignedBy,
        status: task.status,
      },
      afterData: {
        assignedTo: updated.assignedTo,
        assignedBy: updated.assignedBy,
        status: updated.status,
      },
    });

    return this.toTaskResponse(updated);
  }

  async returnTask(id: string, dto: ReturnTaskDto, user: AuthUser) {
    const task = await this.getTaskForUser(id, user);

    this.ensureTaskCanBeModified(task);

    const returnableStatuses: TaskStatus[] = [
      TaskStatus.ASSIGNED,
      TaskStatus.IN_PROGRESS,
      TaskStatus.WAITING,
      TaskStatus.OVERDUE,
    ];

    if (!returnableStatuses.includes(task.status)) {
      throw new BadRequestException(
        'Task tidak dapat dikembalikan dari status ini',
      );
    }

    const now = new Date();
    const reason = dto.reason.trim();
    const targetRole = this.normalizeOptionalText(dto.targetRole);
    const description = targetRole
      ? `${reason} Target revisi: ${targetRole}`
      : reason;

    const updated = await this.siapRepository.withTransaction(async (client) => {
      const updatedTask = await this.siapRepository.updateTask(
        task.id,
        {
          status: TaskStatus.RETURNED,
          updatedBy: user.id,
        },
        client,
      );

      await this.siapRepository.createWorkflowLog(
        {
          caseId: task.caseId,
          fromState: task.case.currentState,
          toState: task.case.currentState,
          action: 'RETURN_TASK',
          note: description,
          performedBy: user.id,
          performedAt: now,
        },
        client,
      );

      await this.siapRepository.createTimelineEntry(
        {
          caseId: task.caseId,
          taskId: task.id,
          eventType: 'TASK_RETURNED',
          title: 'Task dikembalikan',
          description,
          performedBy: user.id,
          createdAt: now,
        },
        client,
      );

      return updatedTask;
    });

    await this.eventBusService.publishNotification({
      type: 'TASK_RETURNED',
      title: 'Task dikembalikan',
      body: `${updated.title} dikembalikan untuk revisi`,
      caseId: updated.caseId,
      actionUrl: '/siap/tasks',
      recipientUserIds: updated.assignedTo ? [updated.assignedTo] : [],
      recipientRoleCodes: targetRole
        ? [targetRole]
        : ['SUPER_ADMIN', 'ADMIN_BKPSDM'],
      createdBy: user.id,
      metadata: {
        taskId: updated.id,
        taskType: updated.taskType,
        targetRole,
      },
    });

    await this.auditService.record({
      entityType: 'SIAP_TASK',
      entityId: updated.id,
      action: 'TASK_RETURNED',
      performedBy: user.id,
      beforeData: {
        status: task.status,
      },
      afterData: {
        status: updated.status,
        reason,
        targetRole,
      },
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

    if (this.canSeeTeamTasks(user)) {
      return true;
    }

    if (!task.assignedTo && this.hasPrivilegedRole(user)) {
      return true;
    }

    return false;
  }

  private canSeeCase(record: SiapCaseDetailRecord, user: AuthUser) {
    if (this.canSeeAllCases(user)) {
      return true;
    }

    if (this.hasRole(user, 'ASN')) {
      return record.createdBy === user.id;
    }

    if (this.hasRole(user, 'OPD_OPERATOR')) {
      return (
        record.createdBy === user.id ||
        (!!user.unitKerjaId && record.asn?.unitKerjaId === user.unitKerjaId)
      );
    }

    return false;
  }

  private canSeeAllTasks(user: AuthUser) {
    return this.hasPrivilegedRole(user);
  }

  private canSeeTeamTasks(user: AuthUser) {
    return this.hasAnyRole(user, SUPERVISOR_ROLES);
  }

  private canAssignTask(user: AuthUser) {
    return this.hasAnyRole(user, [
      'SUPER_ADMIN',
      'ADMIN_BKPSDM',
      'KABID',
      'ANALIS_MADYA',
      'ANALIS_MUDA',
    ]);
  }

  private hasPrivilegedRole(user: AuthUser) {
    return this.hasAnyRole(user, [
      'SUPER_ADMIN',
      'ADMIN_BKPSDM',
      'KEPALA_BADAN',
      'KABID',
      'ANALIS_MADYA',
      'ANALIS_MUDA',
    ]);
  }

  private hasRole(user: AuthUser, expectedRole: string) {
    return user.roles.includes(expectedRole);
  }

  private hasAnyRole(user: AuthUser, expectedRoles: string[]) {
    return user.roles.some((role) => expectedRoles.includes(role));
  }

  private ensureTaskCanStart(task: SiapTaskRecord) {
    this.ensureTaskCanBeModified(task);

    const startableStatuses: TaskStatus[] = [
      TaskStatus.ASSIGNED,
      TaskStatus.OVERDUE,
    ];

    if (!startableStatuses.includes(task.status)) {
      throw new BadRequestException(
        'Task hanya dapat dimulai dari status ASSIGNED atau OVERDUE',
      );
    }
  }

  private ensureTaskCanComplete(task: SiapTaskRecord) {
    this.ensureTaskCanBeModified(task);

    const completableStatuses: TaskStatus[] = [
      TaskStatus.IN_PROGRESS,
      TaskStatus.OVERDUE,
    ];

    if (!completableStatuses.includes(task.status)) {
      throw new BadRequestException(
        'Task hanya dapat diselesaikan dari status IN_PROGRESS atau OVERDUE',
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

  private normalizeCaseFilters(
    query: CaseListQueryDto,
    user: AuthUser,
  ): NormalizedCaseFilters {
    const filters: NormalizedCaseFilters = {
      q: this.normalizeOptionalText(query.q),
      serviceType: this.normalizeOptionalText(query.serviceType)?.toUpperCase(),
      currentState: this.normalizeOptionalText(query.currentState),
      status: query.status,
      page: this.normalizePositiveNumber(query.page, 1, 1, 10000),
      limit: this.normalizePositiveNumber(query.limit, 10, 1, 100),
    };

    if (this.hasRole(user, 'ASN')) {
      filters.createdBy = user.id;
    } else if (this.hasRole(user, 'OPD_OPERATOR') && user.unitKerjaId) {
      filters.asnUnitKerjaId = user.unitKerjaId;
    } else if (
      this.hasRole(user, 'OPD_OPERATOR') &&
      !this.canSeeAllCases(user)
    ) {
      filters.createdBy = user.id;
    }

    return filters;
  }

  private normalizeTaskFilters(
    query: TaskListQueryDto,
    user: AuthUser,
    options: {
      forceAssigneeId?: string;
      forceAllAssignees?: boolean;
      activeOnly?: boolean;
    } = {},
  ): NormalizedTaskFilters {
    return {
      q: this.normalizeOptionalText(query.q),
      taskType: this.normalizeOptionalText(query.taskType),
      status: query.status,
      activeOnly: options.activeOnly,
      page: this.normalizePositiveNumber(query.page, 1, 1, 10000),
      limit: this.normalizePositiveNumber(query.limit, 10, 1, 100),
      assigneeId: options.forceAllAssignees
        ? undefined
        : options.forceAssigneeId ??
          (this.canSeeAllTasks(user) ? undefined : user.id),
    };
  }

  private canSeeAllCases(user: AuthUser) {
    return this.hasAnyRole(user, [
      'SUPER_ADMIN',
      'ADMIN_BKPSDM',
      'KEPALA_BADAN',
      'KABID',
      ...STAFF_ROLES,
    ]);
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
