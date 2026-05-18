import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DmsDocumentCategory, Prisma } from '@prisma/client';
import { basename, extname } from 'path';
import { AuditContext, AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/auth.types';
import { DmsService, type UploadedDmsFile } from '../dms/dms.service';
import { CreateOpdSubmissionDto, OPD_MODULE_KEYS } from './dto/create-opd-submission.dto';
import { OpdSubmissionQueryDto } from './dto/opd-submission-query.dto';
import { RequestCorrectionDto, InternalActionNoteDto } from './dto/request-correction.dto';
import { SubmitOpdSubmissionDto } from './dto/submit-opd-submission.dto';
import { UpdateOpdSubmissionDto } from './dto/update-opd-submission.dto';
import { UploadSubmissionDocumentDto } from './dto/upload-submission-document.dto';
import {
  addHours,
  calculateElapsedHours,
  calculateSlaDueAt,
  calculateSlaStatus,
  diffHours,
  getSlaTargetHours,
} from './opd-sla.policy';
import {
  OpdSubmissionRecord,
  OpdSubmissionRepository,
  OpdSubmissionTimelineRecord,
} from './opd-submission.repository';

const OPD_ROLE = 'OPD';
const INTERNAL_ROLES = [
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

const RECEIVE_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
  'ANALIS_PERTAMA',
  'PENELAAH',
  'PPPK',
];

const VERIFY_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
];

const FINAL_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KABID',
];

const DOCUMENT_CORRECTION_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'ANALIS_PERTAMA',
  'PENELAAH',
  'ANALIS_MUDA',
  'ANALIS_MADYA',
];

const DOCUMENT_VERIFY_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KABID',
  'ANALIS_MUDA',
  'ANALIS_MADYA',
];

const OPD_MUTABLE_STATUSES = ['DRAFT', 'NEEDS_CORRECTION'];
const OPD_DOCUMENT_MUTABLE_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'NEEDS_CORRECTION',
  'CORRECTION_SUBMITTED',
];
const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
};

export type UploadedOpdSubmissionFile = UploadedDmsFile;

@Injectable()
export class OpdSubmissionService {
  constructor(
    private readonly repo: OpdSubmissionRepository,
    private readonly auditService: AuditService,
    private readonly dmsService: DmsService,
  ) {}

  async listMine(query: OpdSubmissionQueryDto, user: AuthUser) {
    this.ensureOpd(user);
    const filters = this.normalizeQuery(query, { opdUserId: user.id });
    const result = await this.repo.findMany(filters);

    return {
      items: result.items.map((item) => this.toResponse(item, false)),
      page: filters.page,
      limit: filters.limit,
      total: result.total,
    };
  }

  async getMine(id: string, user: AuthUser) {
    this.ensureOpd(user);
    const record = await this.getOwnedSubmission(id, user);
    return this.toResponse(record, false);
  }

  async getMySummary(query: OpdSubmissionQueryDto, user: AuthUser) {
    this.ensureOpd(user);
    return this.repo.getSummary({
      ...this.normalizeSummaryQuery(query),
      opdUserId: user.id,
    });
  }

  async getMyTimeline(id: string, user: AuthUser) {
    this.ensureOpd(user);
    const record = await this.getOwnedSubmission(id, user);
    const timeline = await this.repo.findTimeline(record.id, true);
    return timeline.map((item) => this.toTimelineResponse(item, false));
  }

  async createDraft(
    dto: CreateOpdSubmissionDto,
    user: AuthUser,
    context?: AuditContext,
  ) {
    this.ensureOpd(user);

    const created = await this.repo.create({
      moduleKey: this.normalizeModuleKey(dto.moduleKey),
      serviceType: this.normalizeRequired(dto.serviceType, 'Jenis layanan wajib diisi'),
      title: this.normalizeRequired(dto.title, 'Judul permohonan wajib diisi'),
      description: this.normalizeNullable(dto.description),
      subjectName: this.normalizeNullable(dto.subjectName),
      subjectNip: this.normalizeNullable(dto.subjectNip),
      status: 'DRAFT',
      opdUserId: user.id,
      opdUnitId: user.unitKerjaId,
      opdName: user.unitKerja?.nama ?? user.name,
      createdById: user.id,
      updatedById: user.id,
    });

    await this.writeAudit(created, 'CREATE_DRAFT', null, created, user, null, context);
    await this.writeTimeline(created, null, 'DRAFT', 'CREATE_DRAFT', user, null, 'Draft pengajuan dibuat OPD');
    return this.toResponse(created, false);
  }

  async updateMine(
    id: string,
    dto: UpdateOpdSubmissionDto,
    user: AuthUser,
    context?: AuditContext,
  ) {
    this.ensureOpd(user);
    const before = await this.getOwnedSubmission(id, user);

    if (!OPD_MUTABLE_STATUSES.includes(before.status)) {
      throw new BadRequestException('Pengajuan hanya dapat diubah saat DRAFT atau NEEDS_CORRECTION');
    }

    const updated = await this.repo.update(before.id, {
      ...(dto.serviceType !== undefined
        ? { serviceType: this.normalizeRequired(dto.serviceType, 'Jenis layanan wajib diisi') }
        : {}),
      ...(dto.title !== undefined
        ? { title: this.normalizeRequired(dto.title, 'Judul permohonan wajib diisi') }
        : {}),
      ...(dto.description !== undefined
        ? { description: this.normalizeNullable(dto.description) }
        : {}),
      ...(dto.subjectName !== undefined
        ? { subjectName: this.normalizeNullable(dto.subjectName) }
        : {}),
      ...(dto.subjectNip !== undefined
        ? { subjectNip: this.normalizeNullable(dto.subjectNip) }
        : {}),
      updatedById: user.id,
    });

    await this.writeAudit(updated, 'UPDATE_DRAFT', before, updated, user, null, context);
    return this.toResponse(updated, false);
  }

