Phase 10A — SIAP Worklog Core Backend kita buat sebagai modul terpisah agar siap.service.ts tidak makin gemuk.

Modul SIAP saat ini sudah kuat untuk case/task workflow, tetapi belum punya entitas buku kerja harian staf. Controller SIAP sekarang sudah menangani cases, tasks, my tasks, team tasks, assign, return, start, complete. Service SIAP juga sudah ada event bus, audit, SLA, dan notifikasi task. Jadi Worklog sebaiknya dibuat sebagai modul baru yang tetap terhubung dengan SIAP.

Phase 10A Target
Staf membuat buku kerja harian
Staf edit saat DRAFT / REVISION_REQUIRED
Staf submit ke Kabid
Kabid/Admin review
Kabid approve atau minta revisi
Audit log tercatat
Notification event dikirim

Endpoint baru:

GET   /api/v1/siap/worklogs/my
GET   /api/v1/siap/worklogs/team
GET   /api/v1/siap/worklogs/:id
POST  /api/v1/siap/worklogs
PATCH /api/v1/siap/worklogs/:id
POST  /api/v1/siap/worklogs/:id/submit
POST  /api/v1/siap/worklogs/:id/approve
POST  /api/v1/siap/worklogs/:id/revision
1. Update Prisma Schema
api/prisma/schema.prisma

Tambahkan enum ini setelah enum EventStatus atau sebelum JenisPensiun:

enum SiapWorklogStatus {
  DRAFT
  SUBMITTED
  REVISION_REQUIRED
  APPROVED
  REJECTED
}

Tambahkan relasi di model User:

  siapWorklogs         SiapWorklog[] @relation("WorklogUser")
  reviewedSiapWorklogs SiapWorklog[] @relation("WorklogReviewer")

Tambahkan relasi di model UnitKerja:

  siapWorklogs SiapWorklog[]

Tambahkan relasi di model SiapCase:

  worklogs SiapWorklog[]

Tambahkan relasi di model SiapTask:

  worklogs SiapWorklog[]

Lalu tambahkan model baru ini:

model SiapWorklog {
  id          String            @id @default(uuid()) @db.VarChar(36)
  userId      String            @map("user_id") @db.VarChar(36)
  unitKerjaId String?           @map("unit_kerja_id") @db.VarChar(36)
  caseId      String?           @map("case_id") @db.VarChar(36)
  taskId      String?           @map("task_id") @db.VarChar(36)

  workDate    DateTime          @map("work_date")
  category    String            @db.VarChar(80)
  title       String            @db.VarChar(200)
  description String            @db.Text
  output      String?           @db.Text
  volume      Int?
  obstacle    String?           @db.Text
  status      SiapWorklogStatus @default(DRAFT)

  submittedAt DateTime? @map("submitted_at")
  reviewedBy  String?   @map("reviewed_by") @db.VarChar(36)
  reviewedAt  DateTime? @map("reviewed_at")
  reviewNote  String?   @map("review_note") @db.Text

  createdAt DateTime  @default(now()) @map("created_at")
  createdBy String?   @map("created_by") @db.VarChar(36)
  updatedAt DateTime  @updatedAt @map("updated_at")
  updatedBy String?   @map("updated_by") @db.VarChar(36)
  deletedAt DateTime? @map("deleted_at")

  user      User       @relation("WorklogUser", fields: [userId], references: [id], onDelete: Cascade)
  unitKerja UnitKerja? @relation(fields: [unitKerjaId], references: [id], onDelete: SetNull)
  case      SiapCase?  @relation(fields: [caseId], references: [id], onDelete: SetNull)
  task      SiapTask?  @relation(fields: [taskId], references: [id], onDelete: SetNull)
  reviewer  User?      @relation("WorklogReviewer", fields: [reviewedBy], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([unitKerjaId])
  @@index([caseId])
  @@index([taskId])
  @@index([workDate])
  @@index([category])
  @@index([status])
  @@index([submittedAt])
  @@index([reviewedBy])
  @@map("siap_worklogs")
}
2. Buat module baru

Buat folder:

api/src/modules/siap-worklog/
api/src/modules/siap-worklog/dto/
api/src/modules/siap-worklog/dto/create-worklog.dto.ts
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateWorklogDto {
  @IsDateString()
  workDate!: string;

  @IsString()
  @MaxLength(80)
  category!: string;

  @IsString()
  @MaxLength(200)
  title!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  output?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  volume?: number;

  @IsOptional()
  @IsString()
  obstacle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  caseId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  taskId?: string;
}
api/src/modules/siap-worklog/dto/update-worklog.dto.ts
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateWorklogDto {
  @IsOptional()
  @IsDateString()
  workDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  output?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  volume?: number;

  @IsOptional()
  @IsString()
  obstacle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  caseId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  taskId?: string;
}
api/src/modules/siap-worklog/dto/worklog-list-query.dto.ts
import { IsOptional, IsString } from 'class-validator';
import { SiapWorklogStatus } from '@prisma/client';

export class WorklogListQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  status?: SiapWorklogStatus;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  unitKerjaId?: string;

  @IsOptional()
  @IsString()
  caseId?: string;

  @IsOptional()
  @IsString()
  taskId?: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}
