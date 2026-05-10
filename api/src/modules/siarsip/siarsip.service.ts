import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { JenisPensiun } from '@prisma/client';
import { AuthUser } from '../auth/auth.types';
import { SIPENSIUN_REQUIREMENTS } from '../sipensiun/sipensiun-requirements';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentListQueryDto } from './dto/document-list-query.dto';
import {
  ChecklistCaseRecord,
  DocumentRecord,
  SiarsipRepository,
} from './siarsip.repository';
import { NormalizedDocumentFilters } from './siarsip.types';

@Injectable()
export class SiarsipService {
  constructor(
    @Inject(SiarsipRepository)
    private readonly siarsipRepository: SiarsipRepository,
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