  async submitMine(
    id: string,
    dto: SubmitOpdSubmissionDto,
    user: AuthUser,
    context?: AuditContext,
  ) {
    this.ensureOpd(user);
    const before = await this.getOwnedSubmission(id, user);

    if (before.status !== 'DRAFT') {
      throw new BadRequestException('Hanya draft yang dapat dikirim');
    }

    const submissionNumber = before.submissionNumber ?? await this.generateSubmissionNumber();
    const now = new Date();
    const targetHours = getSlaTargetHours(before.moduleKey, before.serviceType);
    const slaDueAt = calculateSlaDueAt(now, targetHours);
    const updated = await this.repo.update(before.id, {
      submissionNumber,
      status: 'SUBMITTED',
      submittedAt: now,
      slaStartedAt: now,
      slaDueAt,
      slaTargetHours: targetHours,
      slaElapsedHours: 0,
      slaPausedHours: 0,
      slaPausedAt: null,
      slaStoppedAt: null,
      slaStatus: 'ON_TRACK',
      lastStatusChangedAt: now,
      lastStatusChangedById: user.id,
      updatedById: user.id,
    });

    await this.writeAudit(updated, 'SUBMIT', before, updated, user, dto.note, context);
    await this.writeTimeline(updated, before.status, 'SUBMITTED', 'SUBMIT', user, dto.note, 'Pengajuan dikirim OPD dan SLA mulai dihitung');
    return this.toResponse(updated, false);
  }

  async cancelMine(
    id: string,
    dto: SubmitOpdSubmissionDto,
    user: AuthUser,
    context?: AuditContext,
  ) {
    this.ensureOpd(user);
    const before = await this.getOwnedSubmission(id, user);

    if (!['DRAFT', 'SUBMITTED'].includes(before.status)) {
      throw new BadRequestException('Pengajuan yang sudah diproses internal tidak dapat dibatalkan OPD');
    }

    const now = new Date();
    const updated = await this.repo.update(before.id, {
      status: 'CANCELLED',
      slaStoppedAt: now,
      slaStatus: 'CANCELLED',
      lastStatusChangedAt: now,
      lastStatusChangedById: user.id,
      updatedById: user.id,
    });

    await this.writeAudit(updated, 'CANCEL', before, updated, user, dto.note, context);
    await this.writeTimeline(updated, before.status, 'CANCELLED', 'CANCEL', user, dto.note, 'Pengajuan dibatalkan OPD');
    return this.toResponse(updated, false);
  }

  async addDocumentMine(
    id: string,
    dto: UploadSubmissionDocumentDto,
    user: AuthUser,
    context?: AuditContext,
  ) {
    this.ensureOpd(user);
    const before = await this.getOwnedSubmission(id, user);

    if (!OPD_DOCUMENT_MUTABLE_STATUSES.includes(before.status)) {
      throw new BadRequestException('Dokumen hanya dapat ditambahkan sebelum pengajuan final');
    }

    await this.repo.addDocument({
      submissionId: before.id,
      dmsDocumentId: this.normalizeNullable(dto.dmsDocumentId),
      documentType: this.normalizeRequired(dto.documentType, 'Jenis dokumen wajib diisi'),
      title: this.normalizeRequired(dto.title, 'Judul dokumen wajib diisi'),
      status: 'TERUNGGAH',
      note: this.normalizeNullable(dto.note),
      uploadedById: user.id,
    });

    const updated = await this.repo.findById(before.id);
    if (!updated) {
      throw new NotFoundException('Pengajuan OPD tidak ditemukan');
    }

    await this.writeAudit(updated, 'UPLOAD_DOCUMENT', before, updated, user, dto.note, context);
    return this.toResponse(updated, false);
  }

