import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ErrorAlert, FileMeta, SectionCard, StatusBadge } from '@/components/workspace/ui';
import { ApiError } from '@/lib/api/client';
import { workingCalendarApi } from '@/lib/api/working-calendar';
import type { WorkingCalendar } from '@/lib/working-calendar/types';

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function dayLabels(workDays: number[]): string {
  return workDays.map((d) => DAY_NAMES[d] ?? String(d)).join(', ');
}

export function WorkingCalendarSummaryCard() {
  const [calendars, setCalendars] = useState<WorkingCalendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    workingCalendarApi
      .fetchAll()
      .then(setCalendars)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Gagal memuat kalender kerja'))
      .finally(() => setLoading(false));
  }, []);

  const defaultCal = calendars.find((c) => c.isDefault) ?? calendars[0];

  return (
    <SectionCard
      title="Kalender Kerja Aktif"
      description="Konfigurasi jam kerja digunakan untuk perhitungan SLA berbasis jam kerja."
    >
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[#6d7e68]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Memuat kalender kerja…
        </div>
      ) : error ? (
        <ErrorAlert message={error} />
      ) : !defaultCal ? (
        <p className="text-sm text-[#6d7e68]">Belum ada kalender kerja terdaftar.</p>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-[#18343a]">{defaultCal.name}</span>
            {defaultCal.isDefault ? (
              <StatusBadge value="Default" tone="success" />
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            <FileMeta label="Hari Kerja" value={dayLabels(defaultCal.workDays)} />
            <FileMeta label="Jam Kerja" value={`${defaultCal.workStart} – ${defaultCal.workEnd}`} />
            <FileMeta
              label="Istirahat"
              value={
                defaultCal.breakStart && defaultCal.breakEnd
                  ? `${defaultCal.breakStart} – ${defaultCal.breakEnd}`
                  : 'Tidak ada'
              }
            />
            <FileMeta label="Zona Waktu" value={defaultCal.timezone} />
            <FileMeta label="Total Hari Libur" value={defaultCal._count?.holidays ?? 0} />
          </div>
          <p className="text-xs text-[#6d7e68]">
            SLA dihitung dalam jam kerja. Jeda perbaikan OPD diperpanjang sesuai durasi jam kerja
            yang terpakai saat status NEEDS_CORRECTION.
          </p>
        </div>
      )}
    </SectionCard>
  );
}
