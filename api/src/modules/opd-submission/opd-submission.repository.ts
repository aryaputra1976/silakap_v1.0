import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const submissionInclude = {
  documents: {
    orderBy: { uploadedAt: 'desc' },
  },
  auditLogs: {
    orderBy: { createdAt: 'desc' },
  },
  timelines: {
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.OpdSubmissionInclude;

export type OpdSubmissionRecord = Prisma.OpdSubmissionGetPayload<{
  include: typeof submissionInclude;
}>;

export type OpdSubmissionTimelineRecord = Prisma.OpdSubmissionTimelineGetPayload<object>;

export type OpdSubmissionListFilters = {
  q?: string;
  status?: string;
  moduleKey?: string;
  serviceType?: string;
  opdUnitId?: string;
  opdUserId?: string;
  slaStatus?: string;
  from?: Date;
  to?: Date;
  page: number;
  limit: number;
};

@Injectable()
export class OpdSubmissionRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findMany(filters: OpdSubmissionListFilters) {
    const where = this.buildWhere(filters);
    const skip = (filters.page - 1) * filters.limit;

    const [items, total] = await Promise.all([
      this.prisma.opdSubmission.findMany({
        where,
        include: submissionInclude,
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: filters.limit,
      }),
      this.prisma.opdSubmission.count({ where }),
    ]);

    return { items, total };
  }

  findById(id: string) {
    return this.prisma.opdSubmission.findUnique({
      where: { id },
      include: submissionInclude,
    });
  }

  create(data: Prisma.OpdSubmissionUncheckedCreateInput) {
    return this.prisma.opdSubmission.create({
      data,
      include: submissionInclude,
    });
  }

  update(id: string, data: Prisma.OpdSubmissionUncheckedUpdateInput) {
    return this.prisma.opdSubmission.update({
      where: { id },
      data,
      include: submissionInclude,
    });
  }

  async updateAtomic(
    id: string,
    expectedStatuses: string[],
    data: Prisma.OpdSubmissionUncheckedUpdateInput,
  ): Promise<OpdSubmissionRecord | null> {
    const { count } = await this.prisma.opdSubmission.updateMany({
      where: { id, status: { in: expectedStatuses } },
      data,
    });
    if (count === 0) return null;
    return this.prisma.opdSubmission.findUnique({
      where: { id },
      include: submissionInclude,
    });
  }

  findSlaItems(filters: Omit<OpdSubmissionListFilters, 'page' | 'limit'>) {
    return this.prisma.opdSubmission.findMany({
      where: this.buildWhere({ ...filters, page: 1, limit: 1 }),
      include: submissionInclude,
      orderBy: [{ slaDueAt: 'asc' }, { updatedAt: 'desc' }],
      take: 500,
    });
  }

  addDocument(data: Prisma.OpdSubmissionDocumentUncheckedCreateInput) {
    return this.prisma.opdSubmissionDocument.create({ data });
  }

  findDocumentById(id: string) {
    return this.prisma.opdSubmissionDocument.findUnique({
      where: { id },
    });
  }

  updateDocument(
    id: string,
    data: Prisma.OpdSubmissionDocumentUncheckedUpdateInput,
  ) {
    return this.prisma.opdSubmissionDocument.update({
      where: { id },
      data,
    });
  }

  countSubmittedOnDay(start: Date, end: Date) {
    return this.prisma.opdSubmission.count({
      where: {
        submittedAt: {
          gte: start,
          lt: end,
        },
        submissionNumber: {
          not: null,
        },
      },
    });
  }

  async createAuditLog(params: {
    submissionId: string;
    action: string;
    beforeJson?: Prisma.InputJsonValue;
    afterJson?: Prisma.InputJsonValue;
    actorId?: string | null;
    actorRole?: string | null;
    note?: string | null;
  }) {
    return this.prisma.opdSubmissionAuditLog.create({
      data: {
        submissionId: params.submissionId,
        action: params.action,
        beforeJson: params.beforeJson,
        afterJson: params.afterJson,
        actorId: params.actorId ?? null,
        actorRole: params.actorRole ?? null,
        note: params.note ?? null,
      },
    });
  }

  async createTimeline(params: {
    submissionId: string;
    fromStatus?: string | null;
    toStatus: string;
    action: string;
    actorId?: string | null;
    actorRole?: string | null;
    note?: string | null;
    publicNote?: string | null;
    isVisibleToOpd?: boolean;
  }) {
    return this.prisma.opdSubmissionTimeline.create({
      data: {
        submissionId: params.submissionId,
        fromStatus: params.fromStatus ?? null,
        toStatus: params.toStatus,
        action: params.action,
        actorId: params.actorId ?? null,
        actorRole: params.actorRole ?? null,
        note: params.note ?? null,
        publicNote: params.publicNote ?? null,
        isVisibleToOpd: params.isVisibleToOpd ?? true,
      },
    });
  }

  findTimeline(submissionId: string, visibleOnly: boolean) {
    return this.prisma.opdSubmissionTimeline.findMany({
      where: {
        submissionId,
        ...(visibleOnly ? { isVisibleToOpd: true } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getSummary(filters: Omit<OpdSubmissionListFilters, 'page' | 'limit'>) {
    const where = this.buildWhere({ ...filters, page: 1, limit: 1 });
    const countByStatus = (status: string | { in: string[] }) =>
      this.prisma.opdSubmission.count({
        where: { ...where, status },
      });

    const [
      total,
      menungguVerifikasi,
      perluPerbaikan,
      selesai,
      dokumenDiunggah,
      usulanAktif,
    ] = await Promise.all([
      this.prisma.opdSubmission.count({ where }),
      countByStatus({ in: ['SUBMITTED', 'CORRECTION_SUBMITTED'] }),
      countByStatus('NEEDS_CORRECTION'),
      countByStatus({ in: ['COMPLETED', 'VERIFIED'] }),
      this.prisma.opdSubmissionDocument.count({
        where: {
          submission: {
            is: where,
          },
        },
      }),
      countByStatus({
        in: [
          'SUBMITTED',
          'RECEIVED',
          'IN_VERIFICATION',
          'NEEDS_CORRECTION',
          'CORRECTION_SUBMITTED',
        ],
      }),
    ]);

    return {
      totalPermohonan: total,
      menungguVerifikasi,
      perluPerbaikan,
      selesai,
      dokumenDiunggah,
      usulanAktif,
    };
  }

  private buildWhere(filters: OpdSubmissionListFilters): Prisma.OpdSubmissionWhereInput {
    const q = filters.q?.trim();

    return {
      ...(filters.opdUserId ? { opdUserId: filters.opdUserId } : {}),
      ...(filters.opdUnitId ? { opdUnitId: filters.opdUnitId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.slaStatus ? { slaStatus: filters.slaStatus } : {}),
      ...(filters.moduleKey ? { moduleKey: filters.moduleKey } : {}),
      ...(filters.serviceType ? { serviceType: filters.serviceType } : {}),
      ...((filters.from || filters.to)
        ? {
            createdAt: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
      ...(q
        ? {
            OR: [
              { submissionNumber: { contains: q } },
              { title: { contains: q } },
              { subjectName: { contains: q } },
              { subjectNip: { contains: q } },
            ],
          }
        : {}),
    };
  }
}