  async uploadDocumentFileMine(
    id: string,
    dto: UploadSubmissionDocumentDto,
    file: UploadedOpdSubmissionFile | undefined,
    user: AuthUser,
    context?: AuditContext,
  ) {
    this.ensureOpd(user);
    const before = await this.getOwnedSubmission(id, user);

    if (!['DRAFT', 'NEEDS_CORRECTION', 'SUBMITTED'].includes(before.status)) {
      throw new BadRequestException(
        'File dokumen hanya dapat diunggah saat DRAFT, SUBMITTED, atau NEEDS_CORRECTION',
      );
    }

    const validatedFile = this.validateUploadedFile(file);
    const dmsDocument = await this.dmsService.createUploadedOpdSubmissionDocument(
      {
        submissionId: before.id,
        submissionNumber: before.submissionNumber,
        title: this.normalizeRequired(dto.title, 'Judul dokumen wajib diisi'),
        description: this.normalizeNullable(dto.note),
        moduleKey: before.moduleKey,
        serviceType: before.serviceType,
        documentType: this.normalizeRequired(dto.documentType, 'Jenis dokumen wajib diisi'),
        category: this.normalizeDmsCategory(dto.category),
        subCategory:
          this.normalizeOptional(dto.subCategory) ??
          this.defaultDmsSubCategory(before.moduleKey),
        accessLevel: 'INTERNAL',
        unitKerjaId: before.opdUnitId,
        tags: [
          'opd-submission',
          before.submissionNumber ?? before.id,
          before.moduleKey,
          before.serviceType,
          dto.documentType,
        ],
        file: validatedFile,
      },
      user,
      context,
    );

    await this.repo.addDocument({
      submissionId: before.id,
      dmsDocumentId: dmsDocument.id,
      documentType: this.normalizeRequired(dto.documentType, 'Jenis dokumen wajib diisi'),
      title: this.normalizeRequired(dto.title, 'Judul dokumen wajib diisi'),
      status: 'UPLOADED',
      note: this.normalizeNullable(dto.note),
      uploadedById: user.id,
      uploadedByRole: this.primaryRole(user),
      originalFileName: basename(validatedFile.originalname),
      mimeType: validatedFile.mimetype,
      sizeBytes: validatedFile.size,
      storageKey: dmsDocument.storagePath ?? null,
    });

    const updated = await this.repo.findById(before.id);
    if (!updated) {
      throw new NotFoundException('Pengajuan OPD tidak ditemukan');
    }

    await this.writeAudit(
      updated,
      'UPLOAD_DOCUMENT_FILE',
      before,
      updated,
      user,
      dto.note,
      context,
    );
    return this.toResponse(updated, false);
  }

  async submitCorrectionMine(
    id: string,
    dto: SubmitOpdSubmissionDto,
    user: AuthUser,
    context?: AuditContext,
  ) {
    this.ensureOpd(user);
    const before = await this.getOwnedSubmission(id, user);

    if (before.status !== 'NEEDS_CORRECTION') {
      throw new BadRequestException('Perbaikan hanya dapat dikirim saat status NEEDS_CORRECTION');
    }

    const now = new Date();
    const pausedDuration = before.slaPausedAt
      ? diffHours(before.slaPausedAt, now)
      : 0;
    const nextPausedHours = (before.slaPausedHours ?? 0) + pausedDuration;
    const nextDueAt = before.slaDueAt && pausedDuration > 0
      ? addHours(before.slaDueAt, pausedDuration)
      : before.slaDueAt;
    const updated = await this.repo.update(before.id, {
      status: 'CORRECTION_SUBMITTED',
      correctionNote: null,
      slaPausedAt: null,
      slaResumedAt: now,
      slaPausedHours: nextPausedHours,
      slaDueAt: nextDueAt,
      slaStatus: calculateSlaStatus(
        {
          ...before,
          status: 'CORRECTION_SUBMITTED',
          slaPausedAt: null,
          slaDueAt: nextDueAt,
        },
        now,
      ),
      lastStatusChangedAt: now,
      lastStatusChangedById: user.id,
      updatedById: user.id,
    });

    await this.writeAudit(updated, 'CORRECTION_SUBMITTED', before, updated, user, dto.note, context);
    await this.writeTimeline(updated, before.status, 'CORRECTION_SUBMITTED', 'CORRECTION_SUBMITTED', user, dto.note, 'Perbaikan berkas dikirim OPD dan SLA dilanjutkan');
    return this.toResponse(updated, false);
  }

  async listInternal(query: OpdSubmissionQueryDto, user: AuthUser) {
    this.ensureInternal(user);
    const filters = this.normalizeQuery(query);

    if (query.slaStatus) {
      const candidates = await this.repo.findSlaItems({
        ...this.normalizeSummaryQuery(query),
        slaStatus: undefined,
      });
      const filtered = this.filterByComputedSlaStatus(
        candidates,
        query.slaStatus,
        new Date(),
      );
      const start = (filters.page - 1) * filters.limit;
      const items = filtered.slice(start, start + filters.limit);

      return {
        items: items.map((item) => this.toResponse(item, true)),
        page: filters.page,
        limit: filters.limit,
        total: filtered.length,
      };
    }

    const result = await this.repo.findMany(filters);

    return {
      items: result.items.map((item) => this.toResponse(item, true)),
      page: filters.page,
      limit: filters.limit,
      total: result.total,
    };
  }

  async getInternal(id: string, user: AuthUser) {
    this.ensureInternal(user);
    const record = await this.getSubmission(id);
    return this.toResponse(record, true);
  }

  async getInternalSummary(query: OpdSubmissionQueryDto, user: AuthUser) {
    this.ensureInternal(user);
    return this.repo.getSummary(this.normalizeSummaryQuery(query));
  }

  async getInternalTimeline(id: string, user: AuthUser) {
    this.ensureInternal(user);
    const record = await this.getSubmission(id);
    const timeline = await this.repo.findTimeline(record.id, false);
    return timeline.map((item) => this.toTimelineResponse(item, true));
  }

