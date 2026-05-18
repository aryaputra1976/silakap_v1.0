import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { QueryRealizationDto } from './dto/query-realization.dto';

const realizationInclude = {
  auditLogs: {
    orderBy: { createdAt: 'desc' as const },
    take: 30,
  },
} satisfies Prisma.KinerjaRhkRealizationInclude;

export type KinerjaRhkRealizationRecord = Prisma.KinerjaRhkRealizationGetPayload<{
  include: typeof realizationInclude;
}>;

export type CreateRealizationInput = {
  candidateId: string;
  rhkCode: string;
  rhkTitle?: string | null;
  moduleKey: string;
  periodYear: number;
  periodMonth?: number | null;
  periodQuarter?: number | null;
  periodType: string;
  quantityValue?: number | null;
  qualityScore?: number | null;
  timeScore?: number | null;
  evidenceScore?: number | null;
  complianceScore?: number | null;
  finalScore?: number | null;
  sourceType?: string | null;
  sourceId?: string | null;
  submissionNumber?: string | null;
  sopCode?: string | null;
  title: string;
  description?: string | null;
  evidenceSnapshotJson?: Prisma.InputJsonValue | null;
  approvedById?: string | null;
  approvedAt?: Date | null;
  createdById?: string | null;
};

@Injectable()
export class KinerjaRhkRealizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(query: QueryRealizationDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.buildWhere(query);

    const [items, total] = await Promise.all([
      this.prisma.kinerjaRhkRealization.findMany({
        where,
        include: realizationInclude,
        orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.kinerjaRhkRealization.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findById(id: string): Promise<KinerjaRhkRealizationRecord | null> {
    return this.prisma.kinerjaRhkRealization.findUnique({
      where: { id },
      include: realizationInclude,
    });
  }

  async findByCandidateId(candidateId: string): Promise<KinerjaRhkRealizationRecord | null> {
    return this.prisma.kinerjaRhkRealization.findUnique({
      where: { candidateId },
      include: realizationInclude,
    });
  }

  async create(input: CreateRealizationInput): Promise<KinerjaRhkRealizationRecord> {
    return this.prisma.kinerjaRhkRealization.create({
      data: {
        candidateId: input.candidateId,
        rhkCode: input.rhkCode,
        rhkTitle: input.rhkTitle ?? null,
        moduleKey: input.moduleKey,
        periodYear: input.periodYear,
        periodMonth: input.periodMonth ?? null,
        periodQuarter: input.periodQuarter ?? null,
        periodType: input.periodType,
        quantityValue: input.quantityValue ?? null,
        qualityScore: input.qualityScore ?? null,
        timeScore: input.timeScore ?? null,
        evidenceScore: input.evidenceScore ?? null,
        complianceScore: input.complianceScore ?? null,
        finalScore: input.finalScore ?? null,
        status: 'APPROVED',
        sourceType: input.sourceType ?? null,
        sourceId: input.sourceId ?? null,
        submissionNumber: input.submissionNumber ?? null,
        sopCode: input.sopCode ?? null,
        title: input.title,
        description: input.description ?? null,
        evidenceSnapshotJson: input.evidenceSnapshotJson ?? undefined,
        approvedById: input.approvedById ?? null,
        approvedAt: input.approvedAt ?? null,
        createdById: input.createdById ?? null,
      },
      include: realizationInclude,
    });
  }

  async archive(id: string): Promise<KinerjaRhkRealizationRecord> {
    return this.prisma.kinerjaRhkRealization.update({
      where: { id },
      data: { status: 'ARCHIVED' },
      include: realizationInclude,
    });
  }

  async createAudit(params: {
    realizationId: string;
    action: string;
    actorId?: string | null;
    actorRole?: string | null;
    note?: string | null;
    beforeJson?: Prisma.InputJsonValue | null;
    afterJson?: Prisma.InputJsonValue | null;
  }) {
    return this.prisma.kinerjaRhkRealizationAudit.create({
      data: {
        realizationId: params.realizationId,
        action: params.action,
        actorId: params.actorId ?? null,
        actorRole: params.actorRole ?? null,
        note: params.note ?? null,
        beforeJson: params.beforeJson ?? undefined,
        afterJson: params.afterJson ?? undefined,
      },
    });
  }

  async getSummary(query: QueryRealizationDto) {
    const where = this.buildWhere({ ...query, status: query.status ?? 'APPROVED' });
    const [totalRealizations, totalQuantity, averages, byRhk, byModule, byPeriod] =
      await Promise.all([
        this.prisma.kinerjaRhkRealization.count({ where }),
        this.prisma.kinerjaRhkRealization.aggregate({
          where,
          _sum: { quantityValue: true },
        }),
        this.prisma.kinerjaRhkRealization.aggregate({
          where,
          _avg: {
            qualityScore: true,
            timeScore: true,
            evidenceScore: true,
            finalScore: true,
          },
        }),
        this.prisma.kinerjaRhkRealization.groupBy({
          by: ['rhkCode'],
          where,
          _count: { _all: true },
          _sum: { quantityValue: true },
          _avg: { finalScore: true },
          orderBy: { rhkCode: 'asc' },
        }),
        this.prisma.kinerjaRhkRealization.groupBy({
          by: ['moduleKey'],
          where,
          _count: { _all: true },
          _sum: { quantityValue: true },
          _avg: { finalScore: true },
          orderBy: { moduleKey: 'asc' },
        }),
        this.prisma.kinerjaRhkRealization.groupBy({
          by: ['periodYear', 'periodMonth', 'periodQuarter', 'periodType'],
          where,
          _count: { _all: true },
          _avg: { finalScore: true },
          orderBy: [{ periodYear: 'asc' }, { periodMonth: 'asc' }],
        }),
      ]);

    return {
      totalRealizations,
      totalQuantity: totalQuantity._sum.quantityValue ?? 0,
      averageQuality: roundAverage(averages._avg.qualityScore),
      averageTimeScore: roundAverage(averages._avg.timeScore),
      averageEvidenceScore: roundAverage(averages._avg.evidenceScore),
      averageFinalScore: roundAverage(averages._avg.finalScore),
      byRhk: byRhk.map((item) => ({
        rhkCode: item.rhkCode,
        total: item._count._all,
        totalQuantity: item._sum.quantityValue ?? 0,
        averageFinalScore: roundAverage(item._avg.finalScore),
      })),
      byModule: byModule.map((item) => ({
        moduleKey: item.moduleKey,
        total: item._count._all,
        totalQuantity: item._sum.quantityValue ?? 0,
        averageFinalScore: roundAverage(item._avg.finalScore),
      })),
      byPeriod: byPeriod.map((item) => ({
        periodYear: item.periodYear,
        periodMonth: item.periodMonth,
        periodQuarter: item.periodQuarter,
        periodType: item.periodType,
        total: item._count._all,
        averageFinalScore: roundAverage(item._avg.finalScore),
      })),
      topIssues: [],
    };
  }

  async findForReport(query: QueryRealizationDto) {
    return this.prisma.kinerjaRhkRealization.findMany({
      where: this.buildWhere({ ...query, status: 'APPROVED' }),
      include: realizationInclude,
      orderBy: [{ rhkCode: 'asc' }, { createdAt: 'asc' }],
    });
  }

  private buildWhere(query: QueryRealizationDto): Prisma.KinerjaRhkRealizationWhereInput {
    const where: Prisma.KinerjaRhkRealizationWhereInput = {};

    if (query.rhkCode) where.rhkCode = query.rhkCode;
    if (query.moduleKey) where.moduleKey = query.moduleKey;
    if (query.periodYear) where.periodYear = query.periodYear;
    if (query.periodMonth) where.periodMonth = query.periodMonth;
    if (query.periodQuarter) where.periodQuarter = query.periodQuarter;
    if (query.periodType) where.periodType = query.periodType;
    if (query.status) where.status = query.status;

    return where;
  }
}

function roundAverage(value: number | null): number {
  return value == null ? 0 : Math.round(value);
}
