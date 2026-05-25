import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SopRealizationStatus } from '@prisma/client';
import { AuthUser } from '../auth/auth.types';
import { KINERJA_BIDANG_SEED_SOP } from './constants/kinerja-bidang-seed.constant';
import { CreateSopRealizationDto } from './dto/create-sop-realization.dto';
import {
  KinerjaBidangReportQueryDto,
  KinerjaBidangSopQueryDto,
  KinerjaBidangTargetQueryDto,
} from './dto/kinerja-bidang-query.dto';
import { AddSopEvidenceDto, RealizationReviewDto, UpdateSopRealizationDto } from './dto/update-sop-realization.dto';
import { KinerjaBidangRealizationRecord, KinerjaBidangRepository } from './kinerja-bidang.repository';
import { KinerjaBidangDashboardSummary, KinerjaBidangRhkReportRow } from './kinerja-bidang.types';

@Injectable()
export class KinerjaBidangService {
  constructor(
    @Inject(KinerjaBidangRepository)
    private readonly repository: KinerjaBidangRepository,
  ) {}

  async seedDefault(user?: AuthUser) {
    const year = new Date().getFullYear();

    await this.repository.seedDefaultSop(KINERJA_BIDANG_SEED_SOP, year, user?.id);

    return {
      seeded: true,
      year,
      total: KINERJA_BIDANG_SEED_SOP.length,
    };
  }

  async listSop(query: KinerjaBidangSopQueryDto) {
    const pagination = normalizePagination(query.page, query.limit);

    return this.repository.findSops({
      q: query.q,
      stage: query.stage,
      status: query.status,
      rhkCode: query.rhkCode,
      isRhkPrimary: normalizeBoolean(query.isRhkPrimary),
      page: pagination.page,
      limit: pagination.limit,
    });
  }

  async getSop(idOrCode: string) {
    const result = idOrCode.startsWith('SOP-')
      ? await this.repository.findSopByCode(idOrCode)
      : await this.repository.findSopById(idOrCode);

    if (!result) {
      throw new NotFoundException('SOP tidak ditemukan');
    }

    return result;
  }

  async getDashboard(query: KinerjaBidangReportQueryDto): Promise<KinerjaBidangDashboardSummary> {
    const year = normalizeYear(query.year);
    const rows = await this.buildReportRows(year);
    const totalTarget = rows.reduce((total, row) => total + row.targetQuantity, 0);
    const totalRealization = rows.reduce((total, row) => total + row.realizationQuantity, 0);
    const totalApprovedRealization = rows.reduce(
      (total, row) => total + row.approvedRealizationQuantity,
      0,
    );
    const totalEvidence = rows.reduce((total, row) => total + row.evidenceCount, 0);
    const allSop = await this.repository.findSops({});

    return {
      totalSop: allSop.length,
      totalRhkPrimary: rows.length,
      totalTarget,
      totalRealization,
      totalApprovedRealization,
      totalEvidence,
      averageProgressPercent:
        rows.length === 0
          ? 0
          : Math.round(rows.reduce((total, row) => total + row.progressPercent, 0) / rows.length),
      needAttention: rows.filter(
        (row) => row.status === 'PERLU_PERHATIAN' || row.status === 'BELUM_ADA_BUKTI',
      ).length,
    };
  }

  async getReport(query: KinerjaBidangReportQueryDto) {
    const year = normalizeYear(query.year);
    const rows = await this.buildReportRows(year);
    const summary = await this.getDashboard(query);
    const realizations = await this.repository.findRealizations({
      year,
      month: normalizeOptionalNumber(query.month),
      quarter: normalizeOptionalNumber(query.quarter),
      status: query.status,
    });

    return {
      year,
      summary,
      rows,
      realizations,
      narrative: {
        title: `Laporan Kinerja Bidang PPIK Tahun ${year}`,
        opening:
          'Laporan ini disusun sebagai bentuk pengendalian pelaksanaan SOP, RHK, realisasi kegiatan, dan bukti dukung Bidang PPIK.',
        achievement: `Terdapat ${summary.totalRhkPrimary} RHK utama dengan total target ${summary.totalTarget} output. Realisasi tercatat ${summary.totalRealization} output dengan capaian rata-rata ${summary.averageProgressPercent}%.`,
        constraint:
          summary.needAttention > 0
            ? `Masih terdapat ${summary.needAttention} RHK yang memerlukan perhatian dan tindak lanjut.`
            : 'Secara umum capaian berada dalam kondisi terkendali.',
        followUp:
          'Tindak lanjut dilakukan melalui pemutakhiran realisasi, pelengkapan bukti dukung, dan review berkala oleh Kabid.',
      },
    };
  }

  async listTargets(query: KinerjaBidangTargetQueryDto) {
    return this.repository.findTargetsForInput({
      year: normalizeYear(query.year),
      rhkCode: query.rhkCode,
      isRhkPrimary: normalizeBoolean(query.isRhkPrimary),
    });
  }

