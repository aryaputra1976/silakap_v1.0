import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuthUser } from '../auth/auth.types';
import { CreateIkmPeriodDto, IkmSurveyQueryDto, SubmitIkmSurveyDto } from './dto/ikm.dto';
import { IkmPeriodRecord, IkmRepository, IkmSurveyRecord } from './ikm.repository';

const INTERNAL_ROLES = new Set([
  'SUPER_ADMIN', 'ADMIN_BKPSDM', 'KEPALA_BADAN', 'KABID',
  'ANALIS_MADYA', 'ANALIS_MUDA', 'ANALIS_PERTAMA', 'PENELAAH', 'PPPK',
]);

const MANAGE_ROLES = new Set(['SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID', 'ANALIS_MADYA', 'ANALIS_MUDA']);

function hasRole(user: AuthUser, set: Set<string>): boolean {
  return user.roles.some((r) => set.has(r));
}

function computeIkm(scores: number[]) {
  const ikmScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const ikmConvert = ikmScore * 25;
  let predikat: string;
  if (ikmConvert >= 88.31) predikat = 'A';
  else if (ikmConvert >= 76.61) predikat = 'B';
  else if (ikmConvert >= 65.00) predikat = 'C';
  else predikat = 'D';
  return { ikmScore, ikmConvert, predikat };
}

