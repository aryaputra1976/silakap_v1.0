import { Inject, Injectable } from '@nestjs/common';
import { DomainEvent, EventStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type DomainEventRecord = DomainEvent;

@Injectable()
export class EventsRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async publish(data: Prisma.DomainEventUncheckedCreateInput) {
    return this.prisma.domainEvent.create({
      data,
    });
  }

  async findPending(limit: number): Promise<DomainEventRecord[]> {
    return this.prisma.domainEvent.findMany({
      where: {
        status: EventStatus.PENDING,
      },
      orderBy: [{ createdAt: 'asc' }],
      take: limit,
    });
  }

  async findUsersByRoleCodes(roleCodes: string[]) {
    if (roleCodes.length === 0) {
      return [];
    }

    return this.prisma.user.findMany({
      where: {
        deletedAt: null,
        status: 'ACTIVE',
        userRoles: {
          some: {
            role: {
              code: {
                in: roleCodes,
              },
            },
          },
        },
      },
      select: {
        id: true,
      },
    });
  }

  async createNotifications(
    notifications: Prisma.NotificationUncheckedCreateInput[],
  ) {
    if (notifications.length === 0) {
      return { count: 0 };
    }

    return this.prisma.notification.createMany({
      data: notifications,
    });
  }

  async markProcessed(id: string) {
    return this.prisma.domainEvent.update({
      where: { id },
      data: {
        status: EventStatus.PROCESSED,
        processedAt: new Date(),
        errorMessage: null,
      },
    });
  }

  async markFailed(id: string, errorMessage: string) {
    return this.prisma.domainEvent.update({
      where: { id },
      data: {
        status: EventStatus.FAILED,
        retryCount: {
          increment: 1,
        },
        errorMessage,
      },
    });
  }
}
