import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { ReportQueryDto } from './dto/report-query.dto';

// ─── Shared types ──────────────────────────────────────────────────────────────

export interface ReportComplianceRow {
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
  totalItems: number;
  evidenceItems: number;
  isOverdue: boolean;
}

export interface ReportGovernanceSummary {
  total: number;
  active: number;
  draft: number;
  needsReview: number;
  revision: number;
  archived: number;
}

export interface ReportReviewSummary {
  dueSoon: number;
  overdue: number;
  needsReview: number;
  openReminders: number;
}

export interface EvidenceDocument {
  id: string;
  title: string;
  category: string;
  subCategory: string | null;
  accessLevel: string;
  uploadedAt: string;
  linkedChecklistItemId: string;
}

export interface EvidencePackageBySop {
  sopCode: string;
  title: string;
  moduleKey: string;
  relatedRhkCodes: string[];
  evidenceCompletenessPercent: number;
  evidenceDocuments: EvidenceDocument[];
  missingEvidenceItems: string[];
}

export interface SopExecutiveReport {
  periodLabel: string;
  generatedAt: string;
  generatedByRole: string;
  overallScore: number;
  totalSops: number;
  riskDistribution: { LOW: number; MEDIUM: number; HIGH: number; CRITICAL: number };
  complianceSummary: {
    averageScore: number;
    lowRisk: number;
    mediumRisk: number;
    highRisk: number;
    criticalRisk: number;
    fullyApproved: number;
    overdueCount: number;
  };
  topRisks: Array<{ sopCode: string; moduleKey: string; score: number; riskLevel: string; reasons: string[] }>;
  byModule: Array<{ moduleKey: string; averageScore: number; total: number; criticalCount: number }>;
  bySop: ReportComplianceRow[];
  governanceSummary: ReportGovernanceSummary;
  reviewSummary: ReportReviewSummary;
  recommendedActions: string[];
  conclusion: string;
}

export interface SopEvidencePackage {
  periodLabel: string;
  totalSop: number;
  totalEvidence: number;
  bySop: EvidencePackageBySop[];
}

export interface PrintSection {
  title: string;
  description: string;
  type: string;
  rows: unknown[];
}

export interface PrintSignature {
  roleLabel: string;
  namePlaceholder: string;
  nipPlaceholder: string;
}