function toPeriodResponse(p: IkmPeriodRecord) {
  return {
    id: p.id,
    year: p.year,
    semester: p.semester,
    label: p.label,
    status: p.status,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

function toSurveyResponse(s: IkmSurveyRecord) {
  return {
    id: s.id,
    periodId: s.periodId,
    opdName: s.opdName,
    serviceType: s.serviceType,
    submissionId: s.submissionId,
    respondentId: s.respondentId,
    scores: { u1: s.u1, u2: s.u2, u3: s.u3, u4: s.u4, u5: s.u5, u6: s.u6, u7: s.u7, u8: s.u8, u9: s.u9 },
    ikmScore: s.ikmScore,
    ikmConvert: s.ikmConvert,
    predikat: s.predikat,
    comments: s.comments,
    submittedAt: s.submittedAt,
    createdAt: s.createdAt,
  };
}

@Injectable()
export class IkmService {
  constructor(
    @Inject(IkmRepository)
    private readonly repo: IkmRepository,
  ) {}

  private ensureInternal(user: AuthUser) {
    if (!hasRole(user, INTERNAL_ROLES)) throw new ForbiddenException('Akses ditolak');
  }

  private ensureManage(user: AuthUser) {
    if (!hasRole(user, MANAGE_ROLES))
      throw new ForbiddenException('Tidak memiliki izin mengelola periode IKM');
  }

  private async getPeriodOrThrow(id: string) {
    const p = await this.repo.findPeriodById(id);
    if (!p) throw new NotFoundException(`Periode IKM ${id} tidak ditemukan`);
    return p;
  }

  async findPeriods(user: AuthUser) {
    this.ensureInternal(user);
    const periods = await this.repo.findAllPeriods();
    return periods.map(toPeriodResponse);
  }

  async createPeriod(dto: CreateIkmPeriodDto, user: AuthUser) {
    this.ensureManage(user);
    const existing = await this.repo.findPeriodByYearSemester(dto.year, dto.semester);
    if (existing) {
      throw new BadRequestException(
        `Periode Semester ${dto.semester} Tahun ${dto.year} sudah ada`,
      );
    }
    const period = await this.repo.createPeriod({
      id: randomUUID(),
      year: dto.year,
      semester: dto.semester,
      label: dto.label,
    });
    return toPeriodResponse(period);
  }

  async closePeriod(id: string, user: AuthUser) {
    this.ensureManage(user);
    const period = await this.getPeriodOrThrow(id);
    if (period.status === 'CLOSED') {
      throw new BadRequestException('Periode sudah ditutup');
    }
    const updated = await this.repo.updatePeriodStatus(id, 'CLOSED');
    return toPeriodResponse(updated);
  }

  async reopenPeriod(id: string, user: AuthUser) {
    this.ensureManage(user);
    const period = await this.getPeriodOrThrow(id);
    if (period.status === 'OPEN') {
      throw new BadRequestException('Periode sudah terbuka');
    }
    const updated = await this.repo.updatePeriodStatus(id, 'OPEN');
    return toPeriodResponse(updated);
  }

  async submitSurvey(dto: SubmitIkmSurveyDto, user: AuthUser) {
    const period = await this.getPeriodOrThrow(dto.periodId);
    if (period.status !== 'OPEN') {
      throw new BadRequestException('Periode survei sudah ditutup, tidak dapat mengisi survei');
    }

    const scores = [dto.u1, dto.u2, dto.u3, dto.u4, dto.u5, dto.u6, dto.u7, dto.u8, dto.u9];
    const { ikmScore, ikmConvert, predikat } = computeIkm(scores);

    const survey = await this.repo.createSurvey({
      id: randomUUID(),
      periodId: dto.periodId,
      opdName: dto.opdName,
      serviceType: dto.serviceType,
      submissionId: dto.submissionId,
      respondentId: user.id,
      u1: dto.u1, u2: dto.u2, u3: dto.u3,
      u4: dto.u4, u5: dto.u5, u6: dto.u6,
      u7: dto.u7, u8: dto.u8, u9: dto.u9,
      ikmScore,
      ikmConvert,
      predikat,
      comments: dto.comments,
    });

    return toSurveyResponse(survey);
  }

  async findSurveys(query: IkmSurveyQueryDto, user: AuthUser) {
    this.ensureInternal(user);
    const surveys = await this.repo.findSurveys({
      periodId: query.periodId,
      opdName: query.opdName,
      serviceType: query.serviceType,
    });
    return surveys.map(toSurveyResponse);
  }

  async getTrend(user: AuthUser) {
    this.ensureInternal(user);
    const data = await this.repo.getTrendData();
    return data.map(({ period, avgIkmConvert, avgIkmScore, totalResponden }) => {
      const convert = avgIkmConvert ?? 0;
      let predikat = '-';
      if (totalResponden > 0) {
        if (convert >= 88.31) predikat = 'A';
        else if (convert >= 76.61) predikat = 'B';
        else if (convert >= 65.0) predikat = 'C';
        else predikat = 'D';
      }
      return {
        periodId: period.id,
        label: period.label,
        year: period.year,
        semester: period.semester,
        status: period.status,
        totalResponden,
        avgIkmConvert: Math.round(convert * 100) / 100,
        avgIkmScore: Math.round((avgIkmScore ?? 0) * 100) / 100,
        predikat,
      };
    });
  }

  async getSummary(periodId: string, user: AuthUser) {
    this.ensureInternal(user);
    await this.getPeriodOrThrow(periodId);
    const { agg, predikatGroups, byOpd } = await this.repo.getSummaryByPeriod(periodId);

    const totalResponden = agg._count.id;
    const avgConvert = agg._avg.ikmConvert ?? 0;

    let predikat = 'D';
    if (avgConvert >= 88.31) predikat = 'A';
    else if (avgConvert >= 76.61) predikat = 'B';
    else if (avgConvert >= 65.00) predikat = 'C';

    const predikatDist: Record<string, number> = Object.fromEntries(
      predikatGroups.map((g: { predikat: string | null; _count: { id: number } }) => [
        g.predikat ?? 'N/A',
        g._count.id,
      ]),
    );

    const avgPerUnsur: Record<string, number> = {};
    const unsurKeys = ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u9'] as const;
    for (const k of unsurKeys) {
      avgPerUnsur[k] = Math.round(((agg._avg[k] ?? 0) * 100)) / 100;
    }

    const byOpdList = byOpd.map((o: { opdName: string; _count: { id: number }; _avg: { ikmConvert: number | null } }) => ({
      opdName: o.opdName,
      respondenCount: o._count.id,
      avgIkmConvert: Math.round((o._avg.ikmConvert ?? 0) * 100) / 100,
    }));

    return {
      periodId,
      totalResponden,
      avgIkmScore: Math.round((agg._avg.ikmScore ?? 0) * 100) / 100,
      avgIkmConvert: Math.round(avgConvert * 100) / 100,
      predikat,
      avgPerUnsur,
      predikatDistribution: predikatDist,
      byOpd: byOpdList,
    };
  }
}
