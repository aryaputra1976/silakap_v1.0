export type WorkingCalendarConfig = {
  workDays: number[];       // [1,2,3,4,5] — Mon=1 … Fri=5, Sun=0 (JS getDay())
  workStart: string;        // "HH:mm"
  workEnd: string;          // "HH:mm"
  breakStart: string | null;
  breakEnd: string | null;
  timezone: string;         // informational; server must run in this TZ
  holidays: string[];       // ["YYYY-MM-DD"]
};

export const DEFAULT_CALENDAR: WorkingCalendarConfig = {
  workDays: [1, 2, 3, 4, 5],
  workStart: '08:00',
  workEnd: '16:00',
  breakStart: '12:00',
  breakEnd: '13:00',
  timezone: 'Asia/Makassar',
  holidays: [],
};

function toMin(hhmm: string): number {
  const parts = hhmm.split(':');
  return parseInt(parts[0] ?? '0', 10) * 60 + parseInt(parts[1] ?? '0', 10);
}

function workMinPerDay(cal: WorkingCalendarConfig): number {
  const total = toMin(cal.workEnd) - toMin(cal.workStart);
  const brk =
    cal.breakStart && cal.breakEnd ? toMin(cal.breakEnd) - toMin(cal.breakStart) : 0;
  return Math.max(0, total - brk);
}

function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isWeekend(date: Date, workDays: number[]): boolean {
  return !workDays.includes(date.getDay());
}

export function isHoliday(date: Date, holidays: string[]): boolean {
  return holidays.includes(dateKey(date));
}

export function isWorkingDay(date: Date, cal: WorkingCalendarConfig): boolean {
  return !isWeekend(date, cal.workDays) && !isHoliday(date, cal.holidays);
}

function workingMinutesBetween(start: Date, end: Date, cal: WorkingCalendarConfig): number {
  if (end <= start) return 0;

  const wStartMin = toMin(cal.workStart);
  const wEndMin = toMin(cal.workEnd);
  const brkStartMin = cal.breakStart ? toMin(cal.breakStart) : wEndMin;
  const brkEndMin = cal.breakEnd ? toMin(cal.breakEnd) : wEndMin;

  let totalMin = 0;

  const dayStart = new Date(start);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(end);
  dayEnd.setHours(0, 0, 0, 0);

  const cursor = new Date(dayStart);
  while (cursor <= dayEnd) {
    if (isWorkingDay(cursor, cal)) {
      const dayWStart = new Date(cursor);
      dayWStart.setHours(Math.floor(wStartMin / 60), wStartMin % 60, 0, 0);
      const dayWEnd = new Date(cursor);
      dayWEnd.setHours(Math.floor(wEndMin / 60), wEndMin % 60, 0, 0);

      const effStart = start > dayWStart ? start : dayWStart;
      const effEnd = end < dayWEnd ? end : dayWEnd;

      if (effStart < effEnd) {
        let minInDay = (effEnd.getTime() - effStart.getTime()) / 60000;

        if (cal.breakStart && cal.breakEnd) {
          const dayBrkStart = new Date(cursor);
          dayBrkStart.setHours(Math.floor(brkStartMin / 60), brkStartMin % 60, 0, 0);
          const dayBrkEnd = new Date(cursor);
          dayBrkEnd.setHours(Math.floor(brkEndMin / 60), brkEndMin % 60, 0, 0);

          const brkEffStart = effStart > dayBrkStart ? effStart : dayBrkStart;
          const brkEffEnd = effEnd < dayBrkEnd ? effEnd : dayBrkEnd;

          if (brkEffStart < brkEffEnd) {
            minInDay -= (brkEffEnd.getTime() - brkEffStart.getTime()) / 60000;
          }
        }

        totalMin += Math.max(0, minInDay);
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return totalMin;
}

export function calculateBusinessElapsedHours(
  start: Date,
  end: Date,
  cal: WorkingCalendarConfig,
): number {
  return workingMinutesBetween(start, end, cal) / 60;
}

export function calculateBusinessRemainingHours(
  now: Date,
  due: Date,
  cal: WorkingCalendarConfig,
): number {
  if (due <= now) return 0;
  return workingMinutesBetween(now, due, cal) / 60;
}

export function normalizeToWorkingTime(date: Date, cal: WorkingCalendarConfig): Date {
  const wStartMin = toMin(cal.workStart);
  const wEndMin = toMin(cal.workEnd);
  const brkStartMin = cal.breakStart ? toMin(cal.breakStart) : wEndMin;
  const brkEndMin = cal.breakEnd ? toMin(cal.breakEnd) : wEndMin;

  const cursor = new Date(date);

  while (!isWorkingDay(cursor, cal)) {
    cursor.setDate(cursor.getDate() + 1);
    cursor.setHours(Math.floor(wStartMin / 60), wStartMin % 60, 0, 0);
  }

  const curMin = cursor.getHours() * 60 + cursor.getMinutes();

  if (curMin < wStartMin) {
    cursor.setHours(Math.floor(wStartMin / 60), wStartMin % 60, 0, 0);
  } else if (curMin >= wEndMin) {
    cursor.setDate(cursor.getDate() + 1);
    cursor.setHours(Math.floor(wStartMin / 60), wStartMin % 60, 0, 0);
    while (!isWorkingDay(cursor, cal)) {
      cursor.setDate(cursor.getDate() + 1);
    }
  } else if (curMin >= brkStartMin && curMin < brkEndMin) {
    cursor.setHours(Math.floor(brkEndMin / 60), brkEndMin % 60, 0, 0);
  }

  return cursor;
}

export function addBusinessHours(
  start: Date,
  hours: number,
  cal: WorkingCalendarConfig,
): Date {
  const wStartMin = toMin(cal.workStart);
  const wEndMin = toMin(cal.workEnd);
  const brkStartMin = cal.breakStart ? toMin(cal.breakStart) : wEndMin;
  const brkEndMin = cal.breakEnd ? toMin(cal.breakEnd) : wEndMin;
  const breakDur = cal.breakStart && cal.breakEnd ? brkEndMin - brkStartMin : 0;

  let remaining = hours * 60;
  const cursor = normalizeToWorkingTime(new Date(start), cal);

  while (remaining > 0) {
    if (!isWorkingDay(cursor, cal)) {
      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(Math.floor(wStartMin / 60), wStartMin % 60, 0, 0);
      continue;
    }

    const curMin = cursor.getHours() * 60 + cursor.getMinutes();

    if (curMin >= brkStartMin && curMin < brkEndMin) {
      cursor.setHours(Math.floor(brkEndMin / 60), brkEndMin % 60, 0, 0);
      continue;
    }

    let availToEnd: number;
    if (curMin >= brkEndMin) {
      availToEnd = wEndMin - curMin;
    } else {
      availToEnd = (brkStartMin - curMin) + (wEndMin - brkEndMin);
    }
    availToEnd = Math.max(0, availToEnd);

    if (remaining <= availToEnd) {
      let minutesToAdd = remaining;
      if (curMin < brkStartMin && curMin + minutesToAdd > brkStartMin) {
        minutesToAdd += breakDur;
      }
      cursor.setTime(cursor.getTime() + minutesToAdd * 60000);
      remaining = 0;
    } else {
      remaining -= availToEnd;
      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(Math.floor(wStartMin / 60), wStartMin % 60, 0, 0);
      while (!isWorkingDay(cursor, cal)) {
        cursor.setDate(cursor.getDate() + 1);
      }
    }
  }

  return cursor;
}