export interface SopSummaryPrint {
  header: { organization: string; reportTitle: string; period: string };
  generatedAt: string;
  sections: PrintSection[];
  signatures: PrintSignature[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPeriodLabel(q: ReportQueryDto): string {
  const now = new Date();
  if (q.periodType === 'MONTHLY') {
    return now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  }
  if (q.periodType === 'QUARTERLY') {
    const q4 = Math.ceil((now.getMonth() + 1) / 3);
    return `Triwulan ${q4} ${now.getFullYear()}`;
  }
  if (q.from && q.to) {
    const from = new Date(q.from).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const to = new Date(q.to).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    return `${from} – ${to}`;
  }
  return `Tahun ${now.getFullYear()}`;
}

function computeRisk(score: number, isOverdue: boolean, hasRejected: boolean): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (score < 50 || (isOverdue && hasRejected)) return 'CRITICAL';
  if (score < 70) return 'HIGH';
  if (score < 85) return 'MEDIUM';
  return 'LOW';
}

function buildReasons(r: {
  checklistScore: number; approvalScore: number; evidenceScore: number;
  governanceScore: number; timelinessScore: number; isOverdue: boolean;
}): string[] {
  const reasons: string[] = [];
  if (r.checklistScore < 20) reasons.push('Checklist tidak lengkap (<50%)');
  if (r.approvalScore < 10) reasons.push('Tidak ada checklist yang disetujui');
  if (r.evidenceScore < 10) reasons.push('Bukti dukung kurang (<50%)');
  if (r.governanceScore === 0) reasons.push('Tidak ada SOP governance aktif');
  if (r.timelinessScore === 0) reasons.push('Review SOP terlambat (overdue)');
  return reasons;
}

function buildRecommendations(data: {
  criticalRisk: number; overdueCount: number; evidenceGapCount: number;
  govTotal: number; govActive: number; fullyApproved: number; totalSops: number;
}): string[] {
  const actions: string[] = [];
  if (data.criticalRisk > 0) {
    actions.push(`Prioritaskan perbaikan ${data.criticalRisk} SOP dengan risiko CRITICAL (skor < 50).`);
  }
  if (data.overdueCount > 0) {
    actions.push(`Segera laksanakan review berkala untuk ${data.overdueCount} SOP yang melewati batas waktu.`);
  }
  if (data.evidenceGapCount > 0) {
    actions.push(`Lengkapi bukti dukung DMS untuk ${data.evidenceGapCount} SOP dengan kelengkapan < 50%.`);
  }
  if (data.govTotal > 0 && data.govActive < data.govTotal) {
    actions.push(`Aktifkan atau buat SOP Governance Record untuk ${data.govTotal - data.govActive} SOP yang belum memiliki versi aktif.`);
  }
  if (data.totalSops > 0 && data.fullyApproved < data.totalSops) {
    const pending = data.totalSops - data.fullyApproved;
    actions.push(`Proses persetujuan checklist untuk ${pending} SOP yang belum sepenuhnya disetujui.`);
  }
  if (actions.length === 0) {
    actions.push('Pertahankan capaian kepatuhan SOP yang sudah baik dan lakukan review berkala sesuai jadwal.');
  }
  return actions;
}

// ─── Repository ────────────────────────────────────────────────────────────────

@Injectable()
export class SopReportsRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  // ── Shared: compute compliance rows ─────────────────────────────────────────

  private async computeComplianceRows(q: ReportQueryDto): Promise<ReportComplianceRow[]> {
    const instanceWhere: Record<string, unknown> = {};
    if (q.moduleKey) instanceWhere['moduleKey'] = q.moduleKey;
    if (q.sopCode) instanceWhere['sopCode'] = q.sopCode;

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

    const instances = await this.prisma.sopChecklistInstance.findMany({
      where: { sopCode: { in: sopCodes }, ...instanceWhere },
      select: { id: true, sopCode: true },
    });

    const allIds = instances.map((i) => i.id);
    const idsBySop = new Map<string, string[]>();
    for (const inst of instances) {
      if (!idsBySop.has(inst.sopCode)) idsBySop.set(inst.sopCode, []);
      idsBySop.get(inst.sopCode)!.push(inst.id);
    }

    const [totalItems, evidenceItems] = await Promise.all([
      this.prisma.sopChecklistItem.groupBy({
        by: ['instanceId'],
        where: { instanceId: { in: allIds } },
        _count: { id: true },
      }),
      this.prisma.sopChecklistItem.groupBy({
        by: ['instanceId'],
        where: { instanceId: { in: allIds }, dmsDocumentId: { not: null } },
        _count: { id: true },
      }),
    ]);

    const totalMap = new Map(totalItems.map((g) => [g.instanceId, g._count.id]));
    const evidMap = new Map(evidenceItems.map((g) => [g.instanceId, g._count.id]));

    const govRecords = await this.prisma.sopGovernanceRecord.findMany({
      where: { sopCode: { in: sopCodes }, ...(q.moduleKey ? { moduleKey: q.moduleKey } : {}) },
      select: { sopCode: true, status: true, isCurrent: true, reviewDueDate: true },
      orderBy: [{ isCurrent: 'desc' }, { updatedAt: 'desc' }],
    });

    const govBySop = new Map<string, { status: string; isCurrent: boolean; reviewDueDate: Date | null }>();
    for (const r of govRecords) {
      if (!govBySop.has(r.sopCode)) govBySop.set(r.sopCode, r);
    }

    const now = new Date();
    const approvedMap = new Map(approvedGroups.map((g) => [g.sopCode, g._count.id]));
    const rejectedMap = new Map(rejectedGroups.map((g) => [g.sopCode, g._count.id]));

    return instanceGroups.map((g) => {
      const instIds = idsBySop.get(g.sopCode) ?? [];
      const tot = instIds.reduce((s, id) => s + (totalMap.get(id) ?? 0), 0);
      const evid = instIds.reduce((s, id) => s + (evidMap.get(id) ?? 0), 0);

      const totalInstances = g._count.id;
      const approvedInstances = approvedMap.get(g.sopCode) ?? 0;
      const rejectedInstances = rejectedMap.get(g.sopCode) ?? 0;
      const avgProgress = g._avg.progress ?? 0;

      const gov = govBySop.get(g.sopCode);
      const govActive = gov?.status === 'ACTIVE' && gov?.isCurrent === true;
      const isOverdue = gov?.reviewDueDate != null && gov.reviewDueDate < now;

      const checklistScore = Math.round((avgProgress / 100) * 40);
      const approvalScore = totalInstances > 0 ? Math.round((approvedInstances / totalInstances) * 20) : 0;
      const evidenceScore = tot > 0 ? Math.round((evid / tot) * 20) : 0;
      const governanceScore = govActive ? 10 : 0;
      const timelinessScore = isOverdue ? 0 : 10;
      const score = checklistScore + approvalScore + evidenceScore + governanceScore + timelinessScore;

      return {
        sopCode: g.sopCode, moduleKey: g.moduleKey, score,
        riskLevel: computeRisk(score, isOverdue, rejectedInstances > 0),
        checklistScore, approvalScore, evidenceScore, governanceScore, timelinessScore,
        totalInstances, approvedInstances, totalItems: tot, evidenceItems: evid, isOverdue,
      };
    });
  }