api/src/modules/siap-worklog/dto/review-worklog.dto.ts
import { IsOptional, IsString } from 'class-validator';

export class ReviewWorklogDto {
  @IsOptional()
  @IsString()
  note?: string;
}
3. Types
api/src/modules/siap-worklog/siap-worklog.types.ts
import { SiapWorklogStatus } from '@prisma/client';

export type NormalizedWorklogFilters = {
  q?: string;
  category?: string;
  status?: SiapWorklogStatus;
  userId?: string;
  unitKerjaId?: string;
  caseId?: string;
  taskId?: string;
  from?: Date;
  to?: Date;
  page: number;
  limit: number;
};
4. Repository
api/src/modules/siap-worklog/siap-worklog.repository.ts
import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NormalizedWorklogFilters } from './siap-worklog.types';

const worklogInclude = {
  user: {
    select: {
      id: true,
      username: true,
      name: true,
      unitKerjaId: true,
      unitKerja: {
        select: {
          id: true,
          kode: true,
          nama: true,
        },
      },
    },
  },
  unitKerja: {
    select: {
      id: true,
      kode: true,
      nama: true,
    },
  },
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
    select: {
      id: true,
      taskType: true,
      title: true,
      status: true,
      dueDate: true,
    },
  },
  reviewer: {
    select: {
      id: true,
      username: true,
      name: true,
    },
  },
} satisfies Prisma.SiapWorklogInclude;

export type SiapWorklogRecord = Prisma.SiapWorklogGetPayload<{
  include: typeof worklogInclude;
}>;