  async getInternalSlaSummary(query: OpdSubmissionQueryDto, user: AuthUser) {
    this.ensureInternal(user);
    const items = await this.repo.findSlaItems(this.normalizeSummaryQuery(query));
    const now = new Date();
    const filtered = this.filterByComputedSlaStatus(items, query.slaStatus, now);
    const completed = filtered.filter((item) =>
      ['COMPLETED', 'REJECTED'].includes(item.status),
    );
    const elapsedTotal = filtered.reduce(
      (sum, item) =>
        sum +
        calculateElapsedHours({
          startedAt: item.slaStartedAt,
          stoppedAt: item.slaStoppedAt,
          pausedAt: item.slaPausedAt,
          pausedHours: item.slaPausedHours,
          now,
        }),
      0,
    );
    const byModuleMap = new Map<string, { total: number; overdue: number; dueSoon: number }>();

    for (const item of filtered) {
      const slaStatus = calculateSlaStatus(item, now);
      const current = byModuleMap.get(item.moduleKey) ?? {
        total: 0,
        overdue: 0,
        dueSoon: 0,
      };
      current.total += 1;
      if (slaStatus === 'OVERDUE') current.overdue += 1;
      if (slaStatus === 'DUE_SOON') current.dueSoon += 1;
      byModuleMap.set(item.moduleKey, current);
    }

    return {
      totalActive: filtered.filter((item) => !['COMPLETED', 'REJECTED', 'CANCELLED'].includes(item.status)).length,
      onTrack: filtered.filter((item) => calculateSlaStatus(item, now) === 'ON_TRACK').length,
      dueSoon: filtered.filter((item) => calculateSlaStatus(item, now) === 'DUE_SOON').length,
      overdue: filtered.filter((item) => calculateSlaStatus(item, now) === 'OVERDUE').length,
      pausedForCorrection: filtered.filter((item) => calculateSlaStatus(item, now) === 'PAUSED_FOR_CORRECTION').length,
      completed: completed.length,
      averageElapsedHours:
        filtered.length > 0 ? Math.round(elapsedTotal / filtered.length) : 0,
      byModule: [...byModuleMap.entries()].map(([moduleKey, value]) => ({
        moduleKey,
        ...value,
      })),
      topOverdue: filtered
        .filter((item) => calculateSlaStatus(item, now) === 'OVERDUE')
        .slice(0, 5)
        .map((item) => this.toSlaQueueItem(item, now)),
    };
  }

  async getInternalSlaQueue(
    query: OpdSubmissionQueryDto,
    user: AuthUser,
    slaStatus: string,
  ) {
    this.ensureInternal(user);
    const items = await this.repo.findSlaItems(this.normalizeSummaryQuery(query));
    const now = new Date();
    const filtered = this.filterByComputedSlaStatus(items, slaStatus, now);

    return {
      items: filtered.map((item) => this.toSlaQueueItem(item, now)),
      total: filtered.length,
    };
  }

  async receive(id: string, dto: InternalActionNoteDto, user: AuthUser, context?: AuditContext) {
    this.ensureInternalAction(user, RECEIVE_ROLES, 'menerima pengajuan OPD');
    return this.changeInternalStatus(id, 'RECEIVE', ['SUBMITTED', 'CORRECTION_SUBMITTED'], {
      status: 'RECEIVED',
      receivedAt: new Date(),
      assignedToId: user.id,
      updatedById: user.id,
    }, dto.note, user, context);
  }

  async startVerification(id: string, dto: InternalActionNoteDto, user: AuthUser, context?: AuditContext) {
    this.ensureInternalAction(user, RECEIVE_ROLES, 'memulai verifikasi OPD');
    return this.changeInternalStatus(id, 'START_VERIFICATION', ['RECEIVED'], {
      status: 'IN_VERIFICATION',
      assignedToId: user.id,
      updatedById: user.id,
    }, dto.note, user, context);
  }

  async requestCorrection(id: string, dto: RequestCorrectionDto, user: AuthUser, context?: AuditContext) {
    this.ensureInternalAction(user, RECEIVE_ROLES, 'meminta perbaikan berkas');
    const note = this.normalizeRequired(dto.note, 'Catatan perbaikan wajib diisi');
    return this.changeInternalStatus(id, 'REQUEST_CORRECTION', ['RECEIVED', 'IN_VERIFICATION', 'CORRECTION_SUBMITTED'], {
      status: 'NEEDS_CORRECTION',
      correctionNote: note,
      updatedById: user.id,
    }, note, user, context);
  }

  async verify(id: string, dto: InternalActionNoteDto, user: AuthUser, context?: AuditContext) {
    this.ensureInternalAction(user, VERIFY_ROLES, 'memverifikasi pengajuan OPD');
    return this.changeInternalStatus(id, 'VERIFY', ['RECEIVED', 'IN_VERIFICATION', 'CORRECTION_SUBMITTED'], {
      status: 'VERIFIED',
      verifiedAt: new Date(),
      updatedById: user.id,
    }, dto.note, user, context);
  }

  async reject(id: string, dto: InternalActionNoteDto, user: AuthUser, context?: AuditContext) {
    this.ensureInternalAction(user, VERIFY_ROLES, 'menolak pengajuan OPD');
    return this.changeInternalStatus(id, 'REJECT', ['SUBMITTED', 'RECEIVED', 'IN_VERIFICATION', 'NEEDS_CORRECTION', 'CORRECTION_SUBMITTED', 'VERIFIED'], {
      status: 'REJECTED',
      rejectedAt: new Date(),
      updatedById: user.id,
    }, dto.note, user, context);
  }

