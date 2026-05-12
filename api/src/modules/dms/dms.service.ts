import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DmsDocumentCategory, DmsDocumentStatus } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { basename, extname, isAbsolute, relative, resolve } from 'path';
import { AuditContext, AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/auth.types';
import { canAccessDmsDocument } from './constants/dms-permission.constant';
import {
  isDmsDeletableStatus,
  isDmsEditableStatus,
} from './constants/dms-status.constant';
import { CreateDmsDocumentDto } from './dto/create-dms-document.dto';
import { DmsDocumentListQueryDto } from './dto/dms-document-list-query.dto';
import { DmsRejectDto } from './dto/dms-reject.dto';
import { DmsUploadDto } from './dto/dms-upload.dto';
import { DmsVerifyDto } from './dto/dms-verify.dto';
import { UpdateDmsDocumentDto } from './dto/update-dms-document.dto';
import { DmsMapper } from './dms.mapper';
import {
  DmsDocumentRecord,
  DmsRepository,
  NormalizedDmsDocumentFilters,
} from './dms.repository';

type UploadedDmsFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

export interface DownloadDmsDocumentPayload {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
}

const DMS_CREATE_ROLES = [
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

const DMS_VERIFY_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
];

const DMS_ADMIN_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
];

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

const ALLOWED_MIME_EXTENSIONS = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
} as const;

@Injectable()
export class DmsService {
  constructor(
    @Inject(DmsRepository)
    private readonly dmsRepository: DmsRepository,
    @Inject(AuditService)
    private readonly auditService: AuditService,
  ) {}

  async create(
    dto: CreateDmsDocumentDto,
    user: AuthUser,
    context?: AuditContext,
  ) {
    this.ensureCanCreate(user);

    const normalized = await this.normalizeCreatePayload(dto, user);
    const created = await this.dmsRepository.create({
      ...normalized,
      status: DmsDocumentStatus.DRAFT,
      createdById: user.id,
      updatedById: user.id,
    });

    await this.auditService.record({
      entityType: 'DMS_DOCUMENT',
      entityId: created.id,
      action: 'DMS_DOCUMENT_CREATED',
      performedBy: user.id,
      afterData: DmsMapper.toAuditData(created),
      context,
    });

    return DmsMapper.toResponse(created);
  }

  async findMany(query: DmsDocumentListQueryDto, user: AuthUser) {
    const filters = this.normalizeFilters(query, user);
    const result = await this.dmsRepository.findMany(filters);

    return {
      items: result.items.map((item) => DmsMapper.toResponse(item)),
      page: filters.page,
      limit: filters.limit,
      total: result.total,
    };
  }

  async findById(id: string, user: AuthUser) {
    const document = await this.getDocumentForUser(id, user);
    return DmsMapper.toResponse(document);
  }

  async download(
    id: string,
    user: AuthUser,
    context?: AuditContext,
  ): Promise<DownloadDmsDocumentPayload> {
    const document = await this.getDocumentForUser(id, user);

    if (!document.fileName || !document.storagePath) {
      throw new NotFoundException('File dokumen DMS belum tersedia');
    }

    const absoluteStoragePath = this.resolveSafeStoragePath(document.storagePath);
    const buffer = await this.readStoredFile(absoluteStoragePath);

    await this.auditService.record({
      entityType: 'DMS_DOCUMENT',
      entityId: document.id,
      action: 'DMS_DOCUMENT_DOWNLOADED',
      performedBy: user.id,
      afterData: DmsMapper.toAuditData(document),
      context,
    });

    return {
      buffer,
      mimeType: document.mimeType ?? 'application/octet-stream',
      fileName: document.originalFileName ?? document.fileName,
    };
  }

  async update(
    id: string,
    dto: UpdateDmsDocumentDto,
    user: AuthUser,
    context?: AuditContext,
  ) {
    const document = await this.getDocumentForUser(id, user);

    this.ensureCanEdit(document, user);

    const normalized = await this.normalizeUpdatePayload(dto, user);
    const updated = await this.dmsRepository.update(document.id, {
      ...normalized,
      status:
        document.status === DmsDocumentStatus.REJECTED
          ? DmsDocumentStatus.DRAFT
          : undefined,
      rejectedAt:
        document.status === DmsDocumentStatus.REJECTED ? null : undefined,
      rejectionNote:
        document.status === DmsDocumentStatus.REJECTED ? null : undefined,
      updatedById: user.id,
    });

    await this.auditService.record({
      entityType: 'DMS_DOCUMENT',
      entityId: updated.id,
      action: 'DMS_DOCUMENT_UPDATED',
      performedBy: user.id,
      beforeData: DmsMapper.toAuditData(document),
      afterData: DmsMapper.toAuditData(updated),
      context,
    });

    return DmsMapper.toResponse(updated);
  }