@Injectable()
export class SiapWorklogRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.SiapWorklogUncheckedCreateInput,
  ): Promise<SiapWorklogRecord> {
    return this.prisma.siapWorklog.create({
      data,
      include: worklogInclude,
    });
  }

  async findMany(
    filters: NormalizedWorklogFilters,
  ): Promise<{ items: SiapWorklogRecord[]; total: number }> {
    const where = this.buildWhere(filters);
    const skip = (filters.page - 1) * filters.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.siapWorklog.findMany({
        where,
        include: worklogInclude,
        orderBy: [{ workDate: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: filters.limit,
      }),
      this.prisma.siapWorklog.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string): Promise<SiapWorklogRecord | null> {
    return this.prisma.siapWorklog.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: worklogInclude,
    });
  }

  async update(
    id: string,
    data: Prisma.SiapWorklogUncheckedUpdateInput,
  ): Promise<SiapWorklogRecord> {
    return this.prisma.siapWorklog.update({
      where: { id },
      data,
      include: worklogInclude,
    });
  }

  async caseExists(id: string): Promise<boolean> {
    const count = await this.prisma.siapCase.count({
      where: {
        id,
        deletedAt: null,
      },
    });

    return count > 0;
  }

  async taskExists(id: string): Promise<boolean> {
    const count = await this.prisma.siapTask.count({
      where: {
        id,
        deletedAt: null,
      },
    });

    return count > 0;
  }

  private buildWhere(
    filters: NormalizedWorklogFilters,
  ): Prisma.SiapWorklogWhereInput {
    const where: Prisma.SiapWorklogWhereInput = {
      deletedAt: null,
    };

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.unitKerjaId) {
      where.unitKerjaId = filters.unitKerjaId;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.caseId) {
      where.caseId = filters.caseId;
    }

    if (filters.taskId) {
      where.taskId = filters.taskId;
    }

    if (filters.from || filters.to) {
      where.workDate = {};

      if (filters.from) {
        where.workDate.gte = filters.from;
      }

      if (filters.to) {
        where.workDate.lte = filters.to;
      }
    }

    if (filters.q) {
      where.OR = [
        { title: { contains: filters.q } },
        { description: { contains: filters.q } },
        { output: { contains: filters.q } },
        { obstacle: { contains: filters.q } },
        { category: { contains: filters.q } },
        { user: { name: { contains: filters.q } } },
        { user: { username: { contains: filters.q } } },
        { case: { caseNumber: { contains: filters.q } } },
        { case: { title: { contains: filters.q } } },
        { task: { title: { contains: filters.q } } },
      ];
    }

    return where;
  }
}
5. Service
api/src/modules/siap-worklog/siap-worklog.service.ts
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
        ? worklog.caseId
        : this.normalizeOptionalText(dto.caseId);

    const taskId =
      dto.taskId === undefined
        ? worklog.taskId
        : this.normalizeOptionalText(dto.taskId);

    await this.validateLinkedRecords(caseId, taskId);

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
      caseId,
      taskId,
      status:
        worklog.status === SiapWorklogStatus.REVISION_REQUIRED
          ? SiapWorklogStatus.DRAFT
          : worklog.status,
      reviewedBy:
        worklog.status === SiapWorklogStatus.REVISION_REQUIRED
          ? null
          : undefined,
      reviewedAt:
        worklog.status === SiapWorklogStatus.REVISION_REQUIRED
          ? null
          : undefined,
      reviewNote:
        worklog.status === SiapWorklogStatus.REVISION_REQUIRED
          ? null
          : undefined,
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
      this.hasRole(user, 'KABID') &&
      user.unitKerjaId &&
      worklog.unitKerjaId === user.unitKerjaId
    ) {
      return true;
    }

    if (
      this.hasAnyRole(user, ['ANALIS_MADYA', 'ANALIS_MUDA']) &&
      user.unitKerjaId &&
      worklog.unitKerjaId === user.unitKerjaId
    ) {
      return true;
    }

    return false;
  }

  private ensureCanCreateWorklog(user: AuthUser) {
    if (!this.hasAnyRole(user, STAFF_ROLES)) {
      throw new ForbiddenException(
        'Anda tidak berwenang membuat buku kerja',
      );
    }
  }

  private ensureCanEdit(worklog: SiapWorklogRecord, user: AuthUser) {
    if (worklog.userId !== user.id) {
      throw new ForbiddenException(
        'Buku kerja hanya dapat diedit oleh pemilik',
      );
    }

    if (
      ![
        SiapWorklogStatus.DRAFT,
        SiapWorklogStatus.REVISION_REQUIRED,
      ].includes(worklog.status)
    ) {
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

    if (
      ![
        SiapWorklogStatus.DRAFT,
        SiapWorklogStatus.REVISION_REQUIRED,
      ].includes(worklog.status)
    ) {
      throw new BadRequestException(
        'Buku kerja hanya dapat disubmit dari DRAFT atau REVISION_REQUIRED',
      );
    }
  }

  private ensureCanReview(user: AuthUser) {
    if (!this.hasAnyRole(user, REVIEWER_ROLES)) {
      throw new ForbiddenException(
        'Anda tidak berwenang mereview buku kerja',
      );
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
    const from = query.from
      ? this.parseDate(query.from, 'Tanggal awal tidak valid')
      : undefined;
    const to = query.to
      ? this.parseDate(query.to, 'Tanggal akhir tidak valid')
      : undefined;

    const filters: NormalizedWorklogFilters = {
      q: this.normalizeOptionalText(query.q),
      category: this.normalizeOptionalText(query.category)?.toUpperCase(),
      status: query.status,
      userId: options.forceUserId ?? this.normalizeOptionalText(query.userId),
      unitKerjaId: this.normalizeOptionalText(query.unitKerjaId),
      caseId: this.normalizeOptionalText(query.caseId),
      taskId: this.normalizeOptionalText(query.taskId),
      from,
      to,
      page: this.normalizePositiveNumber(query.page, 1, 1, 10000),
      limit: this.normalizePositiveNumber(query.limit, 10, 1, 100),
    };

    const viewer = options.teamViewer;

    if (viewer) {
      if (
        this.hasAnyRole(viewer, ['KABID', 'ANALIS_MADYA', 'ANALIS_MUDA']) &&
        viewer.unitKerjaId &&
        !this.hasAnyRole(viewer, ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'KEPALA_BADAN'])
      ) {
        filters.unitKerjaId = viewer.unitKerjaId;
      }
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

  private hasRole(user: AuthUser, role: string) {
    return user.roles.includes(role);
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
6. Controller
api/src/modules/siap-worklog/siap-worklog.controller.ts
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ok } from '../shared/respond';
import { getAuditContext } from '../shared/request-context';
import { CreateWorklogDto } from './dto/create-worklog.dto';
import { ReviewWorklogDto } from './dto/review-worklog.dto';
import { UpdateWorklogDto } from './dto/update-worklog.dto';
import { WorklogListQueryDto } from './dto/worklog-list-query.dto';
import { SiapWorklogService } from './siap-worklog.service';

const SIAP_WORKLOG_VIEW_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
  'ANALIS_PERTAMA',
  'PENELAAH',
  'PPPK',
];

const SIAP_WORKLOG_REVIEW_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
];

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...SIAP_WORKLOG_VIEW_ROLES)
@Controller('api/v1/siap/worklogs')
export class SiapWorklogController {
  constructor(
    @Inject(SiapWorklogService)
    private readonly worklogService: SiapWorklogService,
  ) {}