  async complete(id: string, dto: InternalActionNoteDto, user: AuthUser, context?: AuditContext) {
    this.ensureInternalAction(user, FINAL_ROLES, 'menyelesaikan pengajuan OPD');
    return this.changeInternalStatus(id, 'COMPLETE', ['VERIFIED', 'IN_VERIFICATION'], {
      status: 'COMPLETED',
      completedAt: new Date(),
      updatedById: user.id,
    }, dto.note, user, context);
  }

  async uploadInternalDocumentFile(
    id: string,
    dto: UploadSubmissionDocumentDto,
    file: UploadedOpdSubmissionFile | undefined,
    user: AuthUser,
    context?: AuditContext,
  ) {
    this.ensureInternalAction(user, RECEIVE_ROLES, 'mengunggah dokumen internal PPIK');
    const before = await this.getSubmission(id);
    const validatedFile = this.validateUploadedFile(file);
    const dmsDocument = await this.dmsService.createUploadedOpdSubmissionDocument(
      {
        submissionId: before.id,
        submissionNumber: before.submissionNumber,
        title: this.normalizeRequired(dto.title, 'Judul dokumen wajib diisi'),
        description: this.normalizeNullable(dto.note),
        moduleKey: before.moduleKey,
        serviceType: before.serviceType,
        documentType: this.normalizeRequired(dto.documentType, 'Jenis dokumen wajib diisi'),
        category: this.normalizeDmsCategory(dto.category),
        subCategory:
          this.normalizeOptional(dto.subCategory) ??
          this.defaultDmsSubCategory(before.moduleKey),
        accessLevel: 'INTERNAL',
        unitKerjaId: before.opdUnitId,
        tags: [
          'opd-submission',
          'internal-ppik',
          before.submissionNumber ?? before.id,
          before.moduleKey,
          before.serviceType,
          dto.documentType,
        ],
        file: validatedFile,
      },
      user,
      context,
    );

    await this.repo.addDocument({
      submissionId: before.id,
      dmsDocumentId: dmsDocument.id,
      documentType: this.normalizeRequired(dto.documentType, 'Jenis dokumen wajib diisi'),
      title: this.normalizeRequired(dto.title, 'Judul dokumen wajib diisi'),
      status: 'UPLOADED',
      note: this.normalizeNullable(dto.note),
      uploadedById: user.id,
      uploadedByRole: this.primaryRole(user),
      originalFileName: basename(validatedFile.originalname),
      mimeType: validatedFile.mimetype,
      sizeBytes: validatedFile.size,
      storageKey: dmsDocument.storagePath ?? null,
    });

    const updated = await this.getSubmission(before.id);
    await this.writeAudit(
      updated,
      'INTERNAL_UPLOAD_DOCUMENT_FILE',
      before,
      updated,
      user,
      dto.note,
      context,
    );
    return this.toResponse(updated, true);
  }

  async verifyDocument(
    id: string,
    documentId: string,
    dto: InternalActionNoteDto,
    user: AuthUser,
    context?: AuditContext,
  ) {
    this.ensureInternalAction(user, DOCUMENT_VERIFY_ROLES, 'memverifikasi dokumen OPD');
    return this.changeDocumentStatus(
      id,
      documentId,
      'DOCUMENT_VERIFIED',
      'VERIFIED',
      dto.note,
      user,
      context,
    );
  }

  async requestDocumentCorrection(
    id: string,
    documentId: string,
    dto: RequestCorrectionDto,
    user: AuthUser,
    context?: AuditContext,
  ) {
    this.ensureInternalAction(user, DOCUMENT_CORRECTION_ROLES, 'meminta perbaikan dokumen OPD');
    const note = this.normalizeRequired(dto.note, 'Catatan perbaikan dokumen wajib diisi');
    return this.changeDocumentStatus(
      id,
      documentId,
      'DOCUMENT_CORRECTION_REQUESTED',
      'NEEDS_CORRECTION',
      note,
      user,
      context,
    );
  }

  async rejectDocument(
    id: string,
    documentId: string,
    dto: RequestCorrectionDto,
    user: AuthUser,
    context?: AuditContext,
  ) {
    this.ensureInternalAction(user, DOCUMENT_VERIFY_ROLES, 'menolak dokumen OPD');
    const note = this.normalizeRequired(dto.note, 'Catatan penolakan dokumen wajib diisi');
    return this.changeDocumentStatus(
      id,
      documentId,
      'DOCUMENT_REJECTED',
      'REJECTED',
      note,
      user,
      context,
    );
  }

  private async changeDocumentStatus(
    id: string,
    documentId: string,
    action: string,
    status: string,
    note: string | undefined,
    user: AuthUser,
    context?: AuditContext,
  ) {
    const before = await this.getSubmission(id);
    const document = await this.repo.findDocumentById(documentId.trim());

    if (!document || document.submissionId !== before.id) {
      throw new NotFoundException('Dokumen pengajuan OPD tidak ditemukan');
    }

    await this.repo.updateDocument(document.id, {
      status,
      note: note ?? document.note,
    });

    const updated = await this.getSubmission(before.id);
    await this.writeAudit(updated, action, before, updated, user, note, context);
    return this.toResponse(updated, true);
  }

