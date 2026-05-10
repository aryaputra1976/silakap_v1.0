import {
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ok } from '../shared/respond';
import { NotificationListQueryDto } from './dto/notification-list-query.dto';
import { NotificationsService } from './notifications.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID')
@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(
    @Inject(NotificationsService)
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  async findMany(
    @Query() query: NotificationListQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.notificationsService.findMany(query, user));
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: AuthUser) {
    return ok(await this.notificationsService.unreadCount(user));
  }

  @Post(':id/read')
  async markAsRead(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return ok(
      await this.notificationsService.markAsRead(id, user),
      'Notifikasi ditandai sudah dibaca',
    );
  }

  @Post('read-all')
  async markAllAsRead(@CurrentUser() user: AuthUser) {
    return ok(
      await this.notificationsService.markAllAsRead(user),
      'Semua notifikasi ditandai sudah dibaca',
    );
  }
}
