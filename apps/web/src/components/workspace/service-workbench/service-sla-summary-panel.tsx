import { AlertTriangle, CheckCircle2, Clock3, PauseCircle } from 'lucide-react';
import { StatCard } from '@/components/workspace/ui';
import type { OpdSubmissionSlaSummary } from '@/lib/opd-submissions/types';

export function ServiceSlaSummaryPanel({
  summary,
}: {
  summary: OpdSubmissionSlaSummary | null;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="On Track"
        value={summary?.onTrack ?? 0}
        description="Masih dalam target SLA"
        icon={CheckCircle2}
        tone="success"
      />
      <StatCard
        label="Due Soon"
        value={summary?.dueSoon ?? 0}
        description="Sisa waktu 24 jam atau kurang"
        icon={Clock3}
        tone="warning"
      />
      <StatCard
        label="Overdue"
        value={summary?.overdue ?? 0}
        description="Melewati target SLA"
        icon={AlertTriangle}
        tone="danger"
      />
      <StatCard
        label="Paused Correction"
        value={summary?.pausedForCorrection ?? 0}
        description="Menunggu perbaikan OPD"
        icon={PauseCircle}
        tone="info"
      />
    </div>
  );
}
