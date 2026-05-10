import {
  Body,
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
import { CaseListQueryDto } from './dto/case-list-query.dto';
import { CompleteTaskDto } from './dto/complete-task.dto';
import { CreateCaseDto } from './dto/create-case.dto';
import { TaskListQueryDto } from './dto/task-list-query.dto';
import { SiapService } from './siap.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID')
@Controller('api/v1/siap')
export class SiapController {
  constructor(
    @Inject(SiapService)
    private readonly siapService: SiapService,
  ) {}

  @Get('cases')
  async findCases(@Query() query: CaseListQueryDto) {
    const result = await this.siapService.findCases(query);
    return ok(result);
  }

  @Get('cases/:id')
  async findCaseById(@Param('id') id: string) {
    const result = await this.siapService.findCaseById(id);
    return ok(result);
  }

  @Post('cases')
  async createCase(
    @Body() dto: CreateCaseDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.siapService.createCase(dto, user);
    return ok(result, 'Case berhasil dibuat');
  }

  @Post('cases/:id/submit')
  async submitCase(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const result = await this.siapService.submitCase(id, user);
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

  @Get('tasks/:id')
  async findTaskById(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const result = await this.siapService.findTaskById(id, user);
    return ok(result);
  }

  @Post('tasks/:id/start')
  async startTask(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const result = await this.siapService.startTask(id, user);
    return ok(result, 'Task mulai diproses');
  }

  @Post('tasks/:id/complete')
  async completeTask(
    @Param('id') id: string,
    @Body() dto: CompleteTaskDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.siapService.completeTask(id, dto, user);
    return ok(result, 'Task selesai');
  }
}