  async upload(
    id: string,
    dto: DmsUploadDto,
    file: UploadedDmsFile | undefined,
    user: AuthUser,
    context?: AuditContext,
  ) {
    const document = await this.getDocumentForUser(id, user);

    this.ensureCanEdit(document, user);

    if (!file) {
      throw new BadRequestException('File wajib diunggah');
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      throw new BadRequestException('Ukuran file maksimal 10 MB');
    }

    const extension = this.getAllowedExtension(file.mimetype);
    const checksum = createHash('sha256').update(file.buffer).digest('hex');
    const timestamp = Date.now();
    const random = randomBytes(4).toString('hex');
    const storedFileName = `DMS-${document.category}-${timestamp}-${random}.${extension}`;
    const relativeStoragePath = this.toStoragePath(document.id, storedFileName);
    const absoluteStoragePath = this.resolveSafeStoragePath(relativeStoragePath);

    await mkdir(resolve(this.getUploadRoot(), 'dms', document.id), {
      recursive: true,
    });
    await writeFile(absoluteStoragePath, file.buffer);

    const updated = await this.dmsRepository.update(document.id, {
      description:
        dto.description === undefined
          ? undefined
          : this.normalizeNullableText(dto.description),
      status: DmsDocumentStatus.UPLOADED,
      fileName: storedFileName,
      originalFileName: basename(file.originalname),
      storagePath: relativeStoragePath,
      mimeType: file.mimetype,
      fileSize: file.size,
      checksum,
      version: {
        increment: document.fileName ? 1 : 0,
      },
      rejectedAt: null,
      rejectionNote: null,
      updatedById: user.id,
    });

    await this.auditService.record({
      entityType: 'DMS_DOCUMENT',
      entityId: updated.id,
      action: 'DMS_DOCUMENT_UPLOADED',
      performedBy: user.id,
      beforeData: DmsMapper.toAuditData(document),
      afterData: DmsMapper.toAuditData(updated),
      context,
    });

    return DmsMapper.toResponse(updated);
  }

  async submit(id: string, user: AuthUser, context?: AuditContext) {
    const document = await this.getDocumentForUser(id, user);

    this.ensureCanSubmit(document, user);

    const now = new Date();
    const updated = await this.dmsRepository.update(document.id, {
      status: DmsDocumentStatus.SUBMITTED,
      submittedAt: now,
      submittedById: user.id,
      updatedById: user.id,
    });

    await this.auditService.record({
      entityType: 'DMS_DOCUMENT',
      entityId: updated.id,
      action: 'DMS_DOCUMENT_SUBMITTED',
      performedBy: user.id,
      beforeData: DmsMapper.toAuditData(document),
      afterData: DmsMapper.toAuditData(updated),
      context,
    });

    return DmsMapper.toResponse(updated);
  }

  async verify(
    id: string,
    dto: DmsVerifyDto,
    user: AuthUser,
    context?: AuditContext,
  ) {
    const document = await this.getDocumentForUser(id, user);

    this.ensureCanVerify(user);
    this.ensureCanVerifyDocument(document, user);

    if (document.status !== DmsDocumentStatus.SUBMITTED) {
      throw new BadRequestException(
        'Hanya dokumen SUBMITTED yang dapat diverifikasi',
      );
    }

    const now = new Date();
    const updated = await this.dmsRepository.update(document.id, {
      status: DmsDocumentStatus.VERIFIED,
      verifiedAt: now,
      verifiedById: user.id,
      rejectionNote: this.normalizeNullableText(dto.note),
      updatedById: user.id,
    });

    await this.auditService.record({
      entityType: 'DMS_DOCUMENT',
      entityId: updated.id,
      action: 'DMS_DOCUMENT_VERIFIED',
      performedBy: user.id,
      beforeData: DmsMapper.toAuditData(document),
      afterData: DmsMapper.toAuditData(updated),
      context,
    });

    return DmsMapper.toResponse(updated);
  }

