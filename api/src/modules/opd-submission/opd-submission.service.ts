import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditContext, AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/auth.types';
import { CreateOpdSubmissionDto, OPD_MODULE_KEYS } from './dto/create-opd-submission.dto';
import { OpdSubmissionQueryDto } from './dto/opd-submission-query.dto';
import { RequestCorrectionDto, InternalActionNoteDto } from './dto/request-correction.dto';
import { SubmitOpdSubmissionDto } from './dto/submit-opd-submission.dto';
import { UpdateOpdSubmissionDto } from './dto/update-opd-submission.dto';
import { UploadSubmissionDocumentDto } from './dto/upload-submission-document.dto';
import {
  OpdSubmissionRecord,
  OpdSubmissionRepository,
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

const OPD_MUTABLE_STATUSES = ['DRAFT', 'NEEDS_CORRECTION'];
const OPD_DOCUMENT_MUTABLE_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'NEEDS_CORRECTION',
  'CORRECTION_SUBMITTED',
];

@Injectable()
export class OpdSubmissionService {
  constructor(
    private readonly repo: OpdSubmissionRepository,
    private readonly auditService: AuditService,
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
    const updated = await this.repo.update(before.id, {
      submissionNumber,
      status: 'SUBMITTED',
      submittedAt: now,
      updatedById: user.id,
    });

    await this.writeAudit(updated, 'SUBMIT', before, updated, user, dto.note, context);
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

    if (!['DRAFT', 'SUBMITTED', 'CORRECTION_SUBMITTED'].includes(before.status)) {
      throw new BadRequestException('Pengajuan yang sudah diproses internal tidak dapat dibatalkan OPD');
    }

    const updated = await this.repo.update(before.id, {
      status: 'CANCELLED',
      updatedById: user.id,
    });

    await this.writeAudit(updated, 'CANCEL', before, updated, user, dto.note, context);
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

    const updated = await this.repo.update(before.id, {
      status: 'CORRECTION_SUBMITTED',
      correctionNote: null,
      updatedById: user.id,
    });

    await this.writeAudit(updated, 'CORRECTION_SUBMITTED', before, updated, user, dto.note, context);
    return this.toResponse(updated, false);
  }

  async listInternal(query: OpdSubmissionQueryDto, user: AuthUser) {
    this.ensureInternal(user);
    const filters = this.normalizeQuery(query);
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
    return this.changeInternalStatus(id, 'VERIFY', ['IN_VERIFICATION', 'CORRECTION_SUBMITTED'], {
      status: 'VERIFIED',
      verifiedAt: new Date(),
      updatedById: user.id,
    }, dto.note, user, context);
  }

  async reject(id: string, dto: InternalActionNoteDto, user: AuthUser, context?: AuditContext) {
    this.ensureInternalAction(user, VERIFY_ROLES, 'menolak pengajuan OPD');
    return this.changeInternalStatus(id, 'REJECT', ['RECEIVED', 'IN_VERIFICATION', 'CORRECTION_SUBMITTED'], {
      status: 'REJECTED',
      rejectedAt: new Date(),
      updatedById: user.id,
    }, dto.note, user, context);
  }

  async complete(id: string, dto: InternalActionNoteDto, user: AuthUser, context?: AuditContext) {
    this.ensureInternalAction(user, FINAL_ROLES, 'menyelesaikan pengajuan OPD');
    return this.changeInternalStatus(id, 'COMPLETE', ['VERIFIED'], {
      status: 'COMPLETED',
      completedAt: new Date(),
      updatedById: user.id,
    }, dto.note, user, context);
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

    const updated = await this.repo.update(before.id, data);
    await this.writeAudit(updated, action, before, updated, user, note, context);
    return this.toResponse(updated, true);
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
      moduleKey: query.moduleKey ? this.normalizeModuleKey(query.moduleKey) : undefined,
      serviceType: this.normalizeOptional(query.serviceType),
      opdUnitId: this.normalizeOptional(query.opdUnitId),
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
      documentCount: record.documents.length,
    };
  }

  private toResponse(record: OpdSubmissionRecord, internal: boolean) {
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
      createdById: internal ? record.createdById : undefined,
      updatedById: internal ? record.updatedById : undefined,
      assignedToId: internal ? record.assignedToId : undefined,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      documents: record.documents.map((document) => ({
        id: document.id,
        submissionId: document.submissionId,
        dmsDocumentId: document.dmsDocumentId,
        documentType: document.documentType,
        title: document.title,
        status: document.status,
        note: document.note,
        uploadedById: internal ? document.uploadedById : undefined,
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
    };
  }
}
