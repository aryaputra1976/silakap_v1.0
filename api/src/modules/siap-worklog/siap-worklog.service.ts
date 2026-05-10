import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SiapWorklogStatus } from '@prisma/client';
import { AuditContext, AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/auth.types';
import { EventBusService } from '../events/event-bus.service';
import { CreateWorklogDto } from './dto/create-worklog.dto';
import { ReviewWorklogDto } from './dto/review-worklog.dto';
import { UpdateWorklogDto } from './dto/update-worklog.dto';
import { WorklogListQueryDto } from './dto/worklog-list-query.dto';
import {
  SiapWorklogRecord,
  SiapWorklogRepository,
} from './siap-worklog.repository';
import { NormalizedWorklogFilters } from './siap-worklog.types';

const STAFF_ROLES = [
  'ANALIS_PERTAMA',
  'ANALIS_MUDA',
  'ANALIS_MADYA',
  'PENELAAH',
  'PPPK',
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KABID',
];

const REVIEWER_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
];

@Injectable()
export class SiapWorklogService {
  constructor(
    @Inject(SiapWorklogRepository)
    private readonly worklogRepository: SiapWorklogRepository,
    @Inject(EventBusService)
    private readonly eventBusService: EventBusService,
    @Inject(AuditService)
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateWorklogDto, user: AuthUser, context?: AuditContext) {
    this.ensureCanCreateWorklog(user);

    const workDate = this.parseDate(dto.workDate, 'Tanggal kerja tidak valid');
    const caseId = this.normalizeOptionalText(dto.caseId);
    const taskId = this.normalizeOptionalText(dto.taskId);

    await this.validateLinkedRecords(caseId, taskId);

    const created = await this.worklogRepository.create({
      userId: user.id,
      unitKerjaId: user.unitKerjaId,
      caseId,
      taskId,
      workDate,
      category: dto.category.trim().toUpperCase(),
      title: dto.title.trim(),
      description: dto.description.trim(),
      output: this.normalizeOptionalText(dto.output),
      volume: dto.volume,
      obstacle: this.normalizeOptionalText(dto.obstacle),
      status: SiapWorklogStatus.DRAFT,
      createdBy: user.id,
      updatedBy: user.id,
    });

    await this.auditService.record({
      entityType: 'SIAP_WORKLOG',
      entityId: created.id,
      action: 'WORKLOG_CREATED',
      performedBy: user.id,
      afterData: this.toAuditData(created),
      context,
    });

    return this.toResponse(created);
  }

  async findMy(query: WorklogListQueryDto, user: AuthUser) {
    const filters = this.normalizeFilters(query, {
      forceUserId: user.id,
    });
    const result = await this.worklogRepository.findMany(filters);

    return {
      items: result.items.map((item) => this.toResponse(item)),
      page: filters.page,
      limit: filters.limit,
      total: result.total,
    };
  }

  async findTeam(query: WorklogListQueryDto, user: AuthUser) {
    this.ensureCanReview(user);

    const filters = this.normalizeFilters(query, {
      teamViewer: user,
    });
    const result = await this.worklogRepository.findMany(filters);

    return {
      items: result.items.map((item) => this.toResponse(item)),
      page: filters.page,
      limit: filters.limit,
      total: result.total,
    };
  }

  async findById(id: string, user: AuthUser) {
    const worklog = await this.getWorklogForUser(id, user);
    return this.toResponse(worklog);
  }

