import { apiClient } from './client';
import type {
  CreateHolidayPayload,
  HolidayCalendar,
  WorkingCalendar,
  WorkingCalendarConfig,
} from '@/lib/working-calendar/types';

export const workingCalendarApi = {
  fetchAll(): Promise<WorkingCalendar[]> {
    return apiClient.get<WorkingCalendar[]>('/working-calendar');
  },

  fetchById(id: string): Promise<WorkingCalendar> {
    return apiClient.get<WorkingCalendar>(`/working-calendar/${id}`);
  },

  fetchEffective(): Promise<WorkingCalendarConfig> {
    return apiClient.get<WorkingCalendarConfig>('/working-calendar/effective');
  },

  fetchHolidays(calendarId: string, year?: number): Promise<HolidayCalendar[]> {
    const q = year ? `?year=${year}` : '';
    return apiClient.get<HolidayCalendar[]>(`/working-calendar/${calendarId}/holidays${q}`);
  },

  addHoliday(calendarId: string, payload: CreateHolidayPayload): Promise<HolidayCalendar> {
    return apiClient.post<HolidayCalendar>(`/working-calendar/${calendarId}/holidays`, payload);
  },

  deleteHoliday(calendarId: string, holidayId: string): Promise<void> {
    return apiClient.delete<void>(`/working-calendar/${calendarId}/holidays/${holidayId}`);
  },
};
