import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { JenisPensiun } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { basename, extname, isAbsolute, relative, resolve } from 'path';
import { AuditContext, AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/auth.types';
import { SIPENSIUN_REQUIREMENTS } from '../sipensiun/sipensiun-requirements';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentListQueryDto } from './dto/document-list-query.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import {
  ChecklistCaseRecord,
  DocumentRecord,
  SiarsipRepository,
} from './siarsip.repository';
import {
  DownloadDocumentPayload,
  NormalizedDocumentFilters,
  UploadedDocumentFile,
} from './siarsip.types';

const MAX_UPLOAD_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME_EXTENSIONS = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
} as const;

@Injectable()
export class SiarsipService {
  constructor(
    @Inject(SiarsipRepository)
    private readonly siarsipRepository: SiarsipRepository,
    @Inject(AuditService)
    private readonly auditService: AuditService,
  ) {}

  async findDocuments(query: DocumentListQueryDto) {
    const filters = this.normalizeFilters(query);
    const result = await this.siarsipRepository.findDocuments(filters);

    return {
      items: result.items.map((item) => this.toDocumentResponse(item)),
      page: filters.page,
      limit: filters.limit,
      total: result.total,
    };
  }

  async findDocumentById(id: string) {
    const document = await this.siarsipRepository.findDocumentById(id.trim());

    if (!document) {
      throw new NotFoundException('Dokumen tidak ditemukan');
    }

    return this.toDocumentResponse(document);
  }

  async findDocumentsByCaseId(caseId: string) {
    await this.getCaseOrThrow(caseId);
    const documents = await this.siarsipRepository.findDocumentsByCaseId(
      caseId.trim(),
    );

    return documents.map((document) => this.toDocumentResponse(document));
  }

  async createDocument(caseId: string, dto: CreateDocumentDto, user: AuthUser) {
    const siapCase = await this.getCaseOrThrow(caseId);

    const created = await this.siarsipRepository.createDocument({
      caseId: siapCase.id,
      documentType: dto.documentType.trim().toUpperCase(),
      fileName: dto.fileName.trim(),
      originalFileName: this.normalizeOptionalText(dto.originalFileName),
      storagePath: dto.storagePath.trim(),
      mimeType: this.normalizeOptionalText(dto.mimeType),
      fileSize: dto.fileSize,
      checksum: this.normalizeOptionalText(dto.checksum),
      uploadedBy: user.id,
    });

    return this.toDocumentResponse(created);
  }

  async uploadDocument(
    caseId: string,
    dto: UploadDocumentDto,
    file: UploadedDocumentFile | undefined,
    user: AuthUser,
    context?: AuditContext,
  ) {
    const siapCase = await this.getCaseOrThrow(caseId);

    if (!file) {
      throw new BadRequestException('File wajib diunggah');
    }

    const documentType = this.normalizeDocumentType(dto.documentType);
    const extension = this.getAllowedExtension(file.mimetype);

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      throw new BadRequestException('Ukuran file maksimal 2 MB');
    }

    const checksum = createHash('sha256').update(file.buffer).digest('hex');
    const timestamp = Date.now();
    const random = randomBytes(4).toString('hex');
    const storedFileName = `${documentType}-${timestamp}-${random}.${extension}`;
    const relativeStoragePath = this.toStoragePath(
      siapCase.id,
      storedFileName,
    );
    const absoluteStoragePath =
      this.resolveSafeStoragePath(relativeStoragePath);

    await mkdir(resolve(this.getUploadRoot(), 'cases', siapCase.id), {
      recursive: true,
    });
    await writeFile(absoluteStoragePath, file.buffer);

    const created = await this.siarsipRepository.createDocument({
      caseId: siapCase.id,
      documentType,
      fileName: storedFileName,
      originalFileName: basename(file.originalname),
      storagePath: relativeStoragePath,
      mimeType: file.mimetype,
      fileSize: file.size,
      checksum,
      uploadedBy: user.id,
    });

    await this.auditService.record({
      entityType: 'DOCUMENT',
      entityId: created.id,
      action: 'DOCUMENT_UPLOADED',
      performedBy: user.id,
      afterData: {
        caseId: siapCase.id,
        documentType,
        fileName: storedFileName,
        originalFileName: basename(file.originalname),
        mimeType: file.mimetype,
        fileSize: file.size,
        checksum,
      },
      context,
    });

