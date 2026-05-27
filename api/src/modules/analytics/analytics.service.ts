import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  ActiveCasesSummary,
  AnalyticsRepository,
  AnalyticsDashboardFilters,
  DocumentCompletenessSummary,
  GroupCount,
  RecentTimelineItem,
} from './analytics.repository';
import type { AnalyticsDashboardQueryDto } from './dto/analytics-dashboard-query.dto';

type AnalyticsGroupResponse = {
  key: string;
  label: string;
  total: number;
};

type RecentTimelineResponse = {
  id: string;
  caseId: string;
  caseNumber: string;
  serviceType: string;
  currentState: string;
  status: string;
  eventType: string;
  title: string;
  description: string | null;
  actorName: string | null;
  createdAt: string;
};

@Injectable()
export class AnalyticsService {
  constructor(
    @Inject(AnalyticsRepository)
    private readonly analyticsRepository: AnalyticsRepository,
  ) {}

  async getDashboard(query: AnalyticsDashboardQueryDto = {}) {
    const filters = this.normalizeFilters(query);
    const [
      totalAsn,
      totalSipensiun,
      totalSiapCases,
      pendingTasks,
      completedTasks,
      uploadedDocuments,
      slaOverdue,
      casesByState,
      casesByServiceType,
      tasksByStatus,
      documentsByType,
      slaSummary,
      sipensiunByJenis,
      activeCases,
      documentCompleteness,
      recentTimeline,
    ] = await Promise.all([
      this.analyticsRepository.countAsn(),
      this.analyticsRepository.countSipensiunCases(filters),
      this.analyticsRepository.countSiapCases(filters),
      this.analyticsRepository.countPendingTasks(filters),
      this.analyticsRepository.countCompletedTasks(filters),
      this.analyticsRepository.countDocuments(filters),
      this.analyticsRepository.countSlaOverdue(filters),
      this.analyticsRepository.groupCasesByState(filters),
      this.analyticsRepository.groupCasesByServiceType(filters),
      this.analyticsRepository.groupTasksByStatus(filters),
      this.analyticsRepository.groupDocumentsByType(filters),
      this.analyticsRepository.groupSlaByStatus(filters),
      this.analyticsRepository.groupSipensiunByJenis(filters),
      this.analyticsRepository.countActiveCases(filters),
      this.analyticsRepository.getDocumentCompleteness(filters),
      this.analyticsRepository.getRecentTimeline(10, filters),
    ]);

    return {
      summary: {
        totalAsn,
        totalSipensiun,
        totalSiapCases,
        pendingTasks,
        completedTasks,
        uploadedDocuments,
        slaOverdue,
      },
      activeCases: this.toActiveCasesResponse(activeCases),
      documentCompleteness:
        this.toDocumentCompletenessResponse(documentCompleteness),
      casesByState: this.toGroupResponse(casesByState),
      casesByServiceType: this.toGroupResponse(casesByServiceType),
      tasksByStatus: this.toGroupResponse(tasksByStatus),
      documentsByType: this.toGroupResponse(documentsByType),
      slaSummary: this.toGroupResponse(slaSummary),
      sipensiunByJenis: this.toGroupResponse(sipensiunByJenis),
      recentTimeline: this.toRecentTimelineResponse(recentTimeline),
    };
  }

  private normalizeFilters(
    query: AnalyticsDashboardQueryDto,
  ): AnalyticsDashboardFilters {
    const year = this.normalizeNumber(query.year, 'Tahun tidak valid', 2000, 2100);
    const quarter = this.normalizeNumber(query.quarter, 'Triwulan tidak valid', 1, 4);
    const month = this.normalizeNumber(query.month, 'Bulan tidak valid', 1, 12);

    if (quarter && month) {
      throw new BadRequestException('Pilih bulan atau triwulan, bukan keduanya.');
    }

    if (!year) {
      return {};
    }

    if (month) {
      const from = new Date(Date.UTC(year, month - 1, 1));
      const to = new Date(Date.UTC(year, month, 1));
      return { year, month, from, to };
    }

    if (quarter) {
      const startMonth = (quarter - 1) * 3;
      const from = new Date(Date.UTC(year, startMonth, 1));
      const to = new Date(Date.UTC(year, startMonth + 3, 1));
      return { year, quarter, from, to };
    }

    return {
      year,
      from: new Date(Date.UTC(year, 0, 1)),
      to: new Date(Date.UTC(year + 1, 0, 1)),
    };
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

  private toActiveCasesResponse(activeCases: ActiveCasesSummary) {
    return {
      totalActive: activeCases.totalActive,
      draft: activeCases.draft,
      submitted: activeCases.submitted,
    };
  }

  private toDocumentCompletenessResponse(
    documentCompleteness: DocumentCompletenessSummary,
  ) {
    return {
      totalDocuments: documentCompleteness.totalDocuments,
      casesWithDocuments: documentCompleteness.casesWithDocuments,
      casesWithoutDocuments: documentCompleteness.casesWithoutDocuments,
    };
  }

  private toRecentTimelineResponse(
    timeline: RecentTimelineItem[],
  ): RecentTimelineResponse[] {
    return timeline.map((item) => ({
      id: item.id,
      caseId: item.caseId,
      caseNumber: item.case.caseNumber,
      serviceType: item.case.serviceType,
      currentState: item.case.currentState,
      status: item.case.status,
      eventType: item.eventType,
      title: item.title,
      description: item.description,
      actorName: item.actor?.name ?? null,
      createdAt: item.createdAt.toISOString(),
    }));
  }

  private toGroupResponse(groups: GroupCount[]): AnalyticsGroupResponse[] {
    return groups.map((group) => ({
      key: group.key,
      label: this.toReadableLabel(group.key),
      total: group.total,
    }));
  }

  private toReadableLabel(value: string): string {
    return value
      .split('_')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