  async update(
    id: string,
    dto: UpdateWorklogDto,
    user: AuthUser,
    context?: AuditContext,
  ) {
    const worklog = await this.getWorklogForUser(id, user);

    this.ensureCanEdit(worklog, user);

    const caseId =
      dto.caseId === undefined
        ? worklog.caseId ?? undefined
        : this.normalizeOptionalText(dto.caseId);
    const taskId =
      dto.taskId === undefined
        ? worklog.taskId ?? undefined
        : this.normalizeOptionalText(dto.taskId);

    await this.validateLinkedRecords(caseId, taskId);

    const wasRevision = worklog.status === SiapWorklogStatus.REVISION_REQUIRED;
    const updated = await this.worklogRepository.update(worklog.id, {
      workDate: dto.workDate
        ? this.parseDate(dto.workDate, 'Tanggal kerja tidak valid')
        : undefined,
      category: dto.category?.trim().toUpperCase(),
      title: dto.title?.trim(),
      description: dto.description?.trim(),
      output:
        dto.output === undefined
          ? undefined
          : this.normalizeNullableText(dto.output),
      volume: dto.volume,
      obstacle:
        dto.obstacle === undefined
          ? undefined
          : this.normalizeNullableText(dto.obstacle),
      caseId: dto.caseId === undefined ? undefined : (caseId ?? null),
      taskId: dto.taskId === undefined ? undefined : (taskId ?? null),
      status: wasRevision ? SiapWorklogStatus.DRAFT : worklog.status,
      reviewedBy: wasRevision ? null : undefined,
      reviewedAt: wasRevision ? null : undefined,
      reviewNote: wasRevision ? null : undefined,
      updatedBy: user.id,
    });

    await this.auditService.record({
      entityType: 'SIAP_WORKLOG',
      entityId: updated.id,
      action: 'WORKLOG_UPDATED',
      performedBy: user.id,
      beforeData: this.toAuditData(worklog),
      afterData: this.toAuditData(updated),
      context,
    });

    return this.toResponse(updated);
  }

  async submit(id: string, user: AuthUser, context?: AuditContext) {
    const worklog = await this.getWorklogForUser(id, user);

    this.ensureCanSubmit(worklog, user);

    const now = new Date();
    const updated = await this.worklogRepository.update(worklog.id, {
      status: SiapWorklogStatus.SUBMITTED,
      submittedAt: now,
      updatedBy: user.id,
    });

    await this.eventBusService.publishNotification({
      type: 'WORKLOG_SUBMITTED',
      title: 'Buku kerja menunggu review',
      body: `${user.name} mengirim buku kerja: ${updated.title}`,
      actionUrl: '/siap/worklogs',
      recipientRoleCodes: [
        'SUPER_ADMIN',
        'ADMIN_BKPSDM',
        'KABID',
        'KEPALA_BADAN',
      ],
      createdBy: user.id,
      metadata: {
        worklogId: updated.id,
        userId: updated.userId,
        unitKerjaId: updated.unitKerjaId,
        workDate: updated.workDate.toISOString(),
        category: updated.category,
      },
    });

    await this.auditService.record({
      entityType: 'SIAP_WORKLOG',
      entityId: updated.id,
      action: 'WORKLOG_SUBMITTED',
      performedBy: user.id,
      beforeData: this.toAuditData(worklog),
      afterData: this.toAuditData(updated),
      context,
    });

    return this.toResponse(updated);
  }

  async approve(
    id: string,
    dto: ReviewWorklogDto,
    user: AuthUser,
    context?: AuditContext,
  ) {
    const worklog = await this.getWorklogForUser(id, user);

    this.ensureCanReview(user);
    this.ensureCanReviewWorklog(worklog, user);

    if (worklog.status !== SiapWorklogStatus.SUBMITTED) {
      throw new BadRequestException(
        'Hanya buku kerja SUBMITTED yang dapat disetujui',
      );
    }

    const now = new Date();
    const updated = await this.worklogRepository.update(worklog.id, {
      status: SiapWorklogStatus.APPROVED,
      reviewedBy: user.id,
      reviewedAt: now,
      reviewNote: this.normalizeOptionalText(dto.note),
      updatedBy: user.id,
    });

    await this.eventBusService.publishNotification({
      type: 'WORKLOG_APPROVED',
      title: 'Buku kerja disetujui',
      body: `Buku kerja Anda disetujui: ${updated.title}`,
      actionUrl: '/siap/worklogs',
      recipientUserIds: [updated.userId],
      createdBy: user.id,
      metadata: {
        worklogId: updated.id,
        reviewedBy: user.id,
      },
    });

    await this.auditService.record({
      entityType: 'SIAP_WORKLOG',
      entityId: updated.id,
      action: 'WORKLOG_APPROVED',
      performedBy: user.id,
      beforeData: this.toAuditData(worklog),
      afterData: this.toAuditData(updated),
      context,
    });

    return this.toResponse(updated);
  }

