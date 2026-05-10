import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CasePriority } from '@prisma/client';
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
import { NormalizedSipensiunCaseFilters } from './sipensiun.types';

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

  async createCase(dto: CreateSipensiunCaseDto, user: AuthUser) {
    const asn = await this.sipensiunRepository.findAsnById(dto.asnId.trim());

    if (!asn) {
      throw new NotFoundException('ASN tidak ditemukan');
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
          tmtPensiun: dto.tmtPensiun ? new Date(dto.tmtPensiun) : undefined,
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
      throw new NotFoundException('Data SIPENSIUN tidak ditemukan setelah submit');
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

  private normalizeFilters(
    query: SipensiunCaseListQueryDto,
  ): NormalizedSipensiunCaseFilters {
    return {
      q: this.normalizeOptionalText(query.q),
      jenisPensiun: query.jenisPensiun,
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
      tasks: siapCase.tasks,
      workflowLogs: siapCase.workflowLogs,
      slaTracking: siapCase.slaTracking,
      timelines: siapCase.timelines,
    };
  }
}
