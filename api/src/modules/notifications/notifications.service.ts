import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthUser } from '../auth/auth.types';
import { NotificationListQueryDto } from './dto/notification-list-query.dto';
import {
  NotificationRecord,
  NotificationsRepository,
  NormalizedNotificationFilters,
} from './notifications.repository';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(NotificationsRepository)
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  async findMany(query: NotificationListQueryDto, user: AuthUser) {
    const filters = this.normalizeFilters(query, user);
    const result = await this.notificationsRepository.findMany(filters);

    return {
      items: result.items.map((item) => this.toResponse(item)),
      page: filters.page,
      limit: filters.limit,
      total: result.total,
    };
  }

  async unreadCount(user: AuthUser) {
    return {
      unread: await this.notificationsRepository.countUnread(user.id),
    };
  }

  async markAsRead(id: string, user: AuthUser) {
    const updated = await this.notificationsRepository.markAsRead(
      id.trim(),
      user.id,
    );

    if (!updated) {
      throw new NotFoundException('Notifikasi tidak ditemukan');
    }

    return this.toResponse(updated);
  }

  async markAllAsRead(user: AuthUser) {
    const count = await this.notificationsRepository.markAllAsRead(user.id);

    return {
      updated: count,
    };
  }

  private normalizeFilters(
    query: NotificationListQueryDto,
    user: AuthUser,
  ): NormalizedNotificationFilters {
    const all = this.toBoolean(query.all);

    if (all && !this.hasPrivilegedRole(user)) {
      throw new ForbiddenException(
        'Anda tidak berwenang melihat semua notifikasi',
      );
    }

    return {
      q: this.normalizeOptionalText(query.q),
      userId: user.id,
      unreadOnly: this.toBoolean(query.unreadOnly),
      all,
      page: this.normalizePositiveNumber(query.page, 1, 1, 10000),
      limit: this.normalizePositiveNumber(query.limit, 10, 1, 100),
    };
  }

  private hasPrivilegedRole(user: AuthUser) {
    return user.roles.some((role) =>
      ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID'].includes(role),
    );
  }

  private toBoolean(value: string | undefined) {
    return value === '1' || value === 'true' || value === 'yes';
  }

  private normalizeOptionalText(value: string | undefined) {
    const normalized = value?.trim();

    return normalized ? normalized : undefined;
  }

  private normalizePositiveNumber(
    value: string | undefined,
    defaultValue: number,
    min: number,
    max: number,
  ) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      return defaultValue;
    }

    return Math.min(Math.max(Math.trunc(parsed), min), max);
  }

  private toResponse(record: NotificationRecord) {
    return {
      id: record.id,
      userId: record.userId,
      caseId: record.caseId,
      type: record.type,
      title: record.title,
      body: record.body,
      actionUrl: record.actionUrl,
      metadata: record.metadata,
      readAt: record.readAt,
      createdAt: record.createdAt,
      createdBy: record.createdBy,
      case: record.case,
      user: record.user,
    };
  }
}
