import { ForbiddenException, Injectable } from '@nestjs/common';
import { SopAnalyticsRepository } from './sop-analytics.repository';
import type { AnalyticsQueryDto } from './dto/analytics-query.dto';
import type { AuthUser } from '../auth/auth.types';

const BLOCKED = new Set(['OPD', 'PPPK']);

function getPrimary(user: AuthUser): string {
  return Array.isArray(user.roles) ? (user.roles[0] ?? 'OPD') : 'OPD';
}

@Injectable()
export class SopAnalyticsService {
  constructor(private readonly repo: SopAnalyticsRepository) {}

  private assertNotBlocked(user: AuthUser) {
    const role = getPrimary(user);
    if (BLOCKED.has(role)) throw new ForbiddenException('Akses tidak diizinkan.');
  }

  getComplianceSummary(user: AuthUser, q: AnalyticsQueryDto) {
    this.assertNotBlocked(user);
    return this.repo.getComplianceSummary(q);
  }

  getComplianceBySop(user: AuthUser, q: AnalyticsQueryDto) {
    this.assertNotBlocked(user);
    return this.repo.getComplianceBySop(q);
  }

  getRiskInsights(user: AuthUser, q: AnalyticsQueryDto) {
    this.assertNotBlocked(user);
    return this.repo.getRiskInsights(q);
  }

  getEvidenceCompleteness(user: AuthUser, q: AnalyticsQueryDto) {
    this.assertNotBlocked(user);
    return this.repo.getEvidenceCompleteness(q);
  }

  getExecutiveSummary(user: AuthUser, q: AnalyticsQueryDto) {
    this.assertNotBlocked(user);
    return this.repo.getExecutiveSummary(q);
  }
}
