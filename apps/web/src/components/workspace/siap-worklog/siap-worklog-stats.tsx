import { CheckCircle2, Edit3, FileText, Send } from 'lucide-react';
import { StatCard } from '@/components/workspace/ui';

export interface SiapWorklogSummary {
  total: number;
  draft: number;
  submitted: number;
  revision: number;
  approved: number;
}

export function SiapWorklogStats({
  summary,
}: {
  summary: SiapWorklogSummary;
}) {
  return (
    <section className="grid gap-3 md:grid-cols-4">
      <StatCard
        icon={FileText}
        label="Draft"
        value={summary.draft}
        tone="warning"
      />
      <StatCard
        icon={Send}
        label="Menunggu Tinjauan"
        value={summary.submitted}
        tone="info"
      />
      <StatCard
        icon={Edit3}
        label="Perlu Perbaikan"
        value={summary.revision}
        tone="danger"
      />
      <StatCard
        icon={CheckCircle2}
        label="Disetujui"
        value={summary.approved}
        tone="success"
      />
    </section>
  );
}
