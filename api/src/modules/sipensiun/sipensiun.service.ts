import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CasePriority, JenisPensiun } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { AuthUser } from '../auth/auth.types';
import { SiapRepository } from '../siap/siap.repository';
import { SiapService } from '../siap/siap.service';
import { CreateSipensiunCaseDto } from './dto/create-sipensiun-case.dto';
import { SipensiunCaseListQueryDto } from './dto/sipensiun-case-list-query.dto';
import {
  GeneratedLetterDocumentRecord,
  SipensiunCaseDetailRecord,
  SipensiunCaseListRecord,
  SipensiunRepository,
} from './sipensiun.repository';
import { SIPENSIUN_LETTER_TEMPLATES } from './sipensiun-letter-templates';
import {
  buildSipensiunLetterPreview,
  LetterPreviewSource,
} from './sipensiun-letter-preview';
import { buildSipensiunLetterPdf } from './sipensiun-letter-pdf';
import { resolvePensiunRecipient } from './sipensiun-recipient';
import { SIPENSIUN_REQUIREMENTS } from './sipensiun-requirements';
import { NormalizedSipensiunCaseFilters } from './sipensiun.types';

const GENERATED_LETTER_DOCUMENT_TYPE = 'SURAT_PERMOHONAN_PENSIUN';

type UploadedDocumentType = {
  documentType: string;
};

@Injectable()
export class SipensiunService {
  constructor(
    @Inject(SipensiunRepository)
    private readonly sipensiunRepository: SipensiunRepository,
    @Inject(SiapRepository)
    private readonly siapRepository: SiapRepository,
    @Inject(SiapService)
    private readonly siapService: SiapService,
  ) {}

  getRequirements() {
    return SIPENSIUN_REQUIREMENTS;
  }

  getTemplates() {
    return SIPENSIUN_LETTER_TEMPLATES;
  }

  async createCase(dto: CreateSipensiunCaseDto, user: AuthUser) {
    const asn = await this.sipensiunRepository.findAsnById(dto.asnId.trim());

    if (!asn) {
      throw new NotFoundException('ASN tidak ditemukan');
    }

    const tmtPensiun = this.parseOptionalDate(dto.tmtPensiun);

    const existingActive =
      await this.sipensiunRepository.findActiveCaseByAsnAndJenis(
        asn.id,
        dto.jenisPensiun,
      );

    if (existingActive) {
      throw new BadRequestException(
        'ASN sudah memiliki usulan pensiun aktif untuk jenis pensiun yang sama',
      );
    }

    const created = await this.siapRepository.withTransaction(async (client) => {
      const siapCase = await this.siapService.createCaseRecord(
        {
          serviceType: 'SIPENSIUN',
          title: `Usulan Pensiun ${dto.jenisPensiun} - ${asn.nama}`,
          description: this.normalizeOptionalText(dto.catatan),
          asnId: asn.id,
          priority: CasePriority.NORMAL,
        },
        user,
        client,
      );

      return this.sipensiunRepository.createSipensiunCase(
        {
          siapCaseId: siapCase.id,
          asnId: asn.id,
          jenisPensiun: dto.jenisPensiun,
          tmtPensiun,
          catatan: this.normalizeOptionalText(dto.catatan),
          createdBy: user.id,
          updatedBy: user.id,
        },
        client,
      );
    });

    return this.toDetailResponse(created);
  }

  async submitCase(id: string, user: AuthUser) {
    const existing = await this.sipensiunRepository.findCaseById(id.trim());

    if (!existing) {
      throw new NotFoundException('Data SIPENSIUN tidak ditemukan');
    }

    await this.siapService.submitCase(existing.siapCaseId, user);

    const submitted = await this.sipensiunRepository.findCaseById(existing.id);

    if (!submitted) {
      throw new NotFoundException(
        'Data SIPENSIUN tidak ditemukan setelah submit',
      );
    }

    return this.toDetailResponse(submitted);
  }

  async findCases(query: SipensiunCaseListQueryDto) {
    const filters = this.normalizeFilters(query);
    const result = await this.sipensiunRepository.findCases(filters);

    return {
      items: result.items.map((item) => this.toListResponse(item)),
      page: filters.page,
      limit: filters.limit,
      total: result.total,
    };
  }

  async findCaseById(id: string) {
    const found = await this.sipensiunRepository.findCaseById(id.trim());

    if (!found) {
      throw new NotFoundException('Data SIPENSIUN tidak ditemukan');
    }

    return this.toDetailResponse(found);
  }

  async getLetterPreview(id: string) {
    const source = await this.buildLetterPreviewSource(id.trim());

    return buildSipensiunLetterPreview(source);
  }