  private async changeInternalStatus(
    id: string,
    action: string,
    allowedFrom: string[],
    data: Prisma.OpdSubmissionUncheckedUpdateInput,
    note: string | undefined,
    user: AuthUser,
    context?: AuditContext,
  ) {
    const before = await this.getSubmission(id);

    if (!allowedFrom.includes(before.status)) {
      throw new BadRequestException(`Status ${before.status} tidak valid untuk aksi ${action}`);
    }

    const toStatus = String(data.status ?? before.status);
    const updated = await this.repo.update(before.id, {
      ...data,
      ...this.buildSlaPatch(before, toStatus, user),
    });
    await this.writeAudit(updated, action, before, updated, user, note, context);
    await this.writeTimeline(
      updated,
      before.status,
      toStatus,
      action,
      user,
      note,
      this.publicTimelineNote(action, note),
    );
    return this.toResponse(updated, true);
  }

  private buildSlaPatch(
    before: OpdSubmissionRecord,
    toStatus: string,
    user: AuthUser,
  ): Prisma.OpdSubmissionUncheckedUpdateInput {
    const now = new Date();
    const base: Prisma.OpdSubmissionUncheckedUpdateInput = {
      lastStatusChangedAt: now,
      lastStatusChangedById: user.id,
    };

    if (toStatus === 'NEEDS_CORRECTION') {
      return {
        ...base,
        slaPausedAt: now,
        slaElapsedHours: calculateElapsedHours({
          startedAt: before.slaStartedAt,
          pausedAt: now,
          pausedHours: before.slaPausedHours,
        }),
        slaStatus: 'PAUSED_FOR_CORRECTION',
      };
    }

    if (toStatus === 'COMPLETED' || toStatus === 'REJECTED') {
      return {
        ...base,
        slaStoppedAt: now,
        slaElapsedHours: calculateElapsedHours({
          startedAt: before.slaStartedAt,
          stoppedAt: now,
          pausedHours: before.slaPausedHours,
        }),
        slaStatus: 'COMPLETED',
      };
    }

    return {
      ...base,
      slaStatus: calculateSlaStatus(
        {
          ...before,
          status: toStatus,
        },
        now,
      ),
    };
  }

  private async getOwnedSubmission(id: string, user: AuthUser) {
    const record = await this.getSubmission(id);

    if (record.opdUserId !== user.id) {
      throw new ForbiddenException('Anda hanya dapat mengakses pengajuan OPD milik sendiri');
    }

    return record;
  }

  private async getSubmission(id: string) {
    const record = await this.repo.findById(id.trim());

    if (!record) {
      throw new NotFoundException('Pengajuan OPD tidak ditemukan');
    }

    return record;
  }

  private async generateSubmissionNumber() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    const count = await this.repo.countSubmittedOnDay(start, end);
    const datePart = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('');

