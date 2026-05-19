import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import type { AuthUser } from '../auth/auth.types';
import { DEFAULT_CALENDAR, WorkingCalendarConfig } from './business-time.util';
import type { CreateHolidayDto } from './dto/create-holiday.dto';
import type { CreateWorkingCalendarDto } from './dto/create-working-calendar.dto';
import type { QueryHolidayDto } from './dto/query-holiday.dto';
import type { UpdateWorkingCalendarDto } from './dto/update-working-calendar.dto';
import { WorkingCalendarRepository } from './working-calendar.repository';

@Injectable()
export class WorkingCalendarService {
  constructor(
    @Inject(WorkingCalendarRepository) private readonly repo: WorkingCalendarRepository,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  findAll() {
    return this.repo.findAll();
  }

  async findById(id: string) {
    const record = await this.repo.findById(id);
    if (!record) throw new NotFoundException(`WorkingCalendar ${id} not found`);
    return record;
  }

  async create(dto: CreateWorkingCalendarDto, user: AuthUser) {
    const created = await this.repo.create(dto);
    await this.audit.record({
      entityType: 'WORKING_CALENDAR',
      entityId: created.id,
      action: 'WORKING_CALENDAR_CREATED',
      performedBy: user.id,
      afterData: {
        name: created.name,
        timezone: created.timezone,
        isDefault: created.isDefault,
      },
    });
    return created;
  }

  async update(id: string, dto: UpdateWorkingCalendarDto, user: AuthUser) {
    const before = await this.findById(id);
    const updated = await this.repo.update(id, dto);
    await this.audit.record({
      entityType: 'WORKING_CALENDAR',
      entityId: id,
      action: 'WORKING_CALENDAR_UPDATED',
      performedBy: user.id,
      beforeData: {
        name: before.name,
        timezone: before.timezone,
        workDays: before.workDays as number[],
        workStart: before.workStart,
        workEnd: before.workEnd,
        isDefault: before.isDefault,
        isActive: before.isActive,
      },
      afterData: {
        name: updated.name,
        timezone: updated.timezone,
        workDays: updated.workDays as number[],
        workStart: updated.workStart,
        workEnd: updated.workEnd,
        isDefault: updated.isDefault,
        isActive: updated.isActive,
      },
    });
    return updated;
  }

  async getHolidays(calendarId: string, query: QueryHolidayDto) {
    await this.findById(calendarId);
    return this.repo.findHolidays(calendarId, query.year);
  }

  async addHoliday(calendarId: string, dto: CreateHolidayDto, user: AuthUser) {
    await this.findById(calendarId);
    const created = await this.repo.addHoliday(calendarId, dto);
    await this.audit.record({
      entityType: 'WORKING_CALENDAR_HOLIDAY',
      entityId: created.id,
      action: 'WORKING_CALENDAR_HOLIDAY_CREATED',
      performedBy: user.id,
      afterData: {
        calendarId,
        date: created.date.toISOString(),
        name: created.name,
      },
    });
    return created;
  }

  async deleteHoliday(calendarId: string, holidayId: string, user: AuthUser) {
    await this.findById(calendarId);
    const deleted = await this.repo.deleteHoliday(holidayId);
    await this.audit.record({
      entityType: 'WORKING_CALENDAR_HOLIDAY',
      entityId: holidayId,
      action: 'WORKING_CALENDAR_HOLIDAY_DELETED',
      performedBy: user.id,
      beforeData: {
        calendarId,
        date: deleted.date.toISOString(),
        name: deleted.name,
      },
    });
    return deleted;
  }

  async getEffectiveCalendar(): Promise<WorkingCalendarConfig> {
    const record = await this.repo.findDefault();
    if (!record) return DEFAULT_CALENDAR;

    const holidays = await this.repo.findHolidays(record.id);
    return {
      workDays: record.workDays as number[],
      workStart: record.workStart,
      workEnd: record.workEnd,
      breakStart: record.breakStart ?? null,
      breakEnd: record.breakEnd ?? null,
      timezone: record.timezone,
      holidays: holidays.map((h) => {
        const d = h.date;
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }),
    };
  }
}
