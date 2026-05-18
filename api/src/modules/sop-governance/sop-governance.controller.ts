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
import { SopGovernanceService } from './sop-governance.service';
import { CreateGovernanceRecordDto } from './dto/create-governance-record.dto';
import { UpdateGovernanceRecordDto } from './dto/update-governance-record.dto';
import { GovernanceActionDto } from './dto/governance-action.dto';
import { GovernanceListQueryDto } from './dto/governance-list-query.dto';

// Roles that can read governance data (excludes OPD, PPPK)
const VIEW_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
  'ANALIS_PERTAMA',
  'PENELAAH',
] as const;

// Roles that can create/update records
const WRITE_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
] as const;

// Roles that can activate/archive
const ACTION_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
] as const;

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/sop-governance')
export class SopGovernanceController {
  constructor(private readonly service: SopGovernanceService) {}

  // ── Records ──────────────────────────────────────────────────────────────────

  @Get('records')
  @Roles(...VIEW_ROLES)
  async list(@Query() query: GovernanceListQueryDto, @CurrentUser() user: AuthUser) {
    const data = await this.service.list(query, user.roles);
    return ok(data);
  }

  @Get('records/:id')
  @Roles(...VIEW_ROLES)
  async getById(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const data = await this.service.getById(id, user.roles);
    return ok(data);
  }

  @Post('records')
  @Roles(...WRITE_ROLES)
  async create(@Body() dto: CreateGovernanceRecordDto, @CurrentUser() user: AuthUser) {
    const data = await this.service.create(dto, user.id, user.roles);
    return ok(data);
  }

  @Patch('records/:id')
  @Roles(...WRITE_ROLES)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateGovernanceRecordDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.service.update(id, dto, user.id, user.roles);
    return ok(data);
  }

  // ── Status actions ────────────────────────────────────────────────────────────

  @Post('records/:id/activate')
  @Roles(...ACTION_ROLES)
  async activate(
    @Param('id') id: string,
    @Body() dto: GovernanceActionDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.service.activate(id, dto, user.id, user.roles);
    return ok(data);
  }

  @Post('records/:id/archive')
  @Roles(...ACTION_ROLES)
  async archive(
    @Param('id') id: string,
    @Body() dto: GovernanceActionDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.service.archive(id, dto, user.id, user.roles);
    return ok(data);
  }

  @Post('records/:id/mark-review')
  @Roles(...WRITE_ROLES)
  async markReview(
    @Param('id') id: string,
    @Body() dto: GovernanceActionDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.service.markReview(id, dto, user.id, user.roles);
    return ok(data);
  }

  // ── Aggregates ────────────────────────────────────────────────────────────────

  @Get('summary')
  @Roles(...VIEW_ROLES)
  async getSummary(@Query() query: GovernanceListQueryDto, @CurrentUser() user: AuthUser) {
    const data = await this.service.getSummary(query, user.roles);
    return ok(data);
  }

  @Get('due-review')
  @Roles(...VIEW_ROLES)
  async getDueReview(@Query() query: GovernanceListQueryDto, @CurrentUser() user: AuthUser) {
    const data = await this.service.getDueReview(query, user.roles);
    return ok(data);
  }

  @Get('change-logs')
  @Roles(...VIEW_ROLES)
  async getChangeLogs(
    @Query('governanceId') governanceId: string | undefined,
    @Query('limit') limit: string | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    const take = limit ? Math.min(parseInt(limit, 10) || 20, 100) : 20;
    const data = await this.service.getChangeLogs(governanceId, take, user.roles);
    return ok(data);
  }
}
