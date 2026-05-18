import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth.types';
import { ok } from '../shared/respond';
import { SopChecklistService } from './sop-checklist.service';
import { CreateInstanceDto } from './dto/create-instance.dto';
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';
import { ApproveRejectDto } from './dto/approve-reject.dto';
import { ListInstancesQueryDto } from './dto/list-instances-query.dto';

const INTERNAL_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
  'ANALIS_PERTAMA',
  'PENELAAH',
  'PPPK',
];

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/sop-checklists')
export class SopChecklistController {
  constructor(private readonly service: SopChecklistService) {}

  @Get()
  @Roles(...INTERNAL_ROLES)
  async listInstances(
    @Query() query: ListInstancesQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.service.listInstances(query, user.roles);
    return ok(data);
  }

  @Post('instances')
  @Roles(...INTERNAL_ROLES)
  async getOrCreate(
    @Body() dto: CreateInstanceDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.service.getOrCreateInstance(dto, user.id, user.roles);
    return ok(data);
  }

  @Get('instances/:id')
  @Roles(...INTERNAL_ROLES)
  async getInstance(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.service.getInstanceById(id, user.roles);
    return ok(data);
  }

  @Patch('instances/:id/items')
  @Roles(...INTERNAL_ROLES)
  async updateItem(
    @Param('id') id: string,
    @Body() dto: UpdateChecklistItemDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.service.updateItem(id, dto, user.id, user.roles);
    return ok(data);
  }

  @Post('instances/:id/approve')
  @Roles(
    'SUPER_ADMIN',
    'ADMIN_BKPSDM',
    'KEPALA_BADAN',
    'KABID',
    'ANALIS_MADYA',
  )
  async approveReject(
    @Param('id') id: string,
    @Body() dto: ApproveRejectDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.service.approveReject(id, dto, user.id, user.roles);
    return ok(data);
  }

  @Get('instances/:id/audit-logs')
  @Roles(...INTERNAL_ROLES)
  async getAuditLogs(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.service.getAuditLogs(id, user.roles);
    return ok(data);
  }
}
