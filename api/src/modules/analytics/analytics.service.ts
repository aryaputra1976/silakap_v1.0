import { Inject, Injectable } from '@nestjs/common';
import {
  ActiveCasesSummary,
  AnalyticsRepository,
  DocumentCompletenessSummary,
  GroupCount,
  RecentTimelineItem,
} from './analytics.repository';

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

  async getDashboard() {
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
      this.analyticsRepository.countSipensiunCases(),
      this.analyticsRepository.countSiapCases(),
      this.analyticsRepository.countPendingTasks(),
      this.analyticsRepository.countCompletedTasks(),
      this.analyticsRepository.countDocuments(),
      this.analyticsRepository.countSlaOverdue(),
      this.analyticsRepository.groupCasesByState(),
      this.analyticsRepository.groupCasesByServiceType(),
      this.analyticsRepository.groupTasksByStatus(),
      this.analyticsRepository.groupDocumentsByType(),
      this.analyticsRepository.groupSlaByStatus(),
      this.analyticsRepository.groupSipensiunByJenis(),
      this.analyticsRepository.countActiveCases(),
      this.analyticsRepository.getDocumentCompleteness(),
      this.analyticsRepository.getRecentTimeline(10),
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