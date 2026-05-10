import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type AuditContext = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type AuditRecordInput = {
  entityType: string;
  entityId: string;
  action: string;
  performedBy?: string | null;
  beforeData?: Prisma.InputJsonValue | null;
  afterData?: Prisma.InputJsonValue | null;
  context?: AuditContext;
};

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async record(input: AuditRecordInput) {
    try {
      await this.prisma.auditLog.create({
        data: {
          entityType: input.entityType,
          entityId: input.entityId,
          action: input.action,
          performedBy: input.performedBy ?? null,
          beforeData: input.beforeData ?? undefined,
          afterData: input.afterData ?? undefined,
          ipAddress: input.context?.ipAddress ?? null,
          userAgent: input.context?.userAgent ?? null,
        },
      });
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : 'Gagal menulis audit log';
      this.logger.error(
        `Audit ${input.action} ${input.entityType}/${input.entityId} failed: ${message}`,
      );
    }
  }
}
