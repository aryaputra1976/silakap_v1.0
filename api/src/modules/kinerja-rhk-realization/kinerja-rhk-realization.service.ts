import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import type { AuthUser } from '../auth/auth.types';
import type { KinerjaRhkCandidateRecord } from '../kinerja-rhk-candidate/kinerja-rhk-candidate.repository';
import { PrismaService } from '../prisma/prisma.service';
import type { ArchiveRealizationDto } from './dto/archive-realization.dto';
import type { CreateRealizationFromCandidateDto } from './dto/create-realization-from-candidate.dto';
import type { QueryRealizationDto } from './dto/query-realization.dto';
import type { ReportQueryDto } from './dto/report-query.dto';
import {
  KinerjaRhkRealizationRepository,
  type KinerjaRhkRealizationRecord,
} from './kinerja-rhk-realization.repository';

const VIEW_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
  'ANALIS_PERTAMA',
  'PENELAAH',
  'PPPK',
];

const REPORT_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
];

const APPROVE_ROLES = ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID'];

function primaryRole(user: AuthUser): string | null {
  return user.roles?.[0] ?? null;
}

function ensureRole(user: AuthUser, roles: string[], action: string) {
  const role = primaryRole(user);
  if (!role || !roles.includes(role)) {
    throw new ForbiddenException(`Tidak ada izin untuk ${action}`);
  }
}

function ensureView(user: AuthUser) {
  ensureRole(user, VIEW_ROLES, 'melihat realisasi RHK');
}

function ensureReport(user: AuthUser) {
  ensureRole(user, REPORT_ROLES, 'melihat laporan realisasi RHK');
}

function ensureApprove(user: AuthUser) {
  ensureRole(user, APPROVE_ROLES, 'mengesahkan realisasi RHK');
}

@Injectable()
export class KinerjaRhkRealizationService {
  constructor(
    @Inject(KinerjaRhkRealizationRepository)
    private readonly repo: KinerjaRhkRealizationRepository,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(AuditService)
    private readonly auditService: AuditService,
  ) {}

  async list(query: QueryRealizationDto, user: AuthUser) {
    ensureView(user);
    return this.repo.findMany(query);
  }

  async getSummary(query: QueryRealizationDto, user: AuthUser) {
    ensureReport(user);
    return this.repo.getSummary(query);
  }

  async getById(id: string, user: AuthUser) {
    ensureView(user);
    const realization = await this.repo.findById(id);
    if (!realization) {
      throw new NotFoundException('Realisasi RHK tidak ditemukan');
    }
    return realization;
  }