  // ── Executive report ─────────────────────────────────────────────────────────

  async getExecutiveReport(q: ReportQueryDto, actorRole: string): Promise<SopExecutiveReport> {
    const periodLabel = buildPeriodLabel(q);
    const rows = await this.computeComplianceRows(q);

    const dist = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    const byModuleMap = new Map<string, { totalScore: number; total: number; criticalCount: number }>();
    let fullyApproved = 0, overdueCount = 0, evidenceGapCount = 0;

    for (const r of rows) {
      dist[r.riskLevel]++;
      if (r.totalInstances > 0 && r.approvedInstances === r.totalInstances) fullyApproved++;
      if (r.isOverdue) overdueCount++;
      if (r.totalItems > 0 && r.evidenceItems / r.totalItems < 0.5) evidenceGapCount++;
      const mod = byModuleMap.get(r.moduleKey) ?? { totalScore: 0, total: 0, criticalCount: 0 };
      mod.totalScore += r.score;
      mod.total += 1;
      if (r.riskLevel === 'CRITICAL') mod.criticalCount++;
      byModuleMap.set(r.moduleKey, mod);
    }

    const overallScore = rows.length > 0 ? Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length) : 0;

    const topRisks = rows
      .filter((r) => r.riskLevel === 'CRITICAL' || r.riskLevel === 'HIGH')
      .sort((a, b) => a.score - b.score)
      .slice(0, 5)
      .map((r) => ({ sopCode: r.sopCode, moduleKey: r.moduleKey, score: r.score, riskLevel: r.riskLevel, reasons: buildReasons(r) }));

    const byModule = Array.from(byModuleMap.entries()).map(([moduleKey, v]) => ({
      moduleKey, averageScore: Math.round(v.totalScore / v.total), total: v.total, criticalCount: v.criticalCount,
    }));