  async reject(
    id: string,
    dto: DmsRejectDto,
    user: AuthUser,
    context?: AuditContext,
  ) {
    const document = await this.getDocumentForUser(id, user);

    this.ensureCanVerify(user);
    this.ensureCanVerifyDocument(document, user);

    if (document.status !== DmsDocumentStatus.SUBMITTED) {
      throw new BadRequestException(
        'Hanya dokumen SUBMITTED yang dapat ditolak',
      );
    }

    const note = this.normalizeRequiredText(dto.note, 'Catatan penolakan wajib diisi');
    const now = new Date();

    const updated = await this.dmsRepository.update(document.id, {
      status: DmsDocumentStatus.REJECTED,
      rejectedAt: now,
      rejectionNote: note,
      verifiedAt: null,
      verifiedById: null,
      updatedById: user.id,
    });

    await this.auditService.record({
      entityType: 'DMS_DOCUMENT',
      entityId: updated.id,
      action: 'DMS_DOCUMENT_REJECTED',
      performedBy: user.id,
      beforeData: DmsMapper.toAuditData(document),
      afterData: DmsMapper.toAuditData(updated),
      context,
    });

    return DmsMapper.toResponse(updated);
  }

  async archive(id: string, user: AuthUser, context?: AuditContext) {
    const document = await this.getDocumentForUser(id, user);

    this.ensureCanVerify(user);
    this.ensureCanVerifyDocument(document, user);

    if (document.status !== DmsDocumentStatus.VERIFIED) {
      throw new BadRequestException(
        'Hanya dokumen VERIFIED yang dapat diarsipkan',
      );
    }

    const updated = await this.dmsRepository.update(document.id, {
      status: DmsDocumentStatus.ARCHIVED,
      archivedAt: new Date(),
      updatedById: user.id,
    });

    await this.auditService.record({
      entityType: 'DMS_DOCUMENT',
      entityId: updated.id,
      action: 'DMS_DOCUMENT_ARCHIVED',
      performedBy: user.id,
      beforeData: DmsMapper.toAuditData(document),
      afterData: DmsMapper.toAuditData(updated),
      context,
    });

    return DmsMapper.toResponse(updated);
  }

  async remove(id: string, user: AuthUser, context?: AuditContext) {
    const document = await this.getDocumentForUser(id, user);

    if (!this.canDelete(document, user)) {
      throw new ForbiddenException(
        'Anda tidak berwenang menghapus dokumen ini',
      );
    }

    if (!isDmsDeletableStatus(document.status)) {
      throw new BadRequestException(
        'Dokumen VERIFIED atau ARCHIVED tidak dapat dihapus',
      );
    }

    const deleted = await this.dmsRepository.softDelete(document.id, user.id);

    await this.auditService.record({
      entityType: 'DMS_DOCUMENT',
      entityId: deleted.id,
      action: 'DMS_DOCUMENT_DELETED',
      performedBy: user.id,
      beforeData: DmsMapper.toAuditData(document),
      afterData: DmsMapper.toAuditData(deleted),
      context,
    });

    return {
      deleted: true,
      id: deleted.id,
    };
  }

  private async getDocumentForUser(id: string, user: AuthUser) {
    const document = await this.dmsRepository.findById(id.trim());

    if (!document) {
      throw new NotFoundException('Dokumen DMS tidak ditemukan');
    }

    if (!this.canSeeDocument(document, user)) {
      throw new ForbiddenException(
        'Anda tidak berwenang mengakses dokumen DMS ini',
      );
    }

    return document;
  }

  private normalizeFilters(
    query: DmsDocumentListQueryDto,
    user: AuthUser,
  ): NormalizedDmsDocumentFilters {
    const filters: NormalizedDmsDocumentFilters = {
      q: this.normalizeOptionalText(query.q),
      category: query.category,
      status: query.status,
      unitKerjaId: this.normalizeOptionalText(query.unitKerjaId),
      asnId: this.normalizeOptionalText(query.asnId),
      caseId: this.normalizeOptionalText(query.caseId),
      worklogId: this.normalizeOptionalText(query.worklogId),
      periodYear: this.normalizePositiveNumber(query.year, undefined, 2000, 2100),
      periodMonth: this.normalizePositiveNumber(query.month, undefined, 1, 12),
      periodQuarter: this.normalizePositiveNumber(query.quarter, undefined, 1, 4),
      page: this.normalizePositiveNumber(query.page, 1, 1, 10000) ?? 1,
      limit: this.normalizePositiveNumber(query.limit, 10, 1, 100) ?? 10,
    };

    if (!this.hasAnyRole(user, ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'KEPALA_BADAN'])) {
      if (
        this.hasAnyRole(user, ['KABID', 'ANALIS_MADYA', 'ANALIS_MUDA']) &&
        user.unitKerjaId
      ) {
        filters.unitKerjaId = user.unitKerjaId;
      } else {
        filters.createdById = user.id;
      }
    }

