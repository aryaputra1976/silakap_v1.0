import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const dmsAuditLogSelect = {
  id: true,
  entityType: true,
  entityId: true,
  action: true,
  performedBy: true,
  beforeData: true,
  afterData: true,
  ipAddress: true,
  userAgent: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      username: true,
      name: true,
    },
  },
} satisfies Prisma.AuditLogSelect;

export type DmsAuditLogRecord = Prisma.AuditLogGetPayload<{
  select: typeof dmsAuditLogSelect;
}>;

@Injectable()
export class DmsAuditRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findDocumentAuditLogs(documentId: string): Promise<DmsAuditLogRecord[]> {
    return this.prisma.auditLog.findMany({
      where: {
        entityType: 'DMS_DOCUMENT',
        entityId: documentId,
      },
      select: dmsAuditLogSelect,
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });
  }
}
