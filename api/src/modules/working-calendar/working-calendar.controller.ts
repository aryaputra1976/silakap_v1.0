import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ok } from '../shared/respond';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { CreateWorkingCalendarDto } from './dto/create-working-calendar.dto';
import { QueryHolidayDto } from './dto/query-holiday.dto';
import { UpdateWorkingCalendarDto } from './dto/update-working-calendar.dto';
import { WorkingCalendarService } from './working-calendar.service';

const VIEW_ROLES = ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'KEPALA_BADAN', 'KABID'];
const MANAGE_ROLES = ['SUPER_ADMIN', 'ADMIN_BKPSDM'];

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/working-calendar')
export class WorkingCalendarController {
  constructor(
    @Inject(WorkingCalendarService)
    private readonly service: WorkingCalendarService,
  ) {}

  @Get()
  @Roles(...VIEW_ROLES)
  async findAll() {
    return ok(await this.service.findAll());
  }

  @Get('effective')
  @Roles(...VIEW_ROLES)
  async effective() {
    return ok(await this.service.getEffectiveCalendar());
  }

  @Get(':id')
  @Roles(...VIEW_ROLES)
  async findOne(@Param('id') id: string) {
    return ok(await this.service.findById(id));
  }

  @Post()
  @Roles(...MANAGE_ROLES)
  async create(@Body() dto: CreateWorkingCalendarDto, @CurrentUser() user: AuthUser) {
    return ok(await this.service.create(dto, user));
  }

  @Patch(':id')
  @Roles(...MANAGE_ROLES)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateWorkingCalendarDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.update(id, dto, user));
  }

  @Get(':id/holidays')
  @Roles(...VIEW_ROLES)
  async holidays(@Param('id') id: string, @Query() query: QueryHolidayDto) {
    return ok(await this.service.getHolidays(id, query));
  }

  @Post(':id/holidays')
  @Roles(...MANAGE_ROLES)
  async addHoliday(
    @Param('id') id: string,
    @Body() dto: CreateHolidayDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.addHoliday(id, dto, user));
  }

  @Delete(':id/holidays/:holidayId')
  @Roles(...MANAGE_ROLES)
  async deleteHoliday(
    @Param('id') id: string,
    @Param('holidayId') holidayId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.deleteHoliday(id, holidayId, user));
  }
}