  async generateLetter(id: string, user: AuthUser) {
    const source = await this.buildLetterPreviewSource(id.trim());
    const preview = buildSipensiunLetterPreview(source);
    const pdfBuffer = buildSipensiunLetterPdf({
      title: preview.subject,
      body: preview.body,
    });

    const checksum = createHash('sha256').update(pdfBuffer).digest('hex');
    const fileName = this.buildGeneratedLetterFileName(
      source.caseNumber,
      source.jenisPensiun,
    );
    const relativeStoragePath = this.toGeneratedLetterStoragePath(
      source.caseId,
      fileName,
    );
    const absoluteStoragePath = resolve(process.cwd(), relativeStoragePath);

    await mkdir(resolve(process.cwd(), 'uploads', 'cases', source.caseId), {
      recursive: true,
    });

    await writeFile(absoluteStoragePath, pdfBuffer);

    const document =
      await this.sipensiunRepository.createGeneratedLetterDocument({
        caseId: source.caseId,
        documentType: GENERATED_LETTER_DOCUMENT_TYPE,
        fileName,
        originalFileName: fileName,
        storagePath: relativeStoragePath,
        mimeType: 'application/pdf',
        fileSize: pdfBuffer.length,
        checksum,
        uploadedBy: user.id,
      });

    return {
      preview,
      document: this.toGeneratedDocumentResponse(document),
    };
  }

  private async buildLetterPreviewSource(
    id: string,
  ): Promise<LetterPreviewSource> {
    const record =
      await this.sipensiunRepository.findLetterPreviewSourceById(id);

    if (!record) {
      throw new NotFoundException('Data SIPENSIUN tidak ditemukan');
    }

    const recipient = resolvePensiunRecipient(record.asn.golonganNama);
    const uploadedDocumentTypes = record.siapCase.documents.map(
      (document: UploadedDocumentType) => document.documentType,
    );

    return {
      caseId: record.siapCase.id,
      caseNumber: record.siapCase.caseNumber,
      serviceType: record.siapCase.serviceType,
      currentState: record.siapCase.currentState,
      status: String(record.siapCase.status),
      jenisPensiun: record.jenisPensiun,
      tmtPensiun: record.tmtPensiun,
      catatan: record.catatan,
      recipient,
      asn: {
        id: record.asn.id,
        nip: record.asn.nip,
        nama: record.asn.nama,
        jabatanNama: record.asn.jabatanNama,
        golonganNama: record.asn.golonganNama,
        unitKerjaNama: record.asn.unitKerja?.nama ?? null,
        statusAsn: record.asn.statusAsn,
      },
      uploadedDocumentTypes,
    };
  }

  private normalizeFilters(
    query: SipensiunCaseListQueryDto,
  ): NormalizedSipensiunCaseFilters {
    return {
      q: this.normalizeOptionalText(query.q),
      jenisPensiun: query.jenisPensiun,
      asnId: this.normalizeOptionalText(query.asnId),
      currentState: this.normalizeOptionalText(query.currentState),
      status: query.status,
      page: this.normalizePositiveNumber(query.page, 1, 1, 10000),
      limit: this.normalizePositiveNumber(query.limit, 10, 1, 100),
    };
  }

  private normalizeOptionalText(value: string | undefined) {
    const normalized = value?.trim();

    return normalized ? normalized : undefined;
  }

  private parseOptionalDate(value: string | undefined) {
    const normalized = this.normalizeOptionalText(value);

    if (!normalized) {
      return undefined;
    }

    const parsed = new Date(normalized);

    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('TMT pensiun tidak valid');
    }

    return parsed;
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

  private getRequirementsByJenis(jenisPensiun: JenisPensiun) {
    return SIPENSIUN_REQUIREMENTS[jenisPensiun];
  }

  private buildGeneratedLetterFileName(
    caseNumber: string,
    jenisPensiun: JenisPensiun,
  ) {
    const safeCaseNumber = caseNumber.replace(/[^A-Z0-9_-]/gi, '-');
    const timestamp = Date.now();
    const random = randomBytes(4).toString('hex');

    return `${GENERATED_LETTER_DOCUMENT_TYPE}-${jenisPensiun}-${safeCaseNumber}-${timestamp}-${random}.pdf`;
  }

  private toGeneratedLetterStoragePath(caseId: string, fileName: string) {
    return ['uploads', 'cases', caseId, fileName].join('/');
  }

  private toGeneratedDocumentResponse(document: GeneratedLetterDocumentRecord) {
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
      case: document.case,
    };
  }

  private toListResponse(record: SipensiunCaseListRecord) {
    return {
      id: record.id,
      siapCaseId: record.siapCaseId,
      asnId: record.asnId,
      jenisPensiun: record.jenisPensiun,
      tmtPensiun: record.tmtPensiun,
      catatan: record.catatan,
      siapCase: record.siapCase,
      asn: record.asn,
      recipient: resolvePensiunRecipient(record.asn.golonganNama),
      requirements: this.getRequirementsByJenis(record.jenisPensiun),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private toDetailResponse(record: SipensiunCaseDetailRecord) {
    const { siapCase, asn, ...detail } = record;

    return {
      siapCase,
      sipensiunDetail: detail,
      asn,
      recipient: resolvePensiunRecipient(asn.golonganNama),
      requirements: this.getRequirementsByJenis(detail.jenisPensiun),
      tasks: siapCase.tasks,
      workflowLogs: siapCase.workflowLogs,
      slaTracking: siapCase.slaTracking,
      timelines: siapCase.timelines,
    };
  }
}