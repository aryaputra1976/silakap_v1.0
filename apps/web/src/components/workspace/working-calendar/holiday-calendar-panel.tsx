import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import {
  ActionButton,
  DataTable,
  ErrorAlert,
  SectionCard,
} from '@/components/workspace/ui';
import { ApiError } from '@/lib/api/client';
import { workingCalendarApi } from '@/lib/api/working-calendar';
import type { HolidayCalendar, WorkingCalendar } from '@/lib/working-calendar/types';
import type { AppRole } from '@/lib/rbac/roles';

const MANAGE_ROLES: AppRole[] = ['SUPER_ADMIN', 'ADMIN_BKPSDM'];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function HolidayCalendarPanel({ role }: { role: AppRole }) {
  const [calendars, setCalendars] = useState<WorkingCalendar[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [holidays, setHolidays] = useState<HolidayCalendar[]>([]);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [loading, setLoading] = useState(false);
  const [calLoading, setCalLoading] = useState(true);
  const [error, setError] = useState('');

  // New holiday form
  const [newDate, setNewDate] = useState('');
  const [newName, setNewName] = useState('');
  const [newRecurring, setNewRecurring] = useState(false);
  const [adding, setAdding] = useState(false);

  const canManage = MANAGE_ROLES.includes(role);

  useEffect(() => {
    workingCalendarApi
      .fetchAll()
      .then((cals) => {
        setCalendars(cals);
        const def = cals.find((c) => c.isDefault) ?? cals[0];
        if (def) setSelectedId(def.id);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Gagal memuat kalender'))
      .finally(() => setCalLoading(false));
  }, []);

  const loadHolidays = useCallback(async () => {
    if (!selectedId) return;
    setLoading(true);
    setError('');
    try {
      const y = parseInt(year, 10);
      setHolidays(await workingCalendarApi.fetchHolidays(selectedId, isNaN(y) ? undefined : y));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Gagal memuat hari libur');
    } finally {
      setLoading(false);
    }
  }, [selectedId, year]);

  useEffect(() => {
    void loadHolidays();
  }, [loadHolidays]);

  async function handleAdd() {
    if (!newDate || !newName || !selectedId) return;
    setAdding(true);
    setError('');
    try {
      const h = await workingCalendarApi.addHoliday(selectedId, {
        date: newDate,
        name: newName,
        isRecurringYearly: newRecurring,
      });
      setHolidays((prev) => [...prev, h].sort((a, b) => a.date.localeCompare(b.date)));
      setNewDate('');
      setNewName('');
      setNewRecurring(false);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Gagal menambah hari libur');
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(calendarId: string, holidayId: string) {
    setError('');
    try {
      await workingCalendarApi.deleteHoliday(calendarId, holidayId);
      setHolidays((prev) => prev.filter((h) => h.id !== holidayId));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Gagal menghapus hari libur');
    }
  }

  return (
    <SectionCard
      title="Daftar Hari Libur"
      description="Hari libur nasional dan daerah yang dikecualikan dari perhitungan SLA."
    >
      {error ? <ErrorAlert message={error} /> : null}

      <div className="mb-4 flex flex-wrap gap-3">
        {calLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-[#6d7e68]" />
        ) : (
          <select
            className="h-10 rounded-md border border-[#c9d9c4] bg-white px-3 text-sm text-[#173c36] outline-none focus:border-[#0f766e]"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {calendars.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
        <input
          className="h-10 w-28 rounded-md border border-[#c9d9c4] bg-white px-3 text-sm text-[#173c36] outline-none focus:border-[#0f766e]"
          placeholder="Tahun"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        />
      </div>

      {canManage ? (
        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-[#d8e5d3] bg-[#f9fdf6] p-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#6d7e68]">Tanggal</label>
            <input
              type="date"
              className="h-9 rounded-md border border-[#c9d9c4] bg-white px-2 text-sm text-[#173c36] outline-none focus:border-[#0f766e]"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#6d7e68]">Nama Hari Libur</label>
            <input
              className="h-9 w-52 rounded-md border border-[#c9d9c4] bg-white px-2 text-sm text-[#173c36] outline-none focus:border-[#0f766e]"
              placeholder="cth. Hari Kemerdekaan"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-[#51614c]">
            <input
              type="checkbox"
              checked={newRecurring}
              onChange={(e) => setNewRecurring(e.target.checked)}
            />
            Berulang tiap tahun
          </label>
          <ActionButton
            icon={adding ? Loader2 : Plus}
            disabled={adding || !newDate || !newName}
            onClick={() => void handleAdd()}
          >
            Tambah
          </ActionButton>
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[#6d7e68]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Memuat hari libur…
        </div>
      ) : (
        <DataTable
          columns={[
            { key: 'date', header: 'Tanggal', render: (h: HolidayCalendar) => formatDate(h.date) },
            { key: 'name', header: 'Nama', render: (h: HolidayCalendar) => h.name },
            {
              key: 'recurring',
              header: 'Berulang',
              render: (h: HolidayCalendar) => (h.isRecurringYearly ? 'Ya' : '-'),
            },
            ...(canManage
              ? [
                  {
                    key: 'actions',
                    header: '',
                    render: (h: HolidayCalendar) => (
                      <button
                        className="text-red-500 hover:text-red-700"
                        onClick={() => void handleDelete(h.workingCalendarId, h.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ),
                  },
                ]
              : []),
          ]}
          items={holidays}
          empty={`Tidak ada hari libur terdaftar untuk tahun ${year}.`}
          rowKey={(h) => h.id}
        />
      )}
    </SectionCard>
  );
}
