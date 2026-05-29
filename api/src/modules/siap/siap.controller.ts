import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ok } from '../shared/respond';
import { getAuditContext } from '../shared/request-context';
import { AssignTaskDto } from './dto/assign-task.dto';
import { CaseListQueryDto } from './dto/case-list-query.dto';
import { CompleteTaskDto } from './dto/complete-task.dto';
import { CreateCaseDto } from './dto/create-case.dto';
import { ReturnTaskDto } from './dto/return-task.dto';
import { TaskListQueryDto } from './dto/task-list-query.dto';
import { SiapService } from './siap.service';

const SIAP_VIEW_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
  'ANALIS_PERTAMA',
  'PENELAAH',
  'PPPK',
  'OPD_OPERATOR',
  'ASN',
];

const SIAP_CREATE_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'OPD_OPERATOR',
  'ASN',
];

const SIAP_ASSIGN_ROLES = [
  'SUPER_ADMIN',
  'KABID',
  'ANALIS_MADYA',
];

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...SIAP_VIEW_ROLES)
@Controller('api/v1/siap')
export class SiapController {
  constructor(
    @Inject(SiapService)
    private readonly siapService: SiapService,
  ) {}

  @Get('cases')
  async findCases(
    @Query() query: CaseListQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.siapService.findCases(query, user);
    return ok(result);
  }

  @Get('cases/:id')
  async findCaseById(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const result = await this.siapService.findCaseById(id, user);
    return ok(result);
  }

  @Post('cases')
  @Roles(...SIAP_CREATE_ROLES)
  async createCase(
    @Body() dto: CreateCaseDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.siapService.createCase(dto, user);
    return ok(result, 'Case berhasil dibuat');
  }

  @Post('cases/:id/submit')
  @Roles(...SIAP_CREATE_ROLES)
  async submitCase(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    const result = await this.siapService.submitCase(
      id,
      user,
      getAuditContext(request),
    );
    return ok(result, 'Case berhasil disubmit');
  }

  @Get('tasks')
  async findTasks(
    @Query() query: TaskListQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.siapService.findTasks(query, user);
    return ok(result);
  }

  @Get('tasks/my')
  async findMyTasks(
    @Query() query: TaskListQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.siapService.findMyTasks(query, user);
    return ok(result);
  }

  @Get('tasks/team')
  @Roles(...SIAP_ASSIGN_ROLES)
  async findTeamTasks(
    @Query() query: TaskListQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.siapService.findTeamTasks(query, user);
    return ok(result);
  }

  @Get('assignees')
  @Roles(...SIAP_ASSIGN_ROLES)
  async findAssignableUsers(@CurrentUser() user: AuthUser) {
    const result = await this.siapService.findAssignableUsers(user);
    return ok(result);
  }

  @Get('tasks/:id')
  async findTaskById(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const result = await this.siapService.findTaskById(id, user);
    return ok(result);
  }

  @Get('tasks/:id/verification')
  async getTaskVerification(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.siapService.getTaskVerification(id, user);
    return ok(result);
  }

  @Post('tasks/:id/start')
  async startTask(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    const result = await this.siapService.startTask(
      id,
      user,
      getAuditContext(request),
    );
    return ok(result, 'Task mulai diproses');
  }

  @Post('tasks/:id/complete')
  async completeTask(
    @Param('id') id: string,
    @Body() dto: CompleteTaskDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    const result = await this.siapService.completeTask(
      id,
      dto,
      user,
      getAuditContext(request),
    );
    return ok(result, 'Task selesai');
  }

  @Post('tasks/:id/assign')
  @Roles(...SIAP_ASSIGN_ROLES)
  async assignTask(
    @Param('id') id: string,
    @Body() dto: AssignTaskDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.siapService.assignTask(id, dto, user);
    return ok(result, 'Task berhasil ditugaskan');
  }

  @Post('tasks/:id/return')
  async returnTask(
    @Param('id') id: string,
    @Body() dto: ReturnTaskDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.siapService.returnTask(id, dto, user);
    return ok(result, 'Task berhasil dikembalikan');
  }
}
