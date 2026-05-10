import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const notificationInclude = {
  case: {
    select: {
      id: true,
      caseNumber: true,
      serviceType: true,
      title: true,
      currentState: true,
      status: true,
    },
  },
  user: {
    select: {
      id: true,
      username: true,
      name: true,
    },
  },
} satisfies Prisma.NotificationInclude;

export type NotificationRecord = Prisma.NotificationGetPayload<{
  include: typeof notificationInclude;
}>;

export type NormalizedNotificationFilters = {
  q?: string;
  userId?: string;
  unreadOnly: boolean;
  all: boolean;
  page: number;
  limit: number;
};

@Injectable()
export class NotificationsRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findMany(
    filters: NormalizedNotificationFilters,
  ): Promise<{ items: NotificationRecord[]; total: number }> {
    const where = this.buildWhere(filters);
    const skip = (filters.page - 1) * filters.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        include: notificationInclude,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: filters.limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { items, total };
  }

  async countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        readAt: null,
      },
    });
  }

  async findById(id: string): Promise<NotificationRecord | null> {
    return this.prisma.notification.findUnique({
      where: { id },
      include: notificationInclude,
    });
  }

  async markAsRead(
    id: string,
    userId: string,
  ): Promise<NotificationRecord | null> {
    const existing = await this.prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return null;
    }

    return this.prisma.notification.update({
      where: { id },
      data: {
        readAt: new Date(),
      },
      include: notificationInclude,
    });
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return result.count;
  }

  private buildWhere(
    filters: NormalizedNotificationFilters,
  ): Prisma.NotificationWhereInput {
    const where: Prisma.NotificationWhereInput = {};

    if (!filters.all && filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.unreadOnly) {
      where.readAt = null;
    }

    if (filters.q) {
      where.OR = [
        { title: { contains: filters.q } },
        { body: { contains: filters.q } },
        { type: { contains: filters.q } },
        { case: { caseNumber: { contains: filters.q } } },
        { case: { title: { contains: filters.q } } },
      ];
    }

    return where;
  }
}
