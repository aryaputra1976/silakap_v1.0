import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { RhkCandidateQueryDto } from './dto/rhk-candidate-query.dto';

const candidateInclude = {
  auditLogs: {
    orderBy: { createdAt: 'desc' as const },
    take: 20,
  },
} satisfies Prisma.KinerjaRhkCandidateInclude;

export type KinerjaRhkCandidateRecord = Prisma.KinerjaRhkCandidateGetPayload<{
  include: typeof candidateInclude;
}>;

export type GenerateCandidateInput = {
  opdSubmissionId: string;
  rhkCode: string | null;
  sopCode: string | null;
  moduleKey: string;
  serviceType: string;
  title: string;
  opdName: string | null;
  subjectName: string | null;
  subjectNip: string | null;
  qualityScore: number;
  timeScore: number;
  evidenceScore: number;
  overallScore: number;
  slaStatus: string | null;
  slaElapsedHours: number | null;
  completedAt: Date | null;
  createdById: string | null;
};

@Injectable()
export class KinerjaRhkCandidateRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async upsertFromSubmission(input: GenerateCandidateInput): Promise<KinerjaRhkCandidateRecord> {
    return this.prisma.kinerjaRhkCandidate.upsert({
      where: { opdSubmissionId: input.opdSubmissionId },
      update: {
        qualityScore: input.qualityScore,
        timeScore: input.timeScore,
        evidenceScore: input.evidenceScore,
        overallScore: input.overallScore,
        slaStatus: input.slaStatus,
        slaElapsedHours: input.slaElapsedHours,
        completedAt: input.completedAt,
      },
      create: {
        opdSubmissionId: input.opdSubmissionId,
        rhkCode: input.rhkCode,
        sopCode: input.sopCode,
        moduleKey: input.moduleKey,
        serviceType: input.serviceType,
        title: input.title,
        opdName: input.opdName,
        subjectName: input.subjectName,
        subjectNip: input.subjectNip,
        status: 'CANDIDATE',
        qualityScore: input.qualityScore,
        timeScore: input.timeScore,
        evidenceScore: input.evidenceScore,
        overallScore: input.overallScore,
        slaStatus: input.slaStatus,
        slaElapsedHours: input.slaElapsedHours,
        completedAt: input.completedAt,
        createdById: input.createdById,
      },
      include: candidateInclude,
    });
  }

  async findById(id: string): Promise<KinerjaRhkCandidateRecord | null> {
    return this.prisma.kinerjaRhkCandidate.findUnique({
      where: { id },
      include: candidateInclude,
    });
  }

  async findBySubmissionId(opdSubmissionId: string): Promise<KinerjaRhkCandidateRecord | null> {
    return this.prisma.kinerjaRhkCandidate.findUnique({
      where: { opdSubmissionId },
      include: candidateInclude,
    });
  }

  async findMany(query: RhkCandidateQueryDto) {
    const page = normalizeInt(query.page, 1, 1, 100_000);
    const limit = normalizeInt(query.limit, 20, 1, 100);
    const where = this.buildWhere(query);

    const [items, total] = await Promise.all([
      this.prisma.kinerjaRhkCandidate.findMany({
        where,
        include: candidateInclude,
        orderBy: [{ createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.kinerjaRhkCandidate.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async updateStatus(
    id: string,
    data: Prisma.KinerjaRhkCandidateUncheckedUpdateInput,
  ): Promise<KinerjaRhkCandidateRecord> {
    return this.prisma.kinerjaRhkCandidate.update({
      where: { id },
      data,
      include: candidateInclude,
    });
  }

  async createAudit(params: {
    candidateId: string;
    action: string;
    actorId?: string | null;
    actorRole?: string | null;
    note?: string | null;
    beforeJson?: Prisma.InputJsonValue;
    afterJson?: Prisma.InputJsonValue;
  }) {
    return this.prisma.kinerjaRhkCandidateAudit.create({
      data: {
        candidateId: params.candidateId,
        action: params.action,
        actorId: params.actorId ?? null,
        actorRole: params.actorRole ?? null,
        note: params.note ?? null,
        beforeJson: params.beforeJson,
        afterJson: params.afterJson,
      },
    });
  }

  async getSummary() {
    const [total, candidate, approved, rejected, archived] = await Promise.all([
      this.prisma.kinerjaRhkCandidate.count(),
      this.prisma.kinerjaRhkCandidate.count({ where: { status: 'CANDIDATE' } }),
      this.prisma.kinerjaRhkCandidate.count({ where: { status: 'APPROVED' } }),
      this.prisma.kinerjaRhkCandidate.count({ where: { status: 'REJECTED' } }),
      this.prisma.kinerjaRhkCandidate.count({ where: { status: 'ARCHIVED' } }),
    ]);

    return { total, candidate, approved, rejected, archived };
  }

  private buildWhere(query: RhkCandidateQueryDto): Prisma.KinerjaRhkCandidateWhereInput {
    const where: Prisma.KinerjaRhkCandidateWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.rhkCode) {
      where.rhkCode = query.rhkCode;
    }

    if (query.sopCode) {
      where.sopCode = query.sopCode;
    }

    if (query.moduleKey) {
      where.moduleKey = query.moduleKey;
    }

    if (query.from || query.to) {
      where.createdAt = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }

    if (query.q?.trim()) {
      const q = query.q.trim();
      where.OR = [
        { title: { contains: q } },
        { opdName: { contains: q } },
        { subjectName: { contains: q } },
        { subjectNip: { contains: q } },
        { opdSubmissionId: { contains: q } },
      ];
    }

    return where;
  }
}

function normalizeInt(
  value: number | string | null | undefined,
  fallback: number,
  min: number,
  max: number,
) {
  const parsed = typeof value === 'number' ? value : Number.parseInt(value ?? '', 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}
