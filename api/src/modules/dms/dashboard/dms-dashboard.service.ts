import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  DmsDocumentCategory,
  DmsDocumentStatus,
} from '@prisma/client';
import { AuthUser } from '../../auth/auth.types';
import { DmsDashboardQueryDto } from '../dto/dms-dashboard-query.dto';
import {
  DmsDashboardCategorySummary,
  DmsDashboardRepository,
  DmsDashboardStatusSummary,
  NormalizedDmsDashboardFilters,
} from './dms-dashboard.repository';

@Injectable()
export class DmsDashboardService {
  constructor(
    @Inject(DmsDashboardRepository)
    private readonly dmsDashboardRepository: DmsDashboardRepository,
  ) {}

  async getSummary(query: DmsDashboardQueryDto, user: AuthUser) {
    const filters = this.normalizeFilters(query);
    const result = await this.dmsDashboardRepository.getSummary(filters, user);

    return {
      total: result.total,
      byStatus: this.fillStatusSummary(result.byStatus),
      byCategory: this.fillCategorySummary(result.byCategory),
      waitingVerification: result.waitingVerification,
      withoutFile: result.withoutFile,
      verifiedOrArchived: result.verifiedOrArchived,
      rejected: result.rejected,
      latestDocuments: result.latestDocuments,
    };
  }

  private normalizeFilters(
    query: DmsDashboardQueryDto,
  ): NormalizedDmsDashboardFilters {
    return {
      year: this.normalizeNumber(query.year, 'Tahun tidak valid', 2000, 2100),
      month: this.normalizeNumber(query.month, 'Bulan tidak valid', 1, 12),
      quarter: this.normalizeNumber(
        query.quarter,
        'Triwulan tidak valid',
        1,
        4,
      ),
      unitKerjaId: this.normalizeOptionalText(query.unitKerjaId),
      category: query.category,
      status: query.status,
    };
  }

  private normalizeOptionalText(value: string | undefined) {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }

  private normalizeNumber(
    value: string | undefined,
    message: string,
    min: number,
    max: number,
  ) {
    const normalized = value?.trim();

    if (!normalized) {
      return undefined;
    }

    const parsed = Number(normalized);

    if (!Number.isFinite(parsed)) {
      throw new BadRequestException(message);
    }

    const number = Math.trunc(parsed);

    if (number < min || number > max) {
      throw new BadRequestException(message);
    }

    return number;
  }

  private fillStatusSummary(
    items: DmsDashboardStatusSummary[],
  ): DmsDashboardStatusSummary[] {
    return Object.values(DmsDocumentStatus).map((status) => ({
      status,
      total: items.find((item) => item.status === status)?.total ?? 0,
    }));
  }

  private fillCategorySummary(
    items: DmsDashboardCategorySummary[],
  ): DmsDashboardCategorySummary[] {
    return Object.values(DmsDocumentCategory).map((category) => ({
      category,
      total: items.find((item) => item.category === category)?.total ?? 0,
    }));
  }
}
