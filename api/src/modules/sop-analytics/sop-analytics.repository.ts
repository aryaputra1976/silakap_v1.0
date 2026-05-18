import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AnalyticsQueryDto } from './dto/analytics-query.dto';

// ─── Exported interfaces ───────────────────────────────────────────────────────

export interface ComplianceBySopRow {
  sopCode: string;
  moduleKey: string;
  score: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  checklistScore: number;
  approvalScore: number;
  evidenceScore: number;
  governanceScore: number;
  timelinessScore: number;
  totalInstances: number;
  approvedInstances: number;
  rejectedInstances: number;
  totalItems: number;
  evidenceItems: number;
  governanceStatus: string | null;
  isOverdue: boolean;
}

export interface ComplianceSummary {
  averageScore: number;
  totalSops: number;
  lowRisk: number;
  mediumRisk: number;
  highRisk: number;
  criticalRisk: number;
  fullyApproved: number;
  overdueCount: number;
  byModule: Array<{ moduleKey: string; averageScore: number; total: number }>;
}

export interface EvidenceCompletenessRow {
  sopCode: string;
  moduleKey: string;
  totalItems: number;
  evidenceItems: number;
  evidencePercent: number;
}

export interface RiskInsightRow {
  sopCode: string;
  moduleKey: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number;
  reasons: string[];
}

export interface ExecutiveSummary {
  overallScore: number;
  totalSops: number;
  riskDistribution: { LOW: number; MEDIUM: number; HIGH: number; CRITICAL: number };
  topRisks: RiskInsightRow[];
  byModule: Array<{ moduleKey: string; averageScore: number; total: number; criticalCount: number }>;
  overdueReviewCount: number;
  evidenceGapCount: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeRiskLevel(score: number, isOverdue: boolean, hasRejected: boolean): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (score < 50 || (isOverdue && hasRejected)) return 'CRITICAL';
  if (score < 70) return 'HIGH';
  if (score < 85) return 'MEDIUM';
  return 'LOW';
}

function buildReasons(row: {
  checklistScore: number;
  approvalScore: number;
  evidenceScore: number;
  governanceScore: number;
  timelinessScore: number;
  isOverdue: boolean;
  rejectedInstances: number;
}): string[] {
  const reasons: string[] = [];
  if (row.checklistScore < 20) reasons.push('Checklist tidak lengkap (<50%)');
  if (row.approvalScore < 10) reasons.push('Tidak ada checklist yang disetujui');
  if (row.evidenceScore < 10) reasons.push('Bukti dukung kurang (<50%)');
  if (row.governanceScore === 0) reasons.push('Tidak ada SOP governance yang aktif');
  if (row.timelinessScore === 0) reasons.push('Review SOP terlambat (overdue)');
  if (row.rejectedInstances > 0) reasons.push(`${row.rejectedInstances} checklist ditolak`);
  return reasons;
}

// ─── Repository ────────────────────────────────────────────────────────────────