    return this.toDocumentResponse(created);
  }

  async uploadStandaloneDocument(
    ownerId: string,
    documentTypeValue: string,
    file: UploadedDocumentFile | undefined,
    user: AuthUser,
    context?: AuditContext,
  ) {
    if (!file) {
      throw new BadRequestException('File wajib diunggah');
    }

    const documentType = this.normalizeDocumentType(documentTypeValue);
    const extension = this.getAllowedExtension(file.mimetype);

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      throw new BadRequestException('Ukuran file maksimal 2 MB');
    }

    const checksum = createHash('sha256').update(file.buffer).digest('hex');
    const timestamp = Date.now();
    const random = randomBytes(4).toString('hex');
    const storedFileName = `${documentType}-${timestamp}-${random}.${extension}`;
    const relativeStoragePath = [
      'uploads',
      'worklogs',
      ownerId,
      storedFileName,
    ].join('/');
    const absoluteStoragePath =
      this.resolveSafeStoragePath(relativeStoragePath);

    await mkdir(resolve(this.getUploadRoot(), 'worklogs', ownerId), {
      recursive: true,
    });
    await writeFile(absoluteStoragePath, file.buffer);

    const created = await this.siarsipRepository.createDocument({
      caseId: null,
      documentType,
      fileName: storedFileName,
      originalFileName: basename(file.originalname),
      storagePath: relativeStoragePath,
      mimeType: file.mimetype,
      fileSize: file.size,
      checksum,
      uploadedBy: user.id,
    });

    await this.auditService.record({
      entityType: 'DOCUMENT',
      entityId: created.id,
      action: 'STANDALONE_DOCUMENT_UPLOADED',
      performedBy: user.id,
      afterData: {
        ownerId,
        documentType,
        fileName: storedFileName,
        originalFileName: basename(file.originalname),
        mimeType: file.mimetype,
        fileSize: file.size,
        checksum,
      },
      context,
    });

    return this.toDocumentResponse(created);
  }

  async downloadDocument(id: string): Promise<DownloadDocumentPayload> {
    const document = await this.siarsipRepository.findDocumentById(id.trim());

    if (!document) {
      throw new NotFoundException('Dokumen tidak ditemukan');
    }

    const absoluteStoragePath = this.resolveSafeStoragePath(
      document.storagePath,
    );
    const buffer = await this.readStoredFile(absoluteStoragePath);

    return {
      buffer,
      mimeType: document.mimeType ?? 'application/octet-stream',
      fileName: document.originalFileName ?? document.fileName,
    };
  }

  async getChecklist(caseId: string) {
    const siapCase = await this.getCaseOrThrow(caseId);
    const uploadedDocuments = siapCase.documents.map((document) =>
      this.toPlainDocument(document),
    );
    const uploadedTypes = new Set(
      uploadedDocuments.map((document) => document.documentType),
    );
    const required = this.getRequirementsForCase(siapCase).map(
      (requirement) => ({
        documentType: requirement.documentType,
        label: requirement.label,
        uploaded: uploadedTypes.has(requirement.documentType),
      }),
    );
    const missing = required
      .filter((requirement) => !requirement.uploaded)
      .map(({ documentType, label }) => ({ documentType, label }));

    return {
      caseId: siapCase.id,
      serviceType: siapCase.serviceType,
      isComplete: missing.length === 0,
      required,
      missing,
      uploadedDocuments,
    };
  }

  private async getCaseOrThrow(caseId: string): Promise<ChecklistCaseRecord> {
    const siapCase = await this.siarsipRepository.findCaseForChecklist(
      caseId.trim(),
    );

    if (!siapCase) {
      throw new NotFoundException('Case tidak ditemukan');
    }

    return siapCase;
  }

  private getRequirementsForCase(siapCase: ChecklistCaseRecord) {
    if (siapCase.serviceType !== 'SIPENSIUN') {
      return [];
    }

    const jenisPensiun = siapCase.sipensiunCase?.jenisPensiun;

    if (!jenisPensiun) {
      return [];
    }

    return SIPENSIUN_REQUIREMENTS[jenisPensiun as JenisPensiun];
  }

  private normalizeFilters(
    query: DocumentListQueryDto,
  ): NormalizedDocumentFilters {
    return {
      caseId: this.normalizeOptionalText(query.caseId),
      documentType: this.normalizeOptionalText(query.documentType)?.toUpperCase(),
      q: this.normalizeOptionalText(query.q),
      page: this.normalizePositiveNumber(query.page, 1, 1, 10000),
      limit: this.normalizePositiveNumber(query.limit, 10, 1, 100),
    };
  }

  private normalizeOptionalText(value: string | undefined) {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }

  private normalizeDocumentType(value: string) {
    const normalized = value.trim().toUpperCase();

    if (!/^[A-Z0-9_]+$/.test(normalized)) {
      throw new BadRequestException(
        'Tipe dokumen hanya boleh berisi huruf, angka, dan underscore',
      );
    }

    return normalized;
  }

  private getAllowedExtension(mimeType: string) {
    const extension =
      ALLOWED_MIME_EXTENSIONS[
        mimeType as keyof typeof ALLOWED_MIME_EXTENSIONS
      ];

    if (!extension) {
      throw new BadRequestException(
        'Tipe file tidak didukung. Gunakan PDF, JPG, atau PNG',
      );
    }

    return extension;
  }

  private getUploadRoot() {
    return resolve(process.cwd(), 'uploads');
  }

  private toStoragePath(caseId: string, fileName: string) {
    return ['uploads', 'cases', caseId, fileName].join('/');
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

    if (!['.pdf', '.jpg', '.jpeg', '.png'].includes(extension)) {
      throw new BadRequestException('Ekstensi dokumen tidak valid');
    }

    return absolutePath;
  }

  private async readStoredFile(absoluteStoragePath: string) {
    try {
      return await readFile(absoluteStoragePath);
    } catch {
      throw new NotFoundException('File dokumen tidak ditemukan di storage');
    }
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

  private toDocumentResponse(document: DocumentRecord) {
    return {
      ...this.toPlainDocument(document),
      case: document.case,
    };
  }

  private toPlainDocument(document: ChecklistCaseRecord['documents'][number]) {
    return {
      id: document.id,
      caseId: document.caseId,
      documentType: document.documentType,
      fileName: document.fileName,
      originalFileName: document.originalFileName,
      storagePath: document.storagePath,
      mimeType: document.mimeType,
      fileSize: document.fileSize,
      checksum: document.checksum,
      version: document.version,
      uploadedBy: document.uploadedBy,
      uploadedAt: document.uploadedAt,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }
}
