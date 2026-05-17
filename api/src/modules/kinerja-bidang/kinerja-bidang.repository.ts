import { Inject, Injectable } from '@nestjs/common';
import {
  Prisma,
  SopRealizationStatus,
  SopStage,
  SopStatus,
  SopTargetUnit,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const sopInclude = {
  rhkMappings: {
    orderBy: { sortOrder: 'asc' },
  },
  steps: {
    orderBy: { stepNumber: 'asc' },
  },
} satisfies Prisma.KinerjaBidangSopInclude;

const realizationInclude = {
  sop: true,
  target: true,
  evidence: {
    include: {
      dmsDocument: {
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          status: true,
          fileName: true,
          originalFileName: true,
          periodYear: true,
          periodMonth: true,
          periodQuarter: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
  },
} satisfies Prisma.KinerjaBidangSopRealizationInclude;

export type KinerjaBidangSopRecord = Prisma.KinerjaBidangSopGetPayload<{
  include: typeof sopInclude;
}>;

export type KinerjaBidangRealizationRecord = Prisma.KinerjaBidangSopRealizationGetPayload<{
  include: typeof realizationInclude;
}>;

export interface SopFilters {
  q?: string;
  stage?: SopStage;
  status?: SopStatus;
  isRhkPrimary?: boolean;
  rhkCode?: string;
  page?: number;
  limit?: number;
}

export interface TargetFilters {
  year: number;
  rhkCode?: string;
  isRhkPrimary?: boolean;
}

export interface ReportFilters {
  year: number;
  month?: number;
  quarter?: number;
  status?: SopRealizationStatus;
}

export interface SeedSopInput {
  code: string;
  title: string;
  stage: SopStage;
  stageTitle: string;
  shortDescription: string;
  rhkCodes: string[];
  targetQuantity: number;
  targetUnit: SopTargetUnit;
  qualityTarget: string;
  timeTarget: string;
  isRhkPrimary: boolean;
  sortOrder: number;
}

export interface EvidenceInput {
  dmsDocumentId: string;
  label?: string;
  description?: string;
  isPrimary?: boolean;
  createdBy?: string;
}

@Injectable()
export class KinerjaBidangRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async seedDefaultSop(items: SeedSopInput[], year: number, userId?: string) {
    for (const item of items) {
      const sop = await this.prisma.kinerjaBidangSop.upsert({
        where: { code: item.code },
        update: {
          title: item.title,
          stage: item.stage,
          stageTitle: item.stageTitle,
          shortDescription: item.shortDescription,
          status: 'ACTIVE',
          isRhkPrimary: item.isRhkPrimary,
          sortOrder: item.sortOrder,
          targetQuantity: item.targetQuantity,
          targetUnit: item.targetUnit,
          qualityTarget: item.qualityTarget,
          timeTarget: item.timeTarget,
          updatedBy: userId,
          deletedAt: null,
        },
        create: {
          code: item.code,
          title: item.title,
          stage: item.stage,
          stageTitle: item.stageTitle,
          shortDescription: item.shortDescription,
          status: 'ACTIVE',
          isRhkPrimary: item.isRhkPrimary,
          sortOrder: item.sortOrder,
          targetQuantity: item.targetQuantity,
          targetUnit: item.targetUnit,
          qualityTarget: item.qualityTarget,
          timeTarget: item.timeTarget,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      await this.prisma.kinerjaBidangSopRhk.deleteMany({
        where: { sopId: sop.id },
      });

      if (item.rhkCodes.length > 0) {
        await this.prisma.kinerjaBidangSopRhk.createMany({
          data: item.rhkCodes.map((rhkCode, index) => ({
            sopId: sop.id,
            rhkCode,
            sortOrder: index + 1,
          })),
        });
      }

      if (item.isRhkPrimary && item.rhkCodes[0]) {
        await this.prisma.kinerjaBidangSopTarget.upsert({
          where: {
            sopId_rhkCode_year: {
              sopId: sop.id,
              rhkCode: item.rhkCodes[0],
              year,
            },
          },
          update: {
            targetQuantity: item.targetQuantity,
            targetUnit: item.targetUnit,
            qualityTarget: item.qualityTarget,
            timeTarget: item.timeTarget,
            updatedBy: userId,
            deletedAt: null,
          },
          create: {
            sopId: sop.id,
            rhkCode: item.rhkCodes[0],
            year,
            targetQuantity: item.targetQuantity,
            targetUnit: item.targetUnit,
            qualityTarget: item.qualityTarget,
            timeTarget: item.timeTarget,
            createdBy: userId,
            updatedBy: userId,
          },
        });
      } else {
        await this.prisma.kinerjaBidangSopTarget.updateMany({
          where: {
            sopId: sop.id,
            deletedAt: null,
          },
          data: {
            deletedAt: new Date(),
            updatedBy: userId,
          },
        });
      }
    }
  }

  async findSops(filters: SopFilters): Promise<KinerjaBidangSopRecord[]> {
    return this.prisma.kinerjaBidangSop.findMany({
      where: this.buildSopWhere(filters),
      include: sopInclude,
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
      skip: filters.page && filters.limit ? (filters.page - 1) * filters.limit : undefined,
      take: filters.limit,
    });
  }

  async findSopById(id: string): Promise<KinerjaBidangSopRecord | null> {
    return this.prisma.kinerjaBidangSop.findFirst({
      where: { id, deletedAt: null },
      include: sopInclude,
    });
  }

  async findSopByCode(code: string): Promise<KinerjaBidangSopRecord | null> {
    return this.prisma.kinerjaBidangSop.findFirst({
      where: { code, deletedAt: null },
      include: sopInclude,
    });
  }

  async findTargetsForInput(filters: TargetFilters) {
    return this.prisma.kinerjaBidangSopTarget.findMany({
      where: {
        year: filters.year,
        deletedAt: null,
        rhkCode: filters.rhkCode,
        sop: {
          deletedAt: null,
          status: 'ACTIVE',
          isRhkPrimary: filters.isRhkPrimary,
        },
      },
      include: {
        sop: {
          include: {
            rhkMappings: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
      orderBy: [{ sop: { sortOrder: 'asc' } }, { rhkCode: 'asc' }],
    });
  }

  async findTargets(year: number) {
    return this.prisma.kinerjaBidangSopTarget.findMany({
      where: {
        year,
        deletedAt: null,
        sop: {
          deletedAt: null,
          status: 'ACTIVE',
          isRhkPrimary: true,
        },
      },
      include: {
        sop: true,
        realizations: {
          where: { deletedAt: null },
          include: {
            evidence: true,
          },
        },
      },
      orderBy: [{ sop: { sortOrder: 'asc' } }, { rhkCode: 'asc' }],
    });
  }

  async findTargetById(id: string) {
    return this.prisma.kinerjaBidangSopTarget.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        sop: true,
      },
    });
  }

  async findRealizations(filters: ReportFilters): Promise<KinerjaBidangRealizationRecord[]> {
    return this.prisma.kinerjaBidangSopRealization.findMany({
      where: this.buildRealizationWhere(filters),
      include: realizationInclude,
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { quarter: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findRealizationById(id: string): Promise<KinerjaBidangRealizationRecord | null> {
    return this.prisma.kinerjaBidangSopRealization.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: realizationInclude,
    });
  }

  async dmsDocumentExists(id: string): Promise<boolean> {
    const count = await this.prisma.dmsDocument.count({
      where: {
        id,
        deletedAt: null,
      },
    });

    return count > 0;
  }

  async createRealization(
    data: Prisma.KinerjaBidangSopRealizationUncheckedCreateInput,
  ): Promise<KinerjaBidangRealizationRecord> {
    return this.prisma.kinerjaBidangSopRealization.create({
      data,
      include: realizationInclude,
    });
  }

  async updateRealization(
    id: string,
    data: Prisma.KinerjaBidangSopRealizationUncheckedUpdateInput,
  ): Promise<KinerjaBidangRealizationRecord> {
    return this.prisma.kinerjaBidangSopRealization.update({
      where: { id },
      data,
      include: realizationInclude,
    });
  }

  async replaceEvidence(realizationId: string, evidence: EvidenceInput[]) {
    await this.prisma.kinerjaBidangSopEvidence.deleteMany({
      where: { realizationId },
    });

    if (evidence.length === 0) {
      return;
    }

    await this.prisma.kinerjaBidangSopEvidence.createMany({
      data: evidence.map((item, index) => ({
        realizationId,
        dmsDocumentId: item.dmsDocumentId,
        label: item.label,
        description: item.description,
        isPrimary: item.isPrimary ?? index === 0,
        createdBy: item.createdBy,
      })),
      skipDuplicates: true,
    });
  }

  async addEvidence(realizationId: string, evidence: EvidenceInput) {
    if (evidence.isPrimary) {
      await this.prisma.kinerjaBidangSopEvidence.updateMany({
        where: { realizationId },
        data: { isPrimary: false },
      });
    }

    return this.prisma.kinerjaBidangSopEvidence.upsert({
      where: {
        realizationId_dmsDocumentId: {
          realizationId,
          dmsDocumentId: evidence.dmsDocumentId,
        },
      },
      update: {
        label: evidence.label,
        description: evidence.description,
        isPrimary: evidence.isPrimary ?? false,
      },
      create: {
        realizationId,
        dmsDocumentId: evidence.dmsDocumentId,
        label: evidence.label,
        description: evidence.description,
        isPrimary: evidence.isPrimary ?? false,
        createdBy: evidence.createdBy,
      },
    });
  }

  async evidenceBelongsToRealization(evidenceId: string, realizationId: string): Promise<boolean> {
    const count = await this.prisma.kinerjaBidangSopEvidence.count({
      where: {
        id: evidenceId,
        realizationId,
      },
    });

    return count > 0;
  }

  async removeEvidence(evidenceId: string) {
    return this.prisma.kinerjaBidangSopEvidence.delete({
      where: { id: evidenceId },
    });
  }

  private buildSopWhere(filters: SopFilters): Prisma.KinerjaBidangSopWhereInput {
    const where: Prisma.KinerjaBidangSopWhereInput = {
      deletedAt: null,
    };

    if (filters.stage) {
      where.stage = filters.stage;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (typeof filters.isRhkPrimary === 'boolean') {
      where.isRhkPrimary = filters.isRhkPrimary;
    }

    if (filters.rhkCode) {
      where.rhkMappings = {
        some: {
          rhkCode: filters.rhkCode,
        },
      };
    }

    if (filters.q) {
      where.OR = [
        { code: { contains: filters.q } },
        { title: { contains: filters.q } },
        { shortDescription: { contains: filters.q } },
      ];
    }

    return where;
  }

  private buildRealizationWhere(filters: ReportFilters): Prisma.KinerjaBidangSopRealizationWhereInput {
    const where: Prisma.KinerjaBidangSopRealizationWhereInput = {
      year: filters.year,
      deletedAt: null,
    };

    if (filters.month) {
      where.month = filters.month;
    }

    if (filters.quarter) {
      where.quarter = filters.quarter;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    return where;
  }
}
