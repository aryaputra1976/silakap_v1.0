import { useAuth } from '@/lib/auth/session';
import { getPrimaryRole } from '@/lib/rbac/roles';
import { PageHeader, StatusBadge } from '@/components/workspace/ui';
import { HolidayCalendarPanel } from '@/components/workspace/working-calendar/holiday-calendar-panel';
import { WorkingCalendarSummaryCard } from '@/components/workspace/working-calendar/working-calendar-summary-card';

export function WorkingCalendarPage() {
  const { user } = useAuth();
  const role = getPrimaryRole(user?.roles);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Kalender Hari Kerja"
        description="Konfigurasi jam kerja dan hari libur untuk perhitungan SLA berbasis jam kerja."
        meta={
          <>
            <StatusBadge value="SLA berbasis jam kerja" tone="success" />
            <StatusBadge value="DUE_SOON ≤ 8 jam kerja" tone="warning" />
          </>
        }
      />
      <WorkingCalendarSummaryCard />
      <HolidayCalendarPanel role={role} />
    </div>
  );
}
