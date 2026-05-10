import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ok } from '../shared/respond';
import { EventsService } from './events.service';

type ProcessPendingBody = {
  limit?: number;
};

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN_BKPSDM')
@Controller('api/v1/events')
export class EventsController {
  constructor(
    @Inject(EventsService)
    private readonly eventsService: EventsService,
  ) {}

  @Post('process-pending')
  async processPending(
    @Body() body: ProcessPendingBody,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.eventsService.processPending(
      body.limit ?? 50,
      user,
    );

    return ok(result, 'Pending event berhasil diproses');
  }
}