  async listRealizations(query: KinerjaBidangReportQueryDto) {
    return this.repository.findRealizations({
      year: normalizeYear(query.year),
      month: normalizeOptionalNumber(query.month),
      quarter: normalizeOptionalNumber(query.quarter),
      status: query.status,
    });
  }

  async getRealization(id: string) {
    const result = await this.repository.findRealizationById(id);

    if (!result) {
      throw new NotFoundException('Realisasi SOP/RHK tidak ditemukan');
    }

    return result;
  }

  async createRealization(dto: CreateSopRealizationDto, user: AuthUser) {
    validatePeriod(dto.month, dto.quarter);

    const target = await this.repository.findTargetById(dto.targetId);

    if (!target) {
      throw new NotFoundException('Target SOP/RHK tidak ditemukan');
    }

    await this.validateEvidence(dto.evidence ?? []);

    const created = await this.repository.createRealization({
      targetId: target.id,
      sopId: target.sopId,
      rhkCode: target.rhkCode,
      year: target.year,
      month: dto.month,
      quarter: dto.quarter,
      realizationQuantity: dto.realizationQuantity,
      qualityPercent: dto.qualityPercent,
      timeStatus: dto.timeStatus,
      status: SopRealizationStatus.DRAFT,
      title: dto.title,
      description: dto.description,
      constraint: dto.constraint,
      followUp: dto.followUp,
      createdBy: user.id,
      updatedBy: user.id,
    });

    if (dto.evidence?.length) {
      await this.repository.replaceEvidence(
        created.id,
        dto.evidence.map((item, index) => ({
          dmsDocumentId: item.dmsDocumentId,
          label: item.label,
          description: item.description,
          isPrimary: item.isPrimary ?? index === 0,
          createdBy: user.id,
        })),
      );
    }

    return this.getRealization(created.id);
  }

  async updateRealization(id: string, dto: UpdateSopRealizationDto, user: AuthUser) {
    const current = await this.getRealization(id);

    assertEditable(current, 'Realisasi yang sudah approved tidak dapat diedit.');

    await this.validateEvidence(dto.evidence ?? []);

    const updated = await this.repository.updateRealization(id, {
      realizationQuantity: dto.realizationQuantity,
      qualityPercent: dto.qualityPercent,
      timeStatus: dto.timeStatus,
      title: dto.title,
      description: dto.description,
      constraint: dto.constraint,
      followUp: dto.followUp,
      reviewNote: dto.reviewNote,
      updatedBy: user.id,
    });

    if (dto.evidence) {
      await this.repository.replaceEvidence(
        updated.id,
        dto.evidence.map((item, index) => ({
          dmsDocumentId: item.dmsDocumentId,
          label: item.label,
          description: item.description,
          isPrimary: item.isPrimary ?? index === 0,
          createdBy: user.id,
        })),
      );
    }

    return this.getRealization(updated.id);
  }

  async submitRealization(id: string, user: AuthUser) {
    const current = await this.getRealization(id);

    if (
      current.status !== SopRealizationStatus.DRAFT &&
      current.status !== SopRealizationStatus.REVISION_REQUIRED
    ) {
      throw new BadRequestException('Hanya realisasi draft atau revisi yang dapat disubmit.');
    }

    if (current.realizationQuantity <= 0) {
      throw new BadRequestException(
        'Realisasi belum dapat disubmit karena kuantitas realisasi masih 0.',
      );
    }

    return this.repository.updateRealization(id, {
      status: SopRealizationStatus.SUBMITTED,
      submittedAt: new Date(),
      updatedBy: user.id,
    });
  }

  async reviewRealization(id: string, dto: RealizationReviewDto, user: AuthUser) {
    const current = await this.getRealization(id);

    if (current.status !== SopRealizationStatus.SUBMITTED) {
      throw new BadRequestException('Hanya realisasi berstatus submitted yang dapat direview.');
    }

    return this.repository.updateRealization(id, {
      status: SopRealizationStatus.REVIEWED,
      reviewedAt: new Date(),
      reviewNote: dto.reviewNote,
      updatedBy: user.id,
    });
  }

  async approveRealization(id: string, dto: RealizationReviewDto, user: AuthUser) {
    const current = await this.getRealization(id);

    if (
      current.status !== SopRealizationStatus.SUBMITTED &&
      current.status !== SopRealizationStatus.REVIEWED
    ) {
      throw new BadRequestException(
        'Hanya realisasi submitted/reviewed yang dapat disetujui.',
      );
    }

    if (current.evidence.length === 0) {
      throw new BadRequestException(
        'Realisasi belum dapat disetujui karena belum memiliki bukti dukung DMS.',
      );
    }

    if (current.realizationQuantity <= 0) {
      throw new BadRequestException(
        'Realisasi belum dapat disetujui karena kuantitas realisasi masih 0.',
      );
    }

    return this.repository.updateRealization(id, {
      status: SopRealizationStatus.APPROVED,
      reviewedAt: current.reviewedAt ?? new Date(),
      approvedAt: new Date(),
      reviewNote: dto.reviewNote ?? current.reviewNote,
      updatedBy: user.id,
    });
  }