    // Governance summary
    const govWhere = q.moduleKey ? { moduleKey: q.moduleKey } : {};
    const [govTotal, govActive, govDraft, govNeedsReview, govRevision, govArchived] = await Promise.all([
      this.prisma.sopGovernanceRecord.count({ where: govWhere }),
      this.prisma.sopGovernanceRecord.count({ where: { ...govWhere, status: 'ACTIVE' } }),
      this.prisma.sopGovernanceRecord.count({ where: { ...govWhere, status: 'DRAFT' } }),
      this.prisma.sopGovernanceRecord.count({ where: { ...govWhere, status: 'NEEDS_REVIEW' } }),
      this.prisma.sopGovernanceRecord.count({ where: { ...govWhere, status: 'REVISION' } }),
      this.prisma.sopGovernanceRecord.count({ where: { ...govWhere, status: 'ARCHIVED' } }),
    ]);

    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const [reviewDueSoon, reviewOverdue, reviewNeedsReview, openReminders] = await Promise.all([
      this.prisma.sopGovernanceRecord.count({
        where: { ...govWhere, reviewDueDate: { gte: now, lte: in30 }, status: { not: 'ARCHIVED' } },
      }),
      this.prisma.sopGovernanceRecord.count({
        where: { ...govWhere, reviewDueDate: { lt: now }, status: { not: 'ARCHIVED' } },
      }),
      this.prisma.sopGovernanceRecord.count({ where: { ...govWhere, status: 'NEEDS_REVIEW' } }),
      this.prisma.sopReviewReminder.count({ where: { status: 'OPEN', ...(q.moduleKey ? { moduleKey: q.moduleKey } : {}) } }),
    ]);

    const governanceSummary: ReportGovernanceSummary = {
      total: govTotal, active: govActive, draft: govDraft,
      needsReview: govNeedsReview, revision: govRevision, archived: govArchived,
    };
    const reviewSummary: ReportReviewSummary = {
      dueSoon: reviewDueSoon, overdue: reviewOverdue,
      needsReview: reviewNeedsReview, openReminders,
    };

    const recommendedActions = buildRecommendations({
      criticalRisk: dist.CRITICAL,
      overdueCount,
      evidenceGapCount,
      govTotal,
      govActive,
      fullyApproved,
      totalSops: rows.length,
    });

    const avgScore = overallScore;
    const conclusion = avgScore >= 85
      ? `Kepatuhan SOP Bidang PPIK berada pada kategori BAIK dengan skor ${avgScore}/100. Pertahankan dan tingkatkan pada periode berikutnya.`
      : avgScore >= 70
        ? `Kepatuhan SOP berada pada kategori CUKUP (${avgScore}/100). Perhatikan area-area yang masih perlu perbaikan.`
        : `Kepatuhan SOP memerlukan perhatian serius (${avgScore}/100). Segera lakukan tindakan perbaikan terhadap SOP dengan risiko tinggi dan kritis.`;

