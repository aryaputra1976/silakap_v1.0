import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const submissionInclude = {
  documents: {
    orderBy: { uploadedAt: 'desc' },
  },
  auditLogs: {
    orderBy: { createdAt: 'desc' },
  },
} satisfies Prisma.OpdSubmissionInclude;

export type OpdSubmissionRecord = Prisma.OpdSubmissionGetPayload<{
  include: typeof submissionInclude;
}>;

export type OpdSubmissionListFilters = {
  q?: string;
  status?: string;
  moduleKey?: string;
  serviceType?: string;
  opdUnitId?: string;
  opdUserId?: string;
  page: number;
  limit: number;
};

@Injectable()
export class OpdSubmissionRepository {
  constructor(private readonly prisma: PrismaService) {}

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

  async getSummary(filters: Omit<OpdSubmissionListFilters, 'page' | 'limit'>) {
    const where = this.buildWhere({ ...filters, page: 1, limit: 1 });
    const [
      total,
      menungguVerifikasi,
      perluPerbaikan,
      selesai,
      dokumenDiunggah,
      usulanAktif,
    ] = await Promise.all([
      this.prisma.opdSubmission.count({ where }),
      this.prisma.opdSubmission.count({
        where: { ...where, status: { in: ['SUBMITTED', 'CORRECTION_SUBMITTED'] } },
      }),
      this.prisma.opdSubmission.count({
        where: { ...where, status: 'NEEDS_CORRECTION' },
      }),
      this.prisma.opdSubmission.count({
        where: { ...where, status: { in: ['COMPLETED', 'VERIFIED'] } },
      }),
      this.prisma.opdSubmissionDocument.count({
        where: {
          submission: where,
        },
      }),
      this.prisma.opdSubmission.count({
        where: {
          ...where,
          status: {
            in: [
              'SUBMITTED',
              'RECEIVED',
              'IN_VERIFICATION',
              'NEEDS_CORRECTION',
              'CORRECTION_SUBMITTED',
            ],
          },
        },
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
      ...(filters.moduleKey ? { moduleKey: filters.moduleKey } : {}),
      ...(filters.serviceType ? { serviceType: filters.serviceType } : {}),
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
