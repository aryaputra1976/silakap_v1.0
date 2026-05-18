import {
  CheckCircle2,
  Clock3,
  Inbox,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { StatCard } from '@/components/workspace/ui';
import type { OpdSubmissionSummary } from '@/lib/opd-submissions/types';

export function ServiceWorkbenchStatCards({
  summary,
  verifiedCount = 0,
}: {
  summary: OpdSubmissionSummary | null;
  verifiedCount?: number;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      <StatCard
        label="Masuk"
        value={summary?.menungguVerifikasi ?? 0}
        description="Submitted dan perbaikan masuk"
        icon={Inbox}
        tone="warning"
      />
      <StatCard
        label="Dalam Verifikasi"
        value={summary?.usulanAktif ?? 0}
        description="Sedang diproses PPIK"
        icon={Clock3}
        tone="info"
      />
      <StatCard
        label="Perlu Perbaikan"
        value={summary?.perluPerbaikan ?? 0}
        description="Menunggu perbaikan OPD"
        icon={RefreshCw}
        tone="danger"
      />
      <StatCard
        label="Terverifikasi"
        value={verifiedCount}
        description="Siap diselesaikan"
        icon={ShieldCheck}
        tone="neutral"
      />
      <StatCard
        label="Selesai"
        value={summary?.selesai ?? 0}
        description="Sudah selesai diproses"
        icon={CheckCircle2}
        tone="success"
      />
    </div>
  );
}