  async requestRevision(id: string, dto: RealizationReviewDto, user: AuthUser) {
    const current = await this.getRealization(id);

    if (
      current.status !== SopRealizationStatus.SUBMITTED &&
      current.status !== SopRealizationStatus.REVIEWED
    ) {
      throw new BadRequestException('Hanya realisasi submitted/reviewed yang dapat diminta revisi.');
    }

    return this.repository.updateRealization(id, {
      status: SopRealizationStatus.REVISION_REQUIRED,
      reviewedAt: new Date(),
      reviewNote: dto.reviewNote,
      updatedBy: user.id,
    });
  }

  async addEvidence(id: string, dto: AddSopEvidenceDto, user: AuthUser) {
    const current = await this.getRealization(id);

    assertEditable(
      current,
      'Bukti dukung tidak dapat ditambahkan pada realisasi yang sudah approved.',
    );

    await this.validateEvidence([dto]);

    await this.repository.addEvidence(id, {
      dmsDocumentId: dto.dmsDocumentId,
      label: dto.label,
      description: dto.description,
      isPrimary: dto.isPrimary,
      createdBy: user.id,
    });

    return this.getRealization(id);
  }

  async removeEvidence(id: string, evidenceId: string) {
    const current = await this.getRealization(id);

    assertEditable(
      current,
      'Bukti dukung tidak dapat dihapus dari realisasi yang sudah approved.',
    );

    const belongs = await this.repository.evidenceBelongsToRealization(evidenceId, id);

    if (!belongs) {
      throw new NotFoundException('Bukti dukung realisasi tidak ditemukan');
    }

    await this.repository.removeEvidence(evidenceId);

    return this.getRealization(id);
  }

  private async validateEvidence(evidence: Array<{ dmsDocumentId: string }>) {
    for (const item of evidence) {
      const exists = await this.repository.dmsDocumentExists(item.dmsDocumentId);

      if (!exists) {
        throw new BadRequestException(`Dokumen DMS tidak ditemukan: ${item.dmsDocumentId}`);
      }
    }
  }

  private async buildReportRows(year: number): Promise<KinerjaBidangRhkReportRow[]> {
    const targets = await this.repository.findTargets(year);

    return targets.map((target) => {
      const approvedRealizations = target.realizations.filter(
        (item) => item.status === SopRealizationStatus.APPROVED,
      );
      const realizationQuantity = target.realizations.reduce(
        (total, item) => total + item.realizationQuantity,
        0,
      );

      const approvedRealizationQuantity = approvedRealizations.reduce(
        (total, item) => total + item.realizationQuantity,
        0,
      );

      const evidenceCount = approvedRealizations.reduce(
        (total, item) => total + item.evidence.length,
        0,
      );

      const progressPercent =
        target.targetQuantity <= 0
          ? 0
          : Math.min(100, Math.round((approvedRealizationQuantity / target.targetQuantity) * 100));

      return {
        targetId: target.id,
        sopId: target.sopId,
        sopCode: target.sop.code,
        sopTitle: target.sop.title,
        rhkCode: target.rhkCode,
        year: target.year,
        targetQuantity: target.targetQuantity,
        targetUnit: target.targetUnit,
        realizationQuantity,
        approvedRealizationQuantity,
        evidenceCount,
        progressPercent,
        status: getRhkStatus(progressPercent, evidenceCount),
      };
    });
  }
}

function normalizeBoolean(value?: string): boolean | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }

  return value === 'true' || value === '1';
}

function normalizeYear(value?: string): number {
  const parsed = Number(value ?? new Date().getFullYear());
  return Number.isFinite(parsed) ? parsed : new Date().getFullYear();
}

function normalizeOptionalNumber(value?: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizePagination(page?: string, limit?: string): { page?: number; limit?: number } {
  const parsedLimit = Number(limit);
  const parsedPage = Number(page);

  if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
    return {};
  }

  return {
    page: Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1,
    limit: Math.min(100, Math.floor(parsedLimit)),
  };
}

function validatePeriod(month?: number, quarter?: number) {
  if (month && quarter) {
    throw new BadRequestException('Pilih salah satu periode saja: bulan atau triwulan.');
  }
}

function assertEditable(realization: KinerjaBidangRealizationRecord, message: string) {
  if (realization.status === SopRealizationStatus.APPROVED) {
    throw new BadRequestException(message);
  }
}

function getRhkStatus(
  progressPercent: number,
  evidenceCount: number,
): KinerjaBidangRhkReportRow['status'] {
  if (progressPercent >= 100) {
    return 'TERLAMPAUI';
  }

  if (progressPercent >= 80 && evidenceCount > 0) {
    return 'AMAN';
  }

  if (evidenceCount === 0) {
    return 'BELUM_ADA_BUKTI';
  }

  return 'PERLU_PERHATIAN';
}
