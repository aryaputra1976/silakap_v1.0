import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateHolidayDto } from './dto/create-holiday.dto';
import type { CreateWorkingCalendarDto } from './dto/create-working-calendar.dto';
import type { UpdateWorkingCalendarDto } from './dto/update-working-calendar.dto';

@Injectable()
export class WorkingCalendarRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.workingCalendar.findMany({
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      include: { _count: { select: { holidays: true } } },
    });
  }

  findById(id: string) {
    return this.prisma.workingCalendar.findUnique({ where: { id } });
  }

  findDefault() {
    return this.prisma.workingCalendar.findFirst({ where: { isDefault: true, isActive: true } });
  }

  async create(dto: CreateWorkingCalendarDto) {
    if (dto.isDefault) {
      await this.prisma.workingCalendar.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.workingCalendar.create({
      data: {
        name: dto.name,
        timezone: dto.timezone ?? 'Asia/Makassar',
        workDays: dto.workDays as Prisma.InputJsonValue,
        workStart: dto.workStart,
        workEnd: dto.workEnd,
        breakStart: dto.breakStart ?? '12:00',
        breakEnd: dto.breakEnd ?? '13:00',
        isDefault: dto.isDefault ?? false,
      },
    });
  }

  async update(id: string, dto: UpdateWorkingCalendarDto) {
    if (dto.isDefault) {
      await this.prisma.workingCalendar.updateMany({
        where: { isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }
    return this.prisma.workingCalendar.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.timezone !== undefined && { timezone: dto.timezone }),
        ...(dto.workDays !== undefined && { workDays: dto.workDays as Prisma.InputJsonValue }),
        ...(dto.workStart !== undefined && { workStart: dto.workStart }),
        ...(dto.workEnd !== undefined && { workEnd: dto.workEnd }),
        ...(dto.breakStart !== undefined && { breakStart: dto.breakStart }),
        ...(dto.breakEnd !== undefined && { breakEnd: dto.breakEnd }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
      },
    });
  }

  findHolidays(calendarId: string, year?: number) {
    const where: Prisma.HolidayCalendarWhereInput = { workingCalendarId: calendarId };
    if (year) {
      const start = new Date(`${year}-01-01`);
      const end = new Date(`${year}-12-31`);
      where.date = { gte: start, lte: end };
    }
    return this.prisma.holidayCalendar.findMany({
      where,
      orderBy: { date: 'asc' },
    });
  }

  addHoliday(calendarId: string, dto: CreateHolidayDto) {
    return this.prisma.holidayCalendar.create({
      data: {
        workingCalendarId: calendarId,
        date: dto.date,
        name: dto.name,
        isRecurringYearly: dto.isRecurringYearly ?? false,
      },
    });
  }

  deleteHoliday(holidayId: string) {
    return this.prisma.holidayCalendar.delete({ where: { id: holidayId } });
  }
}