  @Get('my')
  async findMy(
    @Query() query: WorklogListQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.worklogService.findMy(query, user);
    return ok(result);
  }

  @Get('team')
  @Roles(...SIAP_WORKLOG_REVIEW_ROLES)
  async findTeam(
    @Query() query: WorklogListQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.worklogService.findTeam(query, user);
    return ok(result);
  }

  @Get(':id')
  async findById(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const result = await this.worklogService.findById(id, user);
    return ok(result);
  }

  @Post()
  async create(
    @Body() dto: CreateWorklogDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    const result = await this.worklogService.create(
      dto,
      user,
      getAuditContext(request),
    );

    return ok(result, 'Buku kerja berhasil dibuat');
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateWorklogDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    const result = await this.worklogService.update(
      id,
      dto,
      user,
      getAuditContext(request),
    );

    return ok(result, 'Buku kerja berhasil diperbarui');
  }

  @Post(':id/submit')
  async submit(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    const result = await this.worklogService.submit(
      id,
      user,
      getAuditContext(request),
    );

    return ok(result, 'Buku kerja berhasil disubmit');
  }

  @Post(':id/approve')
  @Roles(...SIAP_WORKLOG_REVIEW_ROLES)
  async approve(
    @Param('id') id: string,
    @Body() dto: ReviewWorklogDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    const result = await this.worklogService.approve(
      id,
      dto,
      user,
      getAuditContext(request),
    );

    return ok(result, 'Buku kerja disetujui');
  }

  @Post(':id/revision')
  @Roles(...SIAP_WORKLOG_REVIEW_ROLES)
  async revision(
    @Param('id') id: string,
    @Body() dto: ReviewWorklogDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    const result = await this.worklogService.revision(
      id,
      dto,
      user,
      getAuditContext(request),
    );

    return ok(result, 'Buku kerja dikembalikan untuk revisi');
  }
}
7. Module
api/src/modules/siap-worklog/siap-worklog.module.ts
import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { EventsModule } from '../events/events.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SiapWorklogController } from './siap-worklog.controller';
import { SiapWorklogRepository } from './siap-worklog.repository';
import { SiapWorklogService } from './siap-worklog.service';

@Module({
  imports: [AuthModule, PrismaModule, EventsModule, AuditModule],
  controllers: [SiapWorklogController],
  providers: [SiapWorklogRepository, SiapWorklogService],
  exports: [SiapWorklogRepository, SiapWorklogService],
})
export class SiapWorklogModule {}

AuditModule sudah tersedia dan mengekspor AuditService, jadi modul Worklog bisa memakainya langsung.

8. Update AppModule
api/src/modules/app.module.ts

Tambahkan import:

import { SiapWorklogModule } from './siap-worklog/siap-worklog.module';

Tambahkan ke imports:

SiapWorklogModule,

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
    SiapWorklogModule,
    SipensiunModule,
    SiarsipModule,
    SlaModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
9. Jalankan
cd D:\Silakap_V1.0\api

npx prisma generate
npx prisma db push
npm run build
npm run dev
10. Smoke Test

Login:

$login = Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:3000/api/v1/auth/login `
  -ContentType "application/json" `
  -Body '{"username":"admin","password":"admin123"}'

$token = $login.data.accessToken

Buat worklog:

$worklog = Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:3000/api/v1/siap/worklogs `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body '{
    "workDate": "2026-05-11",
    "category": "VERIFIKASI_BERKAS",
    "title": "Verifikasi berkas pensiun BUP",
    "description": "Memeriksa kelengkapan DPCP, SK CPNS, SK PNS, SK Pangkat terakhir, KK, dan pas foto.",
    "output": "12 berkas diperiksa",
    "volume": 12,
    "obstacle": "2 berkas belum lengkap"
  }'

$worklog.success
$worklog.data.id
$worklog.data.status

Submit:

$id = $worklog.data.id

Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/api/v1/siap/worklogs/$id/submit" `
  -Headers @{ Authorization = "Bearer $token" }

Team list:

Invoke-RestMethod `
  -Uri "http://localhost:3000/api/v1/siap/worklogs/team?status=SUBMITTED" `
  -Headers @{ Authorization = "Bearer $token" }

Approve:

Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/api/v1/siap/worklogs/$id/approve" `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body '{"note":"Buku kerja sudah sesuai."}'

Cek notifikasi setelah event worker memproses:

Invoke-RestMethod `
  -Uri http://localhost:3000/api/v1/notifications `
  -Headers @{ Authorization = "Bearer $token" }