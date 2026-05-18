export type WorkingCalendar = {
  id: string;
  name: string;
  timezone: string;
  workDays: number[];
  workStart: string;
  workEnd: string;
  breakStart: string | null;
  breakEnd: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { holidays: number };
};

export type HolidayCalendar = {
  id: string;
  workingCalendarId: string;
  date: string;
  name: string;
  isRecurringYearly: boolean;
  createdAt: string;
};

export type WorkingCalendarConfig = {
  workDays: number[];
  workStart: string;
  workEnd: string;
  breakStart: string | null;
  breakEnd: string | null;
  timezone: string;
  holidays: string[];
};

export type CreateHolidayPayload = {
  date: string;
  name: string;
  isRecurringYearly?: boolean;
};
