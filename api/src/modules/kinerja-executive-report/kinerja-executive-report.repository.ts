import { Injectable } from '@nestjs/common';
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
  constructor(private readonly prisma: PrismaService) {}

  async getEvidenceBundle(query: ExecutiveReportQueryDto): Promise<EvidenceBundleItem[]> {
    return this.prisma.kinerjaRhkRealization.findMany({
      where: {
        status: 'APPROVED',
        rhkCode: query.rhkCode || undefined,
        moduleKey: query.moduleKey || undefined,
        periodYear: query.periodYear || undefined,
        periodMonth: query.periodMonth || undefined,
        periodQuarter: query.periodQuarter || undefined,
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