  async createFromCandidate(
    candidateId: string,
    dto: CreateRealizationFromCandidateDto,
    user: AuthUser,
  ) {
    ensureApprove(user);
    const candidate = await this.prisma.kinerjaRhkCandidate.findUnique({
      where: { id: candidateId },
      include: { auditLogs: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    if (!candidate) {
      throw new NotFoundException('Kandidat RHK tidak ditemukan');
    }

    if (candidate.status !== 'APPROVED') {
      throw new BadRequestException('Realisasi resmi hanya dapat dibuat dari kandidat yang sudah disetujui');
    }

    return this.createApprovedRealization(candidate, dto, user);
  }

  async createApprovedRealization(
    candidate: KinerjaRhkCandidateRecord,
    dto: CreateRealizationFromCandidateDto,
    user: AuthUser,
  ): Promise<KinerjaRhkRealizationRecord> {
    const existing = await this.repo.findByCandidateId(candidate.id);
    if (existing) {
      return existing;
    }

    const period = resolvePeriod(dto);
    const role = primaryRole(user);
    const created = await this.repo.create({
      candidateId: candidate.id,
      rhkCode: candidate.rhkCode ?? 'RHK-BELUM-DIPETAKAN',
      rhkTitle: candidate.rhkCode ? `Realisasi ${candidate.rhkCode}` : null,
      moduleKey: candidate.moduleKey,
      periodYear: period.periodYear,
      periodMonth: period.periodMonth,
      periodQuarter: period.periodQuarter,
      periodType: period.periodType,
      quantityValue: 1,
      qualityScore: toRoundedInt(candidate.qualityScore),
      timeScore: toRoundedInt(candidate.timeScore),
      evidenceScore: toRoundedInt(candidate.evidenceScore),
      complianceScore: toRoundedInt(candidate.qualityScore),
      finalScore: toRoundedInt(candidate.overallScore),
      sourceType: 'OPD_SUBMISSION',
      sourceId: candidate.opdSubmissionId,
      submissionNumber: candidate.opdSubmissionId,
      sopCode: candidate.sopCode,
      title: candidate.title,
      description: buildDescription(candidate),
      evidenceSnapshotJson: buildEvidenceSnapshot(candidate),
      approvedById: user.id,
      approvedAt: candidate.approvedAt ?? new Date(),
      createdById: user.id,
    });

    await this.repo.createAudit({
      realizationId: created.id,
      action: 'CREATED_FROM_CANDIDATE',
      actorId: user.id,
      actorRole: role,
      note: dto.note,
      afterJson: {
        candidateId: candidate.id,
        periodYear: period.periodYear,
        periodMonth: period.periodMonth,
        periodQuarter: period.periodQuarter,
        periodType: period.periodType,
        finalScore: created.finalScore,
      },
    });

    await this.auditService.record({
      entityType: 'kinerja_rhk_realization',
      entityId: created.id,
      action: 'CREATED_FROM_CANDIDATE',
      performedBy: user.id,
      afterData: {
        candidateId: candidate.id,
        rhkCode: created.rhkCode,
        periodYear: created.periodYear,
        periodMonth: created.periodMonth,
        periodQuarter: created.periodQuarter,
        periodType: created.periodType,
      },
    });

    return (await this.repo.findById(created.id)) ?? created;
  }

  async archive(id: string, dto: ArchiveRealizationDto, user: AuthUser) {
    ensureApprove(user);
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundException('Realisasi RHK tidak ditemukan');
    }
    if (existing.status === 'ARCHIVED') {
      throw new BadRequestException('Realisasi RHK sudah diarsipkan');
    }

    const role = primaryRole(user);
    const updated = await this.repo.archive(id);

    await this.repo.createAudit({
      realizationId: id,
      action: 'ARCHIVED',
      actorId: user.id,
      actorRole: role,
      note: dto.note,
      beforeJson: { status: existing.status },
      afterJson: { status: 'ARCHIVED' },
    });

    await this.auditService.record({
      entityType: 'kinerja_rhk_realization',
      entityId: id,
      action: 'ARCHIVED',
      performedBy: user.id,
      beforeData: { status: existing.status },
      afterData: { status: 'ARCHIVED' },
    });

    return updated;
  }

  async getMonthlyReport(query: ReportQueryDto, user: AuthUser) {
    ensureReport(user);
    const now = new Date();
    const periodYear = query.periodYear ?? now.getFullYear();
    const periodMonth = query.periodMonth ?? now.getMonth() + 1;
    const reportQuery = {
      ...query,
      periodYear,
      periodMonth,
      periodType: 'MONTHLY' as const,
      status: 'APPROVED' as const,
    };
    const [summary, achievements] = await Promise.all([
      this.repo.getSummary(reportQuery),
      this.repo.findForReport(reportQuery),
    ]);

    const lowScore = achievements.filter((item) => (item.finalScore ?? 0) < 70);

    return {
      periodLabel: `${periodMonthName(periodMonth)} ${periodYear}`,
      totalRhk: summary.byRhk.length,
      totalRealizations: summary.totalRealizations,
      totalQuantity: summary.totalQuantity,
      averageFinalScore: summary.averageFinalScore,
      achievements: achievements.map(toAchievement),
      issues: lowScore.map((item) => ({
        realizationId: item.id,
        title: item.title,
        note: `Skor akhir ${item.finalScore ?? 0}, perlu evaluasi kualitas bukti atau proses.`,
      })),
      evidenceSummary: {
        totalSnapshot: achievements.filter((item) => item.evidenceSnapshotJson != null).length,
        averageEvidenceScore: summary.averageEvidenceScore,
      },
      recommendedFollowUp:
        lowScore.length > 0
          ? ['Review kandidat dengan skor di bawah 70 sebelum laporan pimpinan ditetapkan.']
          : ['Pertahankan validasi kandidat berbasis evidence snapshot dan audit trail.'],
      narrativeSummary:
        summary.totalRealizations > 0
          ? `Pada ${periodMonthName(periodMonth)} ${periodYear}, tercatat ${summary.totalRealizations} realisasi resmi dengan rata-rata skor akhir ${summary.averageFinalScore}.`
          : `Belum ada realisasi RHK resmi pada ${periodMonthName(periodMonth)} ${periodYear}.`,
      generatedAt: new Date().toISOString(),
    };
  }

  async getQuarterlyReport(query: ReportQueryDto, user: AuthUser) {
    ensureReport(user);
    const now = new Date();
    const periodYear = query.periodYear ?? now.getFullYear();
    const periodQuarter = query.periodQuarter ?? Math.floor(now.getMonth() / 3) + 1;
    const reportQuery = {
      ...query,
      periodYear,
      periodQuarter,
      periodType: 'QUARTERLY' as const,
      status: 'APPROVED' as const,
    };
    const [summary, achievements] = await Promise.all([
      this.repo.getSummary(reportQuery),
      this.repo.findForReport(reportQuery),
    ]);

    return {
      quarterLabel: `Triwulan ${periodQuarter} ${periodYear}`,
      monthlyBreakdown: [1, 2, 3].map((offset) => {
        const month = (periodQuarter - 1) * 3 + offset;
        const monthItems = achievements.filter((item) => item.periodMonth === month);
        return {
          periodMonth: month,
          label: periodMonthName(month),
          totalRealizations: monthItems.length,
          averageFinalScore: averageScore(monthItems.map((item) => item.finalScore)),
        };
      }),
      strategicSummary:
        summary.totalRealizations > 0
          ? `Triwulan ini memiliki ${summary.totalRealizations} realisasi resmi pada ${summary.byRhk.length} kode RHK.`
          : 'Belum ada realisasi resmi pada triwulan ini.',
      trendNotes:
        summary.averageFinalScore >= 80
          ? 'Tren kinerja berada pada kategori baik berdasarkan rata-rata skor akhir.'
          : 'Tren perlu dimonitor karena rata-rata skor akhir belum optimal.',
      highRiskNotes:
        summary.averageEvidenceScore < 70
          ? 'Kelengkapan evidence perlu menjadi prioritas tindak lanjut.'
          : 'Tidak ada risiko evidence besar dari agregasi awal.',
      leadershipRecommendation:
        'Gunakan laporan ini sebagai bahan monitoring, bukan pengganti validasi manual atas dokumen strategis.',
      generatedAt: new Date().toISOString(),
    };
  }

  async getPrintSummary(query: ReportQueryDto, user: AuthUser) {
    ensureReport(user);
    const monthly = await this.getMonthlyReport(query, user);
    return {
      title: 'Ringkasan Laporan Kinerja RHK',
      periodLabel: monthly.periodLabel,
      totalRhk: monthly.totalRhk,
      totalRealizations: monthly.totalRealizations,
      averageFinalScore: monthly.averageFinalScore,
      narrativeSummary: monthly.narrativeSummary,
      achievements: monthly.achievements,
      issues: monthly.issues,
      recommendedFollowUp: monthly.recommendedFollowUp,
      generatedAt: monthly.generatedAt,
    };
  }
}

function resolvePeriod(dto: CreateRealizationFromCandidateDto) {
  const now = new Date();
  const periodType = dto.periodType ?? 'MONTHLY';
  const periodYear = dto.periodYear ?? now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (periodType === 'QUARTERLY') {
    return {
      periodType,
      periodYear,
      periodMonth: null,
      periodQuarter: dto.periodQuarter ?? monthToQuarter(dto.periodMonth ?? currentMonth),
    };
  }

  if (periodType === 'YEARLY') {
    return {
      periodType,
      periodYear,
      periodMonth: null,
      periodQuarter: null,
    };
  }

  return {
    periodType,
    periodYear,
    periodMonth: dto.periodMonth ?? currentMonth,
    periodQuarter: null,
  };
}

function toRoundedInt(value: number | null): number | null {
  return value == null ? null : Math.round(value);
}

function buildDescription(candidate: KinerjaRhkCandidateRecord): string {
  const parts = [
    `Realisasi dari kandidat layanan ${candidate.moduleKey}/${candidate.serviceType}.`,
    candidate.opdName ? `OPD: ${candidate.opdName}.` : null,
    candidate.subjectName ? `Subjek: ${candidate.subjectName}.` : null,
  ];

  return parts.filter((item): item is string => Boolean(item)).join(' ');
}

function buildEvidenceSnapshot(candidate: KinerjaRhkCandidateRecord): Prisma.InputJsonValue {
  return {
    candidateId: candidate.id,
    sourceType: 'OPD_SUBMISSION',
    sourceId: candidate.opdSubmissionId,
    submissionNumber: candidate.opdSubmissionId,
    sopCode: candidate.sopCode,
    evidenceStatus: candidate.evidenceScore != null && candidate.evidenceScore >= 80 ? 'ADEQUATE' : 'NEEDS_REVIEW',
    checklistStatus: candidate.qualityScore != null && candidate.qualityScore >= 80 ? 'ADEQUATE' : 'NEEDS_REVIEW',
    slaStatus: candidate.slaStatus,
    qualityScore: candidate.qualityScore,
    timeScore: candidate.timeScore,
    evidenceScore: candidate.evidenceScore,
    finalScore: candidate.overallScore,
    generatedAt: new Date().toISOString(),
  };
}

function toAchievement(item: KinerjaRhkRealizationRecord) {
  return {
    id: item.id,
    rhkCode: item.rhkCode,
    title: item.title,
    moduleKey: item.moduleKey,
    quantityValue: item.quantityValue ?? 0,
    finalScore: item.finalScore ?? 0,
    evidenceScore: item.evidenceScore ?? 0,
    sopCode: item.sopCode,
    sourceId: item.sourceId,
  };
}

function periodMonthName(month: number): string {
  return new Date(2026, month - 1, 1).toLocaleString('id-ID', { month: 'long' });
}

function averageScore(values: Array<number | null>): number {
  const present = values.filter((value): value is number => value != null);
  if (present.length === 0) return 0;
  return Math.round(present.reduce((total, value) => total + value, 0) / present.length);
}

function monthToQuarter(month: number): number {
  return Math.floor((month - 1) / 3) + 1;
}
