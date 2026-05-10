import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CasePriority, JenisPensiun } from '@prisma/client';
import { AuthUser } from '../auth/auth.types';
import { SiapRepository } from '../siap/siap.repository';
import { SiapService } from '../siap/siap.service';
import { CreateSipensiunCaseDto } from './dto/create-sipensiun-case.dto';
import { SipensiunCaseListQueryDto } from './dto/sipensiun-case-list-query.dto';
import {
  SipensiunCaseDetailRecord,
  SipensiunCaseListRecord,
  SipensiunRepository,
} from './sipensiun.repository';
import { SIPENSIUN_LETTER_TEMPLATES } from './sipensiun-letter-templates';
import {
  buildSipensiunLetterPreview,
  LetterPreviewSource,
} from './sipensiun-letter-preview';
import { resolvePensiunRecipient } from './sipensiun-recipient';
import { SIPENSIUN_REQUIREMENTS } from './sipensiun-requirements';
import { NormalizedSipensiunCaseFilters } from './sipensiun.types';

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
    const record = await this.sipensiunRepository.findLetterPreviewSourceById(
      id.trim(),
    );

    if (!record) {
      throw new NotFoundException('Data SIPENSIUN tidak ditemukan');
    }

    const recipient = resolvePensiunRecipient(record.asn.golonganNama);
    const uploadedDocumentTypes = record.siapCase.documents.map(
      (document: UploadedDocumentType) => document.documentType,
    );

    const source: LetterPreviewSource = {
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

    return buildSipensiunLetterPreview(source);
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