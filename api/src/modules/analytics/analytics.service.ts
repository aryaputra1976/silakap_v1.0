import { Inject, Injectable } from '@nestjs/common';
import { AnalyticsRepository, GroupCount } from './analytics.repository';

type AnalyticsGroupResponse = {
  key: string;
  label: string;
  total: number;
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
      casesByState,
      casesByServiceType,
      tasksByStatus,
      documentsByType,
    ] = await Promise.all([
      this.analyticsRepository.countAsn(),
      this.analyticsRepository.countSipensiunCases(),
      this.analyticsRepository.countSiapCases(),
      this.analyticsRepository.countPendingTasks(),
      this.analyticsRepository.countCompletedTasks(),
      this.analyticsRepository.countDocuments(),
      this.analyticsRepository.groupCasesByState(),
      this.analyticsRepository.groupCasesByServiceType(),
      this.analyticsRepository.groupTasksByStatus(),
      this.analyticsRepository.groupDocumentsByType(),
    ]);

    return {
      summary: {
        totalAsn,
        totalSipensiun,
        totalSiapCases,
        pendingTasks,
        completedTasks,
        uploadedDocuments,
      },
      casesByState: this.toGroupResponse(casesByState),
      casesByServiceType: this.toGroupResponse(casesByServiceType),
      tasksByStatus: this.toGroupResponse(tasksByStatus),
      documentsByType: this.toGroupResponse(documentsByType),
    };
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
