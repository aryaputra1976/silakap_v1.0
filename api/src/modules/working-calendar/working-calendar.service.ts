import { Injectable, NotFoundException } from '@nestjs/common';
import { DEFAULT_CALENDAR, WorkingCalendarConfig } from './business-time.util';
import type { CreateHolidayDto } from './dto/create-holiday.dto';
import type { CreateWorkingCalendarDto } from './dto/create-working-calendar.dto';
import type { QueryHolidayDto } from './dto/query-holiday.dto';
import type { UpdateWorkingCalendarDto } from './dto/update-working-calendar.dto';
import { WorkingCalendarRepository } from './working-calendar.repository';

@Injectable()
export class WorkingCalendarService {
  constructor(private readonly repo: WorkingCalendarRepository) {}

  findAll() {
    return this.repo.findAll();
  }

  async findById(id: string) {
    const record = await this.repo.findById(id);
    if (!record) throw new NotFoundException(`WorkingCalendar ${id} not found`);
    return record;
  }

  create(dto: CreateWorkingCalendarDto) {
    return this.repo.create(dto);
  }

  async update(id: string, dto: UpdateWorkingCalendarDto) {
    await this.findById(id);
    return this.repo.update(id, dto);
  }

  async getHolidays(calendarId: string, query: QueryHolidayDto) {
    await this.findById(calendarId);
    return this.repo.findHolidays(calendarId, query.year);
  }

  async addHoliday(calendarId: string, dto: CreateHolidayDto) {
    await this.findById(calendarId);
    return this.repo.addHoliday(calendarId, dto);
  }

  async deleteHoliday(calendarId: string, holidayId: string) {
    await this.findById(calendarId);
    return this.repo.deleteHoliday(holidayId);
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
