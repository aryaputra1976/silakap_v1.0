import { Link } from 'react-router-dom';
import { SectionCard, StatusBadge } from '@/components/workspace/ui';
import type { AnalyticsDashboard } from '@/lib/api/types';

interface Props {
  analytics: AnalyticsDashboard;
}

const SLA_LABEL: Record<string, string> = {
  COMPLETED: 'Selesai',
  OVERDUE: 'Terlambat',
  AT_RISK: 'Berisiko',
  ON_TIME: 'Tepat Waktu',
};

const SLA_TONE: Record<string, 'success' | 'danger' | 'warning' | 'neutral'> = {
  COMPLETED: 'success',
  OVERDUE: 'danger',
  AT_RISK: 'warning',
  ON_TIME: 'success',
};

export function SianalitikLayananSla({ analytics }: Props) {
  const slaSummary = analytics.slaSummary ?? [];
  const overdueItem = slaSummary.find((g) => g.key === 'OVERDUE' || g.label === 'OVERDUE');
  const onTimeItem = slaSummary.find(
    (g) => g.key === 'COMPLETED' || g.key === 'ON_TIME' || g.label === 'COMPLETED',
  );
  const totalTasks =
    analytics.summary.pendingTasks + analytics.summary.completedTasks;

  return (
    <SectionCard title="Status SLA Layanan Kepegawaian" className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-lg border border-rose-100 bg-rose-50 p-3">
          <p className="text-2xl font-bold text-rose-700">
            {overdueItem?.total ?? analytics.summary.slaOverdue ?? 0}
          </p>
          <p className="mt-0.5 text-xs text-rose-600">Tugas Terlambat</p>
        </div>
        <div className="rounded-lg border border-[#9ed9c4] bg-[#e6f6ee] p-3">
          <p className="text-2xl font-bold text-[#087052]">
            {onTimeItem?.total ?? analytics.summary.completedTasks}
          </p>
          <p className="mt-0.5 text-xs text-[#087052]">Selesai / Tepat Waktu</p>
        </div>
      </div>

      {slaSummary.length > 0 ? (
        <div className="flex flex-col gap-2">
          {slaSummary.map((item) => {
            const pct = totalTasks > 0 ? Math.round((item.total / totalTasks) * 100) : 0;
            return (
              <div key={item.key} className="flex items-center justify-between gap-3">
                <StatusBadge
                  value={SLA_LABEL[item.key] ?? item.label}
                  tone={SLA_TONE[item.key] ?? 'neutral'}
                />
                <div className="flex flex-1 items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#087052]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs text-slate-500">{item.total}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-sm text-slate-400">
          {totalTasks > 0
            ? `${totalTasks} tugas aktif`
            : 'Belum ada data SLA.'}
        </p>
      )}

      <div className="border-t border-slate-100 pt-2">
        <Link to="/layanan/sla" className="text-xs font-medium text-[#087052] hover:underline">
          Lihat detail SLA →
        </Link>
      </div>
    </SectionCard>
  );
}