  async revision(
    id: string,
    dto: ReviewWorklogDto,
    user: AuthUser,
    context?: AuditContext,
  ) {
    const worklog = await this.getWorklogForUser(id, user);

    this.ensureCanReview(user);
    this.ensureCanReviewWorklog(worklog, user);

    if (worklog.status !== SiapWorklogStatus.SUBMITTED) {
      throw new BadRequestException(
        'Hanya buku kerja SUBMITTED yang dapat diminta revisi',
      );
    }

    const note = this.normalizeOptionalText(dto.note);

    if (!note) {
      throw new BadRequestException('Catatan revisi wajib diisi');
    }

    const now = new Date();
    const updated = await this.worklogRepository.update(worklog.id, {
      status: SiapWorklogStatus.REVISION_REQUIRED,
      reviewedBy: user.id,
      reviewedAt: now,
      reviewNote: note,
      updatedBy: user.id,
    });

    await this.eventBusService.publishNotification({
      type: 'WORKLOG_REVISION_REQUIRED',
      title: 'Buku kerja perlu revisi',
      body: `Buku kerja Anda perlu revisi: ${updated.title}`,
      actionUrl: '/siap/worklogs',
      recipientUserIds: [updated.userId],
      createdBy: user.id,
      metadata: {
        worklogId: updated.id,
        reviewedBy: user.id,
        reviewNote: note,
      },
    });

    await this.auditService.record({
      entityType: 'SIAP_WORKLOG',
      entityId: updated.id,
      action: 'WORKLOG_REVISION_REQUIRED',
      performedBy: user.id,
      beforeData: this.toAuditData(worklog),
      afterData: this.toAuditData(updated),
      context,
    });

    return this.toResponse(updated);
  }

  private async getWorklogForUser(id: string, user: AuthUser) {
    const worklog = await this.worklogRepository.findById(id.trim());

    if (!worklog) {
      throw new NotFoundException('Buku kerja tidak ditemukan');
    }

    if (!this.canSeeWorklog(worklog, user)) {
      throw new ForbiddenException(
        'Anda tidak berwenang mengakses buku kerja ini',
      );
    }

    return worklog;
  }

  private canSeeWorklog(worklog: SiapWorklogRecord, user: AuthUser) {
    if (worklog.userId === user.id) {
      return true;
    }

    if (this.hasAnyRole(user, ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'KEPALA_BADAN'])) {
      return true;
    }

    if (
      this.hasAnyRole(user, ['KABID', 'ANALIS_MADYA', 'ANALIS_MUDA']) &&
      user.unitKerjaId &&
      worklog.unitKerjaId === user.unitKerjaId
    ) {
      return true;
    }