    return {
      periodLabel, generatedAt: new Date().toISOString(), generatedByRole: actorRole,
      overallScore, totalSops: rows.length, riskDistribution: dist,
      complianceSummary: {
        averageScore: overallScore, lowRisk: dist.LOW, mediumRisk: dist.MEDIUM,
        highRisk: dist.HIGH, criticalRisk: dist.CRITICAL, fullyApproved, overdueCount,
      },
      topRisks, byModule, bySop: rows, governanceSummary, reviewSummary,
      recommendedActions, conclusion,
    };
  }

  // ── Evidence package ─────────────────────────────────────────────────────────

  async getEvidencePackage(q: ReportQueryDto): Promise<SopEvidencePackage> {
    const periodLabel = buildPeriodLabel(q);
    const instanceWhere: Record<string, unknown> = {};
    if (q.moduleKey) instanceWhere['moduleKey'] = q.moduleKey;
    if (q.sopCode) instanceWhere['sopCode'] = q.sopCode;

    // Get all instances
    const instances = await this.prisma.sopChecklistInstance.findMany({
      where: instanceWhere,
      select: { id: true, sopCode: true, moduleKey: true },
    });

    if (instances.length === 0) {
      return { periodLabel, totalSop: 0, totalEvidence: 0, bySop: [] };
    }

    const sopCodes = [...new Set(instances.map((i) => i.sopCode))];
    const allIds = instances.map((i) => i.id);
    const idsBySop = new Map<string, string[]>();
    const moduleBySop = new Map<string, string>();
    for (const inst of instances) {
      if (!idsBySop.has(inst.sopCode)) { idsBySop.set(inst.sopCode, []); moduleBySop.set(inst.sopCode, inst.moduleKey); }
      idsBySop.get(inst.sopCode)!.push(inst.id);
    }

    // All checklist items
    const allItems = await this.prisma.sopChecklistItem.findMany({
      where: { instanceId: { in: allIds } },
      select: { instanceId: true, itemId: true, dmsDocumentId: true, status: true },
    });

    // Group items by sopCode via instanceId→sopCode
    const instToSop = new Map(instances.map((i) => [i.id, i.sopCode]));
    const itemsBySop = new Map<string, typeof allItems>();
    for (const item of allItems) {
      const sc = instToSop.get(item.instanceId);
      if (!sc) continue;
      if (!itemsBySop.has(sc)) itemsBySop.set(sc, []);
      itemsBySop.get(sc)!.push(item);
    }

    // DMS documents for evidence items
    const evidenceDocIds = [...new Set(allItems.filter((i) => i.dmsDocumentId).map((i) => i.dmsDocumentId!))];
    const dmsDocuments = evidenceDocIds.length > 0
      ? await this.prisma.dmsDocument.findMany({
          where: { id: { in: evidenceDocIds } },
          select: { id: true, title: true, category: true, subCategory: true, accessLevel: true, createdAt: true },
        })
      : [];
    const dmsMap = new Map(dmsDocuments.map((d) => [d.id, d]));

    // Item doc id to instance → sopCode index for linkedChecklistItemId
    const itemDocToSopItem = new Map<string, string>();
    for (const item of allItems) {
      if (item.dmsDocumentId) itemDocToSopItem.set(item.dmsDocumentId, item.itemId);
    }

    // RHK codes per sopCode
    const kinerjaSops = await this.prisma.kinerjaBidangSop.findMany({
      where: { code: { in: sopCodes } },
      select: { code: true, title: true, rhkMappings: { select: { rhkCode: true } } },
    });
    const kinerjaBySop = new Map(kinerjaSops.map((k) => [k.code, k]));

    // Governance titles as fallback
    const govRecords = await this.prisma.sopGovernanceRecord.findMany({
      where: { sopCode: { in: sopCodes }, isCurrent: true },
      select: { sopCode: true, title: true },
    });
    const govTitleBySop = new Map(govRecords.map((g) => [g.sopCode, g.title]));

    let totalEvidence = 0;

    const bySop: EvidencePackageBySop[] = sopCodes.map((sopCode) => {
      const items = itemsBySop.get(sopCode) ?? [];
      const totalItemCount = items.length;
      const evidItems = items.filter((i) => i.dmsDocumentId);
      const evidencePercent = totalItemCount > 0 ? Math.round((evidItems.length / totalItemCount) * 100) : 0;

      totalEvidence += evidItems.length;

      const evidenceDocuments: EvidenceDocument[] = evidItems.map((item) => {
        const doc = item.dmsDocumentId ? dmsMap.get(item.dmsDocumentId) : undefined;
        return {
          id: item.dmsDocumentId ?? '',
          title: doc?.title ?? '(dokumen tidak ditemukan)',
          category: doc?.category ?? 'BUKTI_DUKUNG',
          subCategory: doc?.subCategory ?? null,
          accessLevel: doc?.accessLevel ?? 'INTERNAL',
          uploadedAt: doc?.createdAt.toISOString() ?? '',
          linkedChecklistItemId: item.itemId,
        };
      });

      const missingEvidenceItems = items
        .filter((i) => !i.dmsDocumentId)
        .map((i) => i.itemId);

      const kb = kinerjaBySop.get(sopCode);

      return {
        sopCode,
        title: kb?.title ?? govTitleBySop.get(sopCode) ?? sopCode,
        moduleKey: moduleBySop.get(sopCode) ?? '',
        relatedRhkCodes: kb?.rhkMappings.map((r) => r.rhkCode) ?? [],
        evidenceCompletenessPercent: evidencePercent,
        evidenceDocuments,
        missingEvidenceItems,
      };
    });

    return { periodLabel, totalSop: sopCodes.length, totalEvidence, bySop };
  }

  // ── Print summary ─────────────────────────────────────────────────────────────

  async getSummaryPrint(q: ReportQueryDto): Promise<SopSummaryPrint> {
    const periodLabel = buildPeriodLabel(q);
    const rows = await this.computeComplianceRows(q);

    const avgScore = rows.length > 0 ? Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length) : 0;
    const riskRows = rows.filter((r) => r.riskLevel === 'CRITICAL' || r.riskLevel === 'HIGH').sort((a, b) => a.score - b.score);

    const govWhere = q.moduleKey ? { moduleKey: q.moduleKey } : {};
    const [govActive, govTotal] = await Promise.all([
      this.prisma.sopGovernanceRecord.count({ where: { ...govWhere, status: 'ACTIVE' } }),
      this.prisma.sopGovernanceRecord.count({ where: govWhere }),
    ]);

    const sections: PrintSection[] = [
      {
        title: 'Ringkasan Capaian Kepatuhan SOP',
        description: 'Skor rata-rata kepatuhan berdasarkan checklist, persetujuan, bukti dukung, governance, dan ketepatan review.',
        type: 'compliance_summary',
        rows: [
          { label: 'Skor Kepatuhan Rata-rata', value: `${avgScore} / 100` },
          { label: 'Total SOP Dipantau', value: rows.length },
          { label: 'Governance Aktif', value: `${govActive} / ${govTotal}` },
          { label: 'SOP Risiko Rendah (≥85)', value: rows.filter((r) => r.riskLevel === 'LOW').length },
          { label: 'SOP Risiko Sedang (70–84)', value: rows.filter((r) => r.riskLevel === 'MEDIUM').length },
          { label: 'SOP Risiko Tinggi (50–69)', value: rows.filter((r) => r.riskLevel === 'HIGH').length },
          { label: 'SOP Kritis (<50)', value: rows.filter((r) => r.riskLevel === 'CRITICAL').length },
        ],
      },
      {
        title: 'Daftar SOP Risiko Tinggi dan Kritis',
        description: 'SOP yang memerlukan tindakan segera.',
        type: 'risk_table',
        rows: riskRows.map((r) => ({
          sopCode: r.sopCode,
          moduleKey: r.moduleKey,
          score: r.score,
          riskLevel: r.riskLevel,
          reasons: buildReasons(r),
        })),
      },
      {
        title: 'Tabel Compliance Per SOP',
        description: 'Rincian skor compliance setiap SOP.',
        type: 'compliance_table',
        rows: rows.sort((a, b) => a.score - b.score).map((r) => ({
          sopCode: r.sopCode,
          moduleKey: r.moduleKey,
          score: r.score,
          riskLevel: r.riskLevel,
          checklistScore: r.checklistScore,
          approvalScore: r.approvalScore,
          evidenceScore: r.evidenceScore,
          governanceScore: r.governanceScore,
          timelinessScore: r.timelinessScore,
        })),
      },
    ];

    const signatures: PrintSignature[] = [
      {
        roleLabel: 'Kepala Bidang PPIK',
        namePlaceholder: '.................................',
        nipPlaceholder: 'NIP. ........................',
      },
      {
        roleLabel: 'Kepala Badan BKPSDM',
        namePlaceholder: '.................................',
        nipPlaceholder: 'NIP. ........................',
      },
    ];

    return {
      header: {
        organization: 'Badan Kepegawaian dan Pengembangan Sumber Daya Manusia',
        reportTitle: 'Laporan Kepatuhan SOP Bidang PPIK',
        period: periodLabel,
      },
      generatedAt: new Date().toISOString(),
      sections,
      signatures,
    };
  }
}