@Injectable()
export class SopAnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Core: per-SOP compliance rows ─────────────────────────────────────────

  async getComplianceBySop(q: AnalyticsQueryDto): Promise<ComplianceBySopRow[]> {
    const instanceWhere: Record<string, unknown> = {};
    if (q.moduleKey) instanceWhere['moduleKey'] = q.moduleKey;
    if (q.sopCode) instanceWhere['sopCode'] = q.sopCode;

    // 1. Instance aggregates per sopCode+moduleKey
    const [instanceGroups, approvedGroups, rejectedGroups] = await Promise.all([
      this.prisma.sopChecklistInstance.groupBy({
        by: ['sopCode', 'moduleKey'],
        where: instanceWhere,
        _count: { id: true },
        _avg: { progress: true },
      }),
      this.prisma.sopChecklistInstance.groupBy({
        by: ['sopCode'],
        where: { ...instanceWhere, status: 'APPROVED' },
        _count: { id: true },
      }),
      this.prisma.sopChecklistInstance.groupBy({
        by: ['sopCode'],
        where: { ...instanceWhere, status: 'REJECTED' },
        _count: { id: true },
      }),
    ]);

    if (instanceGroups.length === 0) return [];

    const sopCodes = [...new Set(instanceGroups.map((g) => g.sopCode))];

    // 2. Get all instance IDs for evidence computation
    const instances = await this.prisma.sopChecklistInstance.findMany({
      where: { sopCode: { in: sopCodes }, ...instanceWhere },
      select: { id: true, sopCode: true },
    });

    const allInstanceIds = instances.map((i) => i.id);
    const instanceIdsBySop = new Map<string, string[]>();
    for (const inst of instances) {
      if (!instanceIdsBySop.has(inst.sopCode)) instanceIdsBySop.set(inst.sopCode, []);
      instanceIdsBySop.get(inst.sopCode)!.push(inst.id);
    }

    // 3. Item evidence counts (batch, not per-SOP N+1)
    const [totalItemGroups, evidenceItemGroups] = await Promise.all([
      this.prisma.sopChecklistItem.groupBy({
        by: ['instanceId'],
        where: { instanceId: { in: allInstanceIds } },
        _count: { id: true },
      }),
      this.prisma.sopChecklistItem.groupBy({
        by: ['instanceId'],
        where: { instanceId: { in: allInstanceIds }, dmsDocumentId: { not: null } },
        _count: { id: true },
      }),
    ]);

    const totalItemsByInstance = new Map(totalItemGroups.map((g) => [g.instanceId, g._count.id]));
    const evidenceByInstance = new Map(evidenceItemGroups.map((g) => [g.instanceId, g._count.id]));

    // 4. Governance records (current) for each sopCode
    const govRecords = await this.prisma.sopGovernanceRecord.findMany({
      where: {
        sopCode: { in: sopCodes },
        ...(q.moduleKey ? { moduleKey: q.moduleKey } : {}),
      },
      select: { sopCode: true, status: true, isCurrent: true, reviewDueDate: true },
      orderBy: [{ isCurrent: 'desc' }, { updatedAt: 'desc' }],
    });

    // Build a map: sopCode → best governance record
    const govBySop = new Map<string, { status: string; isCurrent: boolean; reviewDueDate: Date | null }>();
    for (const r of govRecords) {
      if (!govBySop.has(r.sopCode)) govBySop.set(r.sopCode, r);
    }

    // 5. Assemble rows
    const now = new Date();
    const approvedMap = new Map(approvedGroups.map((g) => [g.sopCode, g._count.id]));
    const rejectedMap = new Map(rejectedGroups.map((g) => [g.sopCode, g._count.id]));

    return instanceGroups.map((g) => {
      const instIds = instanceIdsBySop.get(g.sopCode) ?? [];
      const totalItems = instIds.reduce((sum, id) => sum + (totalItemsByInstance.get(id) ?? 0), 0);
      const evidenceItems = instIds.reduce((sum, id) => sum + (evidenceByInstance.get(id) ?? 0), 0);

      const totalInstances = g._count.id;
      const approvedInstances = approvedMap.get(g.sopCode) ?? 0;
      const rejectedInstances = rejectedMap.get(g.sopCode) ?? 0;
      const avgProgress = g._avg.progress ?? 0;

      const gov = govBySop.get(g.sopCode);
      const govActive = gov?.status === 'ACTIVE' && gov?.isCurrent === true;
      const isOverdue = gov?.reviewDueDate != null && gov.reviewDueDate < now;

      // Component scores
      const checklistScore = Math.round((avgProgress / 100) * 40);
      const approvalScore = totalInstances > 0 ? Math.round((approvedInstances / totalInstances) * 20) : 0;
      const evidenceScore = totalItems > 0 ? Math.round((evidenceItems / totalItems) * 20) : 0;
      const governanceScore = govActive ? 10 : 0;
      const timelinessScore = isOverdue ? 0 : 10;
      const score = checklistScore + approvalScore + evidenceScore + governanceScore + timelinessScore;

      const riskLevel = computeRiskLevel(score, isOverdue, rejectedInstances > 0);

      return {
        sopCode: g.sopCode,
        moduleKey: g.moduleKey,
        score,
        riskLevel,
        checklistScore,
        approvalScore,
        evidenceScore,
        governanceScore,
        timelinessScore,
        totalInstances,
        approvedInstances,
        rejectedInstances,
        totalItems,
        evidenceItems,
        governanceStatus: gov?.status ?? null,
        isOverdue,
      };
    });
  }

  // ── Summary ────────────────────────────────────────────────────────────────

  async getComplianceSummary(q: AnalyticsQueryDto): Promise<ComplianceSummary> {
    const rows = await this.getComplianceBySop(q);

    if (rows.length === 0) {
      return {
        averageScore: 0, totalSops: 0,
        lowRisk: 0, mediumRisk: 0, highRisk: 0, criticalRisk: 0,
        fullyApproved: 0, overdueCount: 0, byModule: [],
      };
    }

    const byModuleMap = new Map<string, { totalScore: number; total: number }>();
    let lowRisk = 0, mediumRisk = 0, highRisk = 0, criticalRisk = 0;
    let fullyApproved = 0, overdueCount = 0;

    for (const r of rows) {
      if (r.riskLevel === 'LOW') lowRisk++;
      else if (r.riskLevel === 'MEDIUM') mediumRisk++;
      else if (r.riskLevel === 'HIGH') highRisk++;
      else criticalRisk++;

      if (r.totalInstances > 0 && r.approvedInstances === r.totalInstances) fullyApproved++;
      if (r.isOverdue) overdueCount++;

      const mod = byModuleMap.get(r.moduleKey) ?? { totalScore: 0, total: 0 };
      mod.totalScore += r.score;
      mod.total += 1;
      byModuleMap.set(r.moduleKey, mod);
    }

    const averageScore = Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length);

    const byModule = Array.from(byModuleMap.entries()).map(([moduleKey, v]) => ({
      moduleKey,
      averageScore: Math.round(v.totalScore / v.total),
      total: v.total,
    }));

    return {
      averageScore, totalSops: rows.length,
      lowRisk, mediumRisk, highRisk, criticalRisk,
      fullyApproved, overdueCount, byModule,
    };
  }

  // ── Risk insights ──────────────────────────────────────────────────────────

  async getRiskInsights(q: AnalyticsQueryDto): Promise<RiskInsightRow[]> {
    const rows = await this.getComplianceBySop(q);
    return rows
      .filter((r) => r.riskLevel === 'CRITICAL' || r.riskLevel === 'HIGH')
      .sort((a, b) => a.score - b.score)
      .map((r) => ({
        sopCode: r.sopCode,
        moduleKey: r.moduleKey,
        riskLevel: r.riskLevel,
        score: r.score,
        reasons: buildReasons(r),
      }));
  }

  // ── Evidence completeness ──────────────────────────────────────────────────

  async getEvidenceCompleteness(q: AnalyticsQueryDto): Promise<EvidenceCompletenessRow[]> {
    const rows = await this.getComplianceBySop(q);
    return rows
      .map((r) => ({
        sopCode: r.sopCode,
        moduleKey: r.moduleKey,
        totalItems: r.totalItems,
        evidenceItems: r.evidenceItems,
        evidencePercent: r.totalItems > 0 ? Math.round((r.evidenceItems / r.totalItems) * 100) : 0,
      }))
      .sort((a, b) => a.evidencePercent - b.evidencePercent);
  }

  // ── Executive summary ──────────────────────────────────────────────────────

  async getExecutiveSummary(q: AnalyticsQueryDto): Promise<ExecutiveSummary> {
    const rows = await this.getComplianceBySop(q);

    if (rows.length === 0) {
      return {
        overallScore: 0, totalSops: 0,
        riskDistribution: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
        topRisks: [], byModule: [], overdueReviewCount: 0, evidenceGapCount: 0,
      };
    }

    const dist = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    const byModuleMap = new Map<string, { totalScore: number; total: number; criticalCount: number }>();
    let overdueReviewCount = 0, evidenceGapCount = 0;

    for (const r of rows) {
      dist[r.riskLevel]++;
      if (r.isOverdue) overdueReviewCount++;
      if (r.totalItems > 0 && r.evidenceItems / r.totalItems < 0.5) evidenceGapCount++;

      const mod = byModuleMap.get(r.moduleKey) ?? { totalScore: 0, total: 0, criticalCount: 0 };
      mod.totalScore += r.score;
      mod.total += 1;
      if (r.riskLevel === 'CRITICAL') mod.criticalCount++;
      byModuleMap.set(r.moduleKey, mod);
    }

    const topRisks: RiskInsightRow[] = rows
      .filter((r) => r.riskLevel === 'CRITICAL' || r.riskLevel === 'HIGH')
      .sort((a, b) => a.score - b.score)
      .slice(0, 5)
      .map((r) => ({
        sopCode: r.sopCode,
        moduleKey: r.moduleKey,
        riskLevel: r.riskLevel,
        score: r.score,
        reasons: buildReasons(r),
      }));

    const byModule = Array.from(byModuleMap.entries()).map(([moduleKey, v]) => ({
      moduleKey,
      averageScore: Math.round(v.totalScore / v.total),
      total: v.total,
      criticalCount: v.criticalCount,
    }));

    return {
      overallScore: Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length),
      totalSops: rows.length,
      riskDistribution: dist,
      topRisks,
      byModule,
      overdueReviewCount,
      evidenceGapCount,
    };
  }
}