    return false;
  }

  private ensureCanCreateWorklog(user: AuthUser) {
    if (!this.hasAnyRole(user, STAFF_ROLES)) {
      throw new ForbiddenException('Anda tidak berwenang membuat buku kerja');
    }
  }

  private ensureCanEdit(worklog: SiapWorklogRecord, user: AuthUser) {
    if (worklog.userId !== user.id) {
      throw new ForbiddenException('Buku kerja hanya dapat diedit oleh pemilik');
    }

    const editableStatuses: SiapWorklogStatus[] = [
      SiapWorklogStatus.DRAFT,
      SiapWorklogStatus.REVISION_REQUIRED,
    ];

    if (!editableStatuses.includes(worklog.status)) {
      throw new BadRequestException(
        'Buku kerja hanya dapat diedit saat DRAFT atau REVISION_REQUIRED',
      );
    }
  }

  private ensureCanSubmit(worklog: SiapWorklogRecord, user: AuthUser) {
    if (worklog.userId !== user.id) {
      throw new ForbiddenException(
        'Buku kerja hanya dapat disubmit oleh pemilik',
      );
    }

    const submittableStatuses: SiapWorklogStatus[] = [
      SiapWorklogStatus.DRAFT,
      SiapWorklogStatus.REVISION_REQUIRED,
    ];

    if (!submittableStatuses.includes(worklog.status)) {
      throw new BadRequestException(
        'Buku kerja hanya dapat disubmit dari DRAFT atau REVISION_REQUIRED',
      );
    }
  }

  private ensureCanReview(user: AuthUser) {
    if (!this.hasAnyRole(user, REVIEWER_ROLES)) {
      throw new ForbiddenException('Anda tidak berwenang mereview buku kerja');
    }
  }

  private ensureCanReviewWorklog(worklog: SiapWorklogRecord, user: AuthUser) {
    if (this.hasAnyRole(user, ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'KEPALA_BADAN'])) {
      return;
    }

    if (
      this.hasAnyRole(user, ['KABID', 'ANALIS_MADYA', 'ANALIS_MUDA']) &&
      user.unitKerjaId &&
      worklog.unitKerjaId === user.unitKerjaId
    ) {
      return;
    }

    throw new ForbiddenException(
      'Anda tidak berwenang mereview buku kerja unit ini',
    );
  }

  private normalizeFilters(
    query: WorklogListQueryDto,
    options: {
      forceUserId?: string;
      teamViewer?: AuthUser;
    },
  ): NormalizedWorklogFilters {
    const filters: NormalizedWorklogFilters = {
      q: this.normalizeOptionalText(query.q),
      category: this.normalizeOptionalText(query.category)?.toUpperCase(),
      status: query.status,
      userId: options.forceUserId ?? this.normalizeOptionalText(query.userId),
      unitKerjaId: this.normalizeOptionalText(query.unitKerjaId),
      caseId: this.normalizeOptionalText(query.caseId),
      taskId: this.normalizeOptionalText(query.taskId),
      from: query.from
        ? this.parseDate(query.from, 'Tanggal awal tidak valid')
        : undefined,
      to: query.to ? this.parseDate(query.to, 'Tanggal akhir tidak valid') : undefined,
      page: this.normalizePositiveNumber(query.page, 1, 1, 10000),
      limit: this.normalizePositiveNumber(query.limit, 10, 1, 100),
    };

    const viewer = options.teamViewer;

    if (
      viewer &&
      this.hasAnyRole(viewer, ['KABID', 'ANALIS_MADYA', 'ANALIS_MUDA']) &&
      viewer.unitKerjaId &&
      !this.hasAnyRole(viewer, [
        'SUPER_ADMIN',
        'ADMIN_BKPSDM',
        'KEPALA_BADAN',
      ])
    ) {
      filters.unitKerjaId = viewer.unitKerjaId;
    }

    return filters;
  }

  private async validateLinkedRecords(
    caseId: string | undefined,
    taskId: string | undefined,
  ) {
    if (caseId && !(await this.worklogRepository.caseExists(caseId))) {
      throw new NotFoundException('Case SIAP tidak ditemukan');
    }

    if (taskId && !(await this.worklogRepository.taskExists(taskId))) {
      throw new NotFoundException('Task SIAP tidak ditemukan');
    }
  }

  private parseDate(value: string, message: string) {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(message);
    }

    return parsed;
  }

  private normalizeOptionalText(value: string | undefined) {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }

  private normalizeNullableText(value: string | undefined) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
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

  private hasAnyRole(user: AuthUser, roles: string[]) {
    return user.roles.some((role) => roles.includes(role));
  }

  private toAuditData(record: SiapWorklogRecord) {
    return {
      id: record.id,
      userId: record.userId,
      unitKerjaId: record.unitKerjaId,
      caseId: record.caseId,
      taskId: record.taskId,
      workDate: record.workDate.toISOString(),
      category: record.category,
      title: record.title,
      status: record.status,
      submittedAt: record.submittedAt?.toISOString() ?? null,
      reviewedBy: record.reviewedBy,
      reviewedAt: record.reviewedAt?.toISOString() ?? null,
    };
  }

  private toResponse(record: SiapWorklogRecord) {
    return {
      id: record.id,
      userId: record.userId,
      unitKerjaId: record.unitKerjaId,
      caseId: record.caseId,
      taskId: record.taskId,
      workDate: record.workDate,
      category: record.category,
      title: record.title,
      description: record.description,
      output: record.output,
      volume: record.volume,
      obstacle: record.obstacle,
      status: record.status,
      submittedAt: record.submittedAt,
      reviewedBy: record.reviewedBy,
      reviewedAt: record.reviewedAt,
      reviewNote: record.reviewNote,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      user: record.user,
      unitKerja: record.unitKerja,
      case: record.case,
      task: record.task,
      reviewer: record.reviewer,
    };
  }
}
