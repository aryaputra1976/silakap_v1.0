import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
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
import { CreateIkmPeriodDto, IkmSurveyQueryDto, SubmitIkmSurveyDto } from './dto/ikm.dto';
import { IkmService } from './ikm.service';

const ALL_ROLES = [
  'SUPER_ADMIN', 'ADMIN_BKPSDM', 'KEPALA_BADAN', 'KABID',
  'ANALIS_MADYA', 'ANALIS_MUDA', 'ANALIS_PERTAMA', 'PENELAAH', 'PPPK', 'OPD',
];

const MANAGE_ROLES = ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID', 'ANALIS_MADYA', 'ANALIS_MUDA'];

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ALL_ROLES)
@Controller('api/v1/ikm')
export class IkmController {
  constructor(
    @Inject(IkmService)
    private readonly service: IkmService,
  ) {}

  // ── Periods ──────────────────────────────────────────────────────────────

  @Get('periods')
  async findPeriods(@CurrentUser() user: AuthUser) {
    return ok(await this.service.findPeriods(user));
  }

  @Post('periods')
  @Roles(...MANAGE_ROLES)
  async createPeriod(
    @Body() body: CreateIkmPeriodDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.createPeriod(body, user));
  }

  @Patch('periods/:id/close')
  @Roles(...MANAGE_ROLES)
  async closePeriod(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return ok(await this.service.closePeriod(id, user));
  }

  @Patch('periods/:id/reopen')
  @Roles(...MANAGE_ROLES)
  async reopenPeriod(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return ok(await this.service.reopenPeriod(id, user));
  }

  // ── Surveys ───────────────────────────────────────────────────────────────

  @Post('surveys')
  async submitSurvey(
    @Body() body: SubmitIkmSurveyDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.submitSurvey(body, user));
  }

  @Get('surveys')
  @Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'KEPALA_BADAN', 'KABID', 'ANALIS_MADYA', 'ANALIS_MUDA', 'ANALIS_PERTAMA', 'PENELAAH', 'PPPK')
  async findSurveys(
    @Query() query: IkmSurveyQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.findSurveys(query, user));
  }

  @Get('summary/trend')
  @Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'KEPALA_BADAN', 'KABID', 'ANALIS_MADYA', 'ANALIS_MUDA', 'ANALIS_PERTAMA', 'PENELAAH', 'PPPK')
  async getTrend(@CurrentUser() user: AuthUser) {
    return ok(await this.service.getTrend(user));
  }

  @Get('periods/:id/summary')
  @Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'KEPALA_BADAN', 'KABID', 'ANALIS_MADYA', 'ANALIS_MUDA', 'ANALIS_PERTAMA', 'PENELAAH', 'PPPK')
  async getSummary(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return ok(await this.service.getSummary(id, user));
  }
}