    return `OPD-${datePart}-${String(count + 1).padStart(4, '0')}`;
  }

  private normalizeQuery(
    query: OpdSubmissionQueryDto,
    forced?: { opdUserId?: string },
  ) {
    return {
      ...this.normalizeSummaryQuery(query),
      opdUserId: forced?.opdUserId,
      page: this.normalizePositiveInt(query.page, 1, 1, 10000),
      limit: this.normalizePositiveInt(query.limit, 20, 1, 100),
    };
  }

  private normalizeSummaryQuery(query: OpdSubmissionQueryDto) {
    return {
      q: this.normalizeOptional(query.q),
      status: this.normalizeOptional(query.status),
      slaStatus: this.normalizeOptional(query.slaStatus),
      moduleKey: query.moduleKey ? this.normalizeModuleKey(query.moduleKey) : undefined,
      serviceType: this.normalizeOptional(query.serviceType),
      opdUnitId: this.normalizeOptional(query.opdUnitId),
      from: this.normalizeDate(query.from),
      to: this.normalizeDate(query.to),
    };
  }

  private normalizeModuleKey(moduleKey: string) {
    const normalized = this.normalizeRequired(moduleKey, 'Module OPD wajib diisi');

    if (!OPD_MODULE_KEYS.includes(normalized as typeof OPD_MODULE_KEYS[number])) {
      throw new BadRequestException('Module OPD tidak valid');
    }

    return normalized;
  }

  private normalizeOptional(value: string | undefined | null) {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }

  private normalizeNullable(value: string | undefined | null) {
    return this.normalizeOptional(value) ?? null;
  }

  private normalizeRequired(value: string | undefined | null, message: string) {
    const normalized = this.normalizeOptional(value);

    if (!normalized) {
      throw new BadRequestException(message);
    }

    return normalized;
  }

  private normalizeDate(value: string | undefined | null) {
    const normalized = this.normalizeOptional(value);
    if (!normalized) {
      return undefined;
    }

    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  private validateUploadedFile(file: UploadedOpdSubmissionFile | undefined) {
    if (!file) {
      throw new BadRequestException('File wajib diunggah');
    }

    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      throw new BadRequestException('Ukuran file maksimal 10 MB');
    }

    const allowedExtensions = ALLOWED_FILE_TYPES[file.mimetype];
    if (!allowedExtensions) {
      throw new BadRequestException(
        'Tipe file tidak didukung. Gunakan PDF, JPG, PNG, DOCX, atau XLSX',
      );
    }

    const extension = extname(basename(file.originalname)).toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      throw new BadRequestException('Ekstensi file tidak sesuai dengan tipe file');
    }

    return file;
  }

  private normalizeDmsCategory(value: string | undefined | null) {
    const normalized = this.normalizeOptional(value);

    if (!normalized) {
      return DmsDocumentCategory.BUKTI_DUKUNG;
    }

    return Object.values(DmsDocumentCategory).includes(
      normalized as DmsDocumentCategory,
    )
      ? (normalized as DmsDocumentCategory)
      : DmsDocumentCategory.BUKTI_DUKUNG;
  }

  private defaultDmsSubCategory(moduleKey: string) {
    const subCategories: Record<string, string> = {
      SIPENSIUN: 'DOKUMEN_PENSIUN',
      SIDATA: 'DOKUMEN_DATA_ASN',
      LAYANAN_KEPEGAWAIAN: 'DOKUMEN_LAYANAN',
      DMS: 'DOKUMEN_DMS',
    };

    return subCategories[moduleKey] ?? 'DOKUMEN_LAYANAN';
  }

  private normalizePositiveInt(
    value: string | undefined,
    fallback: number,
    min: number,
    max: number,
  ) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      return fallback;
    }

    return Math.min(Math.max(Math.trunc(parsed), min), max);
  }

  private ensureOpd(user: AuthUser) {
    if (!user.roles.includes(OPD_ROLE)) {
      throw new ForbiddenException('Endpoint ini khusus OPD');
    }
  }

  private ensureInternal(user: AuthUser) {
    if (!user.roles.some((role) => INTERNAL_ROLES.includes(role))) {
      throw new ForbiddenException('Endpoint ini khusus internal PPIK');
    }
  }

  private ensureInternalAction(user: AuthUser, allowedRoles: string[], actionLabel: string) {
    this.ensureInternal(user);

    if (!user.roles.some((role) => allowedRoles.includes(role))) {
      throw new ForbiddenException(`Role Anda tidak berwenang untuk ${actionLabel}`);
    }
  }

  private primaryRole(user: AuthUser) {
    return user.roles[0] ?? 'UNKNOWN';
  }

  private async writeAudit(
    target: OpdSubmissionRecord,
    action: string,
    before: OpdSubmissionRecord | null,
    after: OpdSubmissionRecord,
    user: AuthUser,
    note?: string | null,
    context?: AuditContext,
  ) {
    await this.repo.createAuditLog({
      submissionId: target.id,
      action,
      beforeJson: before ? this.toAuditJson(before) : undefined,
      afterJson: this.toAuditJson(after),
      actorId: user.id,
      actorRole: this.primaryRole(user),
      note: note ?? null,
    });

    await this.auditService.record({
      entityType: 'OPD_SUBMISSION',
      entityId: target.id,
      action,
      performedBy: user.id,
      beforeData: before ? this.toAuditJson(before) : undefined,
      afterData: this.toAuditJson(after),
      context,
    });
  }

  private async writeTimeline(
    target: OpdSubmissionRecord,
    fromStatus: string | null,
    toStatus: string,
    action: string,
    user: AuthUser,
    note?: string | null,
    publicNote?: string | null,
    isVisibleToOpd = true,
  ) {
    await this.repo.createTimeline({
      submissionId: target.id,
      fromStatus,
      toStatus,
      action,
      actorId: user.id,
      actorRole: this.primaryRole(user),
      note: note ?? null,
      publicNote: publicNote ?? note ?? null,
      isVisibleToOpd,
    });
  }

  private publicTimelineNote(action: string, note?: string | null) {
    const notes: Record<string, string> = {
      RECEIVE: 'Pengajuan diterima oleh PPIK',
      START_VERIFICATION: 'Verifikasi pengajuan dimulai',
      REQUEST_CORRECTION: note ?? 'PPIK meminta perbaikan berkas. SLA internal dijeda sampai OPD mengirim perbaikan.',
      VERIFY: 'Pengajuan telah diverifikasi PPIK',
      REJECT: note ?? 'Pengajuan ditolak PPIK',
      COMPLETE: 'Pengajuan selesai diproses',
    };

    return notes[action] ?? note ?? null;
  }

  private filterByComputedSlaStatus(
    items: OpdSubmissionRecord[],
    requestedStatus: string | undefined,
    now: Date,
  ) {
    if (!requestedStatus) {
      return items;
    }

    return items.filter((item) => calculateSlaStatus(item, now) === requestedStatus);
  }

  private toSlaQueueItem(record: OpdSubmissionRecord, now: Date) {
    const slaStatus = calculateSlaStatus(record, now);

    return {
      id: record.id,
      submissionNumber: record.submissionNumber,
      opdName: record.opdName,
      moduleKey: record.moduleKey,
      serviceType: record.serviceType,
      title: record.title,
      status: record.status,
      slaStatus,
      slaDueAt: record.slaDueAt?.toISOString() ?? null,
      slaTargetHours: record.slaTargetHours,
      slaElapsedHours: calculateElapsedHours({
        startedAt: record.slaStartedAt,
        stoppedAt: record.slaStoppedAt,
        pausedAt: record.slaPausedAt,
        pausedHours: record.slaPausedHours,
        now,
      }),
    };
  }

  private toTimelineResponse(
    item: OpdSubmissionTimelineRecord,
    internal: boolean,
  ) {
    return {
      id: item.id,
      submissionId: item.submissionId,
      fromStatus: item.fromStatus,
      toStatus: item.toStatus,
      action: item.action,
      actorId: internal ? item.actorId : undefined,
      actorRole: internal ? item.actorRole : undefined,
      note: internal ? item.note : undefined,
      publicNote: item.publicNote,
      isVisibleToOpd: item.isVisibleToOpd,
      createdAt: item.createdAt.toISOString(),
    };
  }

  private toAuditJson(record: OpdSubmissionRecord): Prisma.InputJsonValue {
    return {
      id: record.id,
      submissionNumber: record.submissionNumber,
      opdUserId: record.opdUserId,
      opdUnitId: record.opdUnitId,
      opdName: record.opdName,
      serviceType: record.serviceType,
      moduleKey: record.moduleKey,
      subjectName: record.subjectName,
      subjectNip: record.subjectNip,
      title: record.title,
      status: record.status,
      correctionNote: record.correctionNote,
      submittedAt: record.submittedAt?.toISOString() ?? null,
      receivedAt: record.receivedAt?.toISOString() ?? null,
      verifiedAt: record.verifiedAt?.toISOString() ?? null,
      completedAt: record.completedAt?.toISOString() ?? null,
      rejectedAt: record.rejectedAt?.toISOString() ?? null,
      slaStartedAt: record.slaStartedAt?.toISOString() ?? null,
      slaPausedAt: record.slaPausedAt?.toISOString() ?? null,
      slaResumedAt: record.slaResumedAt?.toISOString() ?? null,
      slaStoppedAt: record.slaStoppedAt?.toISOString() ?? null,
      slaDueAt: record.slaDueAt?.toISOString() ?? null,
      slaTargetHours: record.slaTargetHours,
      slaElapsedHours: record.slaElapsedHours,
      slaPausedHours: record.slaPausedHours,
      slaStatus: record.slaStatus,
      documentCount: record.documents.length,
    };
  }

  private toResponse(record: OpdSubmissionRecord, internal: boolean) {
    const visibleDocuments = internal
      ? record.documents
      : record.documents.filter(
          (document) =>
            !document.uploadedByRole || document.uploadedByRole === OPD_ROLE,
        );

    return {
      id: record.id,
      submissionNumber: record.submissionNumber,
      opdUserId: internal ? record.opdUserId : undefined,
      opdUnitId: record.opdUnitId,
      opdName: record.opdName,
      serviceType: record.serviceType,
      moduleKey: record.moduleKey,
      subjectName: record.subjectName,
      subjectNip: record.subjectNip,
      title: record.title,
      description: record.description,
      status: record.status,
      correctionNote: record.correctionNote,
      submittedAt: record.submittedAt?.toISOString() ?? null,
      receivedAt: record.receivedAt?.toISOString() ?? null,
      verifiedAt: record.verifiedAt?.toISOString() ?? null,
      completedAt: record.completedAt?.toISOString() ?? null,
      rejectedAt: record.rejectedAt?.toISOString() ?? null,
      slaStartedAt: record.slaStartedAt?.toISOString() ?? null,
      slaPausedAt: record.slaPausedAt?.toISOString() ?? null,
      slaResumedAt: record.slaResumedAt?.toISOString() ?? null,
      slaStoppedAt: record.slaStoppedAt?.toISOString() ?? null,
      slaDueAt: record.slaDueAt?.toISOString() ?? null,
      slaTargetHours: record.slaTargetHours,
      slaElapsedHours: calculateElapsedHours({
        startedAt: record.slaStartedAt,
        stoppedAt: record.slaStoppedAt,
        pausedAt: record.slaPausedAt,
        pausedHours: record.slaPausedHours,
      }),
      slaPausedHours: record.slaPausedHours,
      slaStatus: calculateSlaStatus(record),
      lastStatusChangedAt: record.lastStatusChangedAt?.toISOString() ?? null,
      lastStatusChangedById: internal ? record.lastStatusChangedById : undefined,
      createdById: internal ? record.createdById : undefined,
      updatedById: internal ? record.updatedById : undefined,
      assignedToId: internal ? record.assignedToId : undefined,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      documents: visibleDocuments.map((document) => ({
        id: document.id,
        submissionId: document.submissionId,
        dmsDocumentId: document.dmsDocumentId,
        documentType: document.documentType,
        title: document.title,
        status: document.status,
        note: document.note,
        uploadedById: internal ? document.uploadedById : undefined,
        uploadedByRole: internal ? document.uploadedByRole : undefined,
        originalFileName: document.originalFileName,
        mimeType: document.mimeType,
        sizeBytes: document.sizeBytes,
        storageKey: internal ? document.storageKey : undefined,
        uploadedAt: document.uploadedAt.toISOString(),
        createdAt: document.createdAt.toISOString(),
        updatedAt: document.updatedAt.toISOString(),
      })),
      auditLogs: record.auditLogs.map((log) => ({
        id: log.id,
        submissionId: log.submissionId,
        action: log.action,
        beforeJson: internal ? log.beforeJson : undefined,
        afterJson: internal ? log.afterJson : undefined,
        actorId: internal ? log.actorId : undefined,
        actorRole: internal ? log.actorRole : undefined,
        note: log.note,
        createdAt: log.createdAt.toISOString(),
      })),
      timelines: record.timelines
        .filter((item) => internal || item.isVisibleToOpd)
        .map((item) => this.toTimelineResponse(item, internal)),
    };
  }
}
