import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const periodSelect = {
  id: true,
  year: true,
  semester: true,
  label: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.IkmSurveyPeriodSelect;

const surveySelect = {
  id: true,
  periodId: true,
  opdName: true,
  serviceType: true,
  submissionId: true,
  respondentId: true,
  u1: true,
  u2: true,
  u3: true,
  u4: true,
  u5: true,
  u6: true,
  u7: true,
  u8: true,
  u9: true,
  ikmScore: true,
  ikmConvert: true,
  predikat: true,
  comments: true,
  submittedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.IkmSurveySelect;

export type IkmPeriodRecord = Prisma.IkmSurveyPeriodGetPayload<{
  select: typeof periodSelect;
}>;

export type IkmSurveyRecord = Prisma.IkmSurveyGetPayload<{
  select: typeof surveySelect;
}>;

@Injectable()
export class IkmRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  findAllPeriods() {
    return this.prisma.ikmSurveyPeriod.findMany({
      select: periodSelect,
      orderBy: [{ year: 'desc' }, { semester: 'desc' }],
    });
  }

  findPeriodById(id: string) {
    return this.prisma.ikmSurveyPeriod.findUnique({
      where: { id },
      select: periodSelect,
    });
  }

  findPeriodByYearSemester(year: number, semester: number) {
    return this.prisma.ikmSurveyPeriod.findUnique({
      where: { year_semester: { year, semester } },
      select: periodSelect,
    });
  }

  createPeriod(data: { id: string; year: number; semester: number; label: string }) {
    return this.prisma.ikmSurveyPeriod.create({
      data: {
        id: data.id,
        year: data.year,
        semester: data.semester,
        label: data.label,
        status: 'OPEN',
        updatedAt: new Date(),
      },
      select: periodSelect,
    });
  }

  updatePeriodStatus(id: string, status: string) {
    return this.prisma.ikmSurveyPeriod.update({
      where: { id },
      data: { status, updatedAt: new Date() },
      select: periodSelect,
    });
  }

  createSurvey(data: {
    id: string;
    periodId: string;
    opdName: string;
    serviceType?: string | null;
    submissionId?: string | null;
    respondentId?: string | null;
    u1: number; u2: number; u3: number; u4: number; u5: number;
    u6: number; u7: number; u8: number; u9: number;
    ikmScore: number;
    ikmConvert: number;
    predikat: string;
    comments?: string | null;
  }) {
    return this.prisma.ikmSurvey.create({
      data: {
        id: data.id,
        periodId: data.periodId,
        opdName: data.opdName,
        serviceType: data.serviceType ?? null,
        submissionId: data.submissionId ?? null,
        respondentId: data.respondentId ?? null,
        u1: data.u1, u2: data.u2, u3: data.u3,
        u4: data.u4, u5: data.u5, u6: data.u6,
        u7: data.u7, u8: data.u8, u9: data.u9,
        ikmScore: data.ikmScore,
        ikmConvert: data.ikmConvert,
        predikat: data.predikat,
        comments: data.comments ?? null,
        updatedAt: new Date(),
      },
      select: surveySelect,
    });
  }

  findSurveys(params: {
    periodId?: string;
    opdName?: string;
    serviceType?: string;
  }) {
    const where: Prisma.IkmSurveyWhereInput = {};
    if (params.periodId) where.periodId = params.periodId;
    if (params.serviceType) where.serviceType = params.serviceType;
    if (params.opdName) {
      where.opdName = { contains: params.opdName };
    }
    return this.prisma.ikmSurvey.findMany({
      where,
      select: surveySelect,
      orderBy: { submittedAt: 'desc' },
      take: 1000,
    });
  }

  findSurveysByPeriod(periodId: string) {
    return this.prisma.ikmSurvey.findMany({
      where: { periodId },
      select: surveySelect,
    });
  }

  async getSummaryByPeriod(periodId: string) {
    const agg = await this.prisma.ikmSurvey.aggregate({
      where: { periodId },
      _avg: {
        u1: true, u2: true, u3: true, u4: true, u5: true,
        u6: true, u7: true, u8: true, u9: true,
        ikmScore: true, ikmConvert: true,
      },
      _count: { id: true },
    });

    const predikatGroups = await this.prisma.ikmSurvey.groupBy({
      by: ['predikat'],
      where: { periodId },
      _count: { id: true },
    });

    const byOpd = await this.prisma.ikmSurvey.groupBy({
      by: ['opdName'],
      where: { periodId },
      _avg: { ikmConvert: true },
      _count: { id: true },
      orderBy: { _avg: { ikmConvert: 'desc' } },
    });

    return { agg, predikatGroups, byOpd };
  }
}