    return filters;
  }

    private async normalizeCreatePayload(
    dto: CreateDmsDocumentDto,
    user: AuthUser,
    ) {
    const unitKerjaId =
        this.normalizeOptionalText(dto.unitKerjaId) ??
        this.normalizeOptionalNullableText(user.unitKerjaId);

    const asnId = this.normalizeOptionalText(dto.asnId);
    const caseId = this.normalizeOptionalText(dto.caseId);
    const worklogId = this.normalizeOptionalText(dto.worklogId);

    await this.validateLinkedRecords({
        unitKerjaId,
        asnId,
        caseId,
        worklogId,
    });

    return {
        title: this.normalizeRequiredText(dto.title, 'Judul dokumen wajib diisi'),
        description: this.normalizeNullableText(dto.description),
        category: dto.category ?? DmsDocumentCategory.BUKTI_DUKUNG,
        periodYear: dto.periodYear ?? null,
        periodMonth: dto.periodMonth ?? null,
        periodQuarter: dto.periodQuarter ?? null,
        unitKerjaId: unitKerjaId ?? null,
        asnId: asnId ?? null,
        caseId: caseId ?? null,
        worklogId: worklogId ?? null,
    };
    }

    private async normalizeUpdatePayload(
    dto: UpdateDmsDocumentDto,
    user: AuthUser,
    ) {
    const unitKerjaId =
        dto.unitKerjaId === undefined
        ? undefined
        : this.normalizeOptionalText(dto.unitKerjaId) ??
            this.normalizeOptionalNullableText(user.unitKerjaId);

    const asnId =
        dto.asnId === undefined ? undefined : this.normalizeOptionalText(dto.asnId);

    const caseId =
        dto.caseId === undefined ? undefined : this.normalizeOptionalText(dto.caseId);

    const worklogId =
        dto.worklogId === undefined
        ? undefined
        : this.normalizeOptionalText(dto.worklogId);

    await this.validateLinkedRecords({
        unitKerjaId,
        asnId,
        caseId,
        worklogId,
    });

    return {
        title:
        dto.title === undefined
            ? undefined
            : this.normalizeRequiredText(dto.title, 'Judul dokumen wajib diisi'),
        description:
        dto.description === undefined
            ? undefined
            : this.normalizeNullableText(dto.description),
        category: dto.category,
        periodYear: dto.periodYear === undefined ? undefined : dto.periodYear,
        periodMonth: dto.periodMonth === undefined ? undefined : dto.periodMonth,
        periodQuarter:
        dto.periodQuarter === undefined ? undefined : dto.periodQuarter,
        unitKerjaId: dto.unitKerjaId === undefined ? undefined : unitKerjaId ?? null,
        asnId: dto.asnId === undefined ? undefined : asnId ?? null,
        caseId: dto.caseId === undefined ? undefined : caseId ?? null,
        worklogId: dto.worklogId === undefined ? undefined : worklogId ?? null,
    };
    }

  private async validateLinkedRecords(input: {
    unitKerjaId?: string;
    asnId?: string;
    caseId?: string;
    worklogId?: string;
  }) {
    if (input.unitKerjaId && !(await this.dmsRepository.unitKerjaExists(input.unitKerjaId))) {
      throw new NotFoundException('Unit kerja tidak ditemukan');
    }

    if (input.asnId && !(await this.dmsRepository.asnExists(input.asnId))) {
      throw new NotFoundException('ASN tidak ditemukan');
    }

    if (input.caseId && !(await this.dmsRepository.caseExists(input.caseId))) {
      throw new NotFoundException('Case SIAP tidak ditemukan');
    }

    if (
      input.worklogId &&
      !(await this.dmsRepository.worklogExists(input.worklogId))
    ) {
      throw new NotFoundException('Buku kerja SIAP tidak ditemukan');
    }
  }

  private canSeeDocument(document: DmsDocumentRecord, user: AuthUser) {
    return canAccessDmsDocument(document, user);
  }

  private ensureCanCreate(user: AuthUser) {
    if (!this.hasAnyRole(user, DMS_CREATE_ROLES)) {
      throw new ForbiddenException('Anda tidak berwenang membuat dokumen DMS');
    }
  }

  private ensureCanEdit(document: DmsDocumentRecord, user: AuthUser) {
    if (
      document.createdById !== user.id &&
      !this.hasAnyRole(user, DMS_ADMIN_ROLES)
    ) {
      throw new ForbiddenException('Dokumen hanya dapat diedit oleh pembuat');
    }

    if (!isDmsEditableStatus(document.status)) {
      throw new BadRequestException(
        'Dokumen hanya dapat diedit saat DRAFT, UPLOADED, atau REJECTED',
      );
    }
  }

  private ensureCanSubmit(document: DmsDocumentRecord, user: AuthUser) {
    if (
      document.createdById !== user.id &&
      !this.hasAnyRole(user, DMS_ADMIN_ROLES)
    ) {
      throw new ForbiddenException('Dokumen hanya dapat disubmit oleh pembuat');
    }

    if (!document.fileName || !document.storagePath) {
      throw new BadRequestException('Dokumen harus memiliki file sebelum disubmit');
    }

    const submittableStatuses: DmsDocumentStatus[] = [
      DmsDocumentStatus.UPLOADED,
      DmsDocumentStatus.REJECTED,
    ];

    if (!submittableStatuses.includes(document.status)) {
      throw new BadRequestException(
        'Dokumen hanya dapat disubmit dari UPLOADED atau REJECTED',
      );
    }
  }

  private ensureCanVerify(user: AuthUser) {
    if (!this.hasAnyRole(user, DMS_VERIFY_ROLES)) {
      throw new ForbiddenException('Anda tidak berwenang memverifikasi dokumen DMS');
    }
  }

  private ensureCanVerifyDocument(document: DmsDocumentRecord, user: AuthUser) {
    if (this.hasAnyRole(user, ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'KEPALA_BADAN'])) {
      return;
    }

    if (
      this.hasAnyRole(user, ['KABID', 'ANALIS_MADYA', 'ANALIS_MUDA']) &&
      user.unitKerjaId &&
      document.unitKerjaId === user.unitKerjaId
    ) {
      return;
    }

    throw new ForbiddenException(
      'Anda tidak berwenang memverifikasi dokumen unit ini',
    );
  }

  private canDelete(document: DmsDocumentRecord, user: AuthUser) {
    if (this.hasAnyRole(user, DMS_ADMIN_ROLES)) {
      return true;
    }

    return document.createdById === user.id;
  }

  private hasAnyRole(user: AuthUser, roles: string[]) {
    return user.roles.some((role) => roles.includes(role));
  }

  private normalizeOptionalText(value: string | undefined) {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }

  private normalizeNullableText(value: string | undefined) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
  
  private normalizeOptionalNullableText(value: string | null | undefined) {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }

  private normalizeRequiredText(value: string, message: string) {
    const normalized = value.trim();

    if (!normalized) {
      throw new BadRequestException(message);
    }

    return normalized;
  }

  private normalizePositiveNumber(
    value: string | undefined,
    defaultValue: number | undefined,
    min: number,
    max: number,
  ) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      return defaultValue;
    }

    return Math.min(Math.max(Math.trunc(parsed), min), max);
  }

  private getAllowedExtension(mimeType: string) {
    const extension =
      ALLOWED_MIME_EXTENSIONS[mimeType as keyof typeof ALLOWED_MIME_EXTENSIONS];

    if (!extension) {
      throw new BadRequestException(
        'Tipe file tidak didukung. Gunakan PDF, JPG, PNG, DOCX, atau XLSX',
      );
    }

    return extension;
  }

  private getUploadRoot() {
    return resolve(process.cwd(), 'uploads');
  }

  private toStoragePath(documentId: string, fileName: string) {
    return ['uploads', 'dms', documentId, fileName].join('/');
  }

  private resolveSafeStoragePath(storagePath: string) {
    if (isAbsolute(storagePath)) {
      throw new BadRequestException('Path dokumen tidak valid');
    }

    const uploadRoot = this.getUploadRoot();
    const absolutePath = resolve(process.cwd(), storagePath);
    const relativePath = relative(uploadRoot, absolutePath);

    if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
      throw new BadRequestException('Path dokumen tidak valid');
    }

    const extension = extname(absolutePath).toLowerCase();

    if (!['.pdf', '.jpg', '.jpeg', '.png', '.docx', '.xlsx'].includes(extension)) {
      throw new BadRequestException('Ekstensi dokumen tidak valid');
    }

    return absolutePath;
  }

  private async readStoredFile(absoluteStoragePath: string) {
    try {
      return await readFile(absoluteStoragePath);
    } catch {
      throw new NotFoundException('File dokumen DMS tidak ditemukan di storage');
    }
  }  
}