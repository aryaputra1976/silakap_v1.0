import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { ExecutiveReportQueryDto } from './dto/executive-report-query.dto';

export type EvidenceBundleItem = {
  id: string;
  rhkCode: string;
  title: string;
  moduleKey: string;
  periodYear: number;
  periodMonth: number | null;
  periodQuarter: number | null;
  periodType: string;
  sopCode: string | null;
  evidenceSnapshotJson: Prisma.JsonValue | null;
  finalScore: number | null;
  approvedAt: Date | null;
};

@Injectable()
export class KinerjaExecutiveReportRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getEvidenceBundle(query: ExecutiveReportQueryDto): Promise<EvidenceBundleItem[]> {
    const periodYear = normalizeOptionalInt(query.periodYear, 2000, 2100);
    const periodMonth = normalizeOptionalInt(query.periodMonth, 1, 12);
    const periodQuarter = normalizeOptionalInt(query.periodQuarter, 1, 4);

    return this.prisma.kinerjaRhkRealization.findMany({
      where: {
        status: 'APPROVED',
        rhkCode: query.rhkCode || undefined,
        moduleKey: query.moduleKey || undefined,
        periodYear,
        periodMonth,
        periodQuarter,
        periodType: query.periodType || undefined,
      },
      select: {
        id: true,
        rhkCode: true,
        title: true,
        moduleKey: true,
        periodYear: true,
        periodMonth: true,
        periodQuarter: true,
        periodType: true,
        sopCode: true,
        evidenceSnapshotJson: true,
        finalScore: true,
        approvedAt: true,
      },
      orderBy: [{ rhkCode: 'asc' }, { periodYear: 'desc' }],
    });
  }
}

function normalizeOptionalInt(
  value: number | string | null | undefined,
  min: number,
  max: number,
) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = typeof value === 'number' ? value : Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    return undefined;
  }

  return parsed;
}
