import {
  Archive,
  CheckCircle2,
  FileText,
  Send,
  UploadCloud,
  XCircle,
} from 'lucide-react';
import { StatCard } from '@/components/workspace/ui';

export interface DmsStatSummary {
  total: number;
  draft: number;
  uploaded: number;
  submitted: number;
  verified: number;
  rejected: number;
  archived: number;
}

export function DmsStatCards({ summary }: { summary: DmsStatSummary }) {
  return (
    <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
      <StatCard
        icon={FileText}
        label="Total"
        value={summary.total}
        tone="neutral"
      />
      <StatCard
        icon={FileText}
        label="Draft"
        value={summary.draft}
        tone="warning"
      />
      <StatCard
        icon={UploadCloud}
        label="Uploaded"
        value={summary.uploaded}
        tone="info"
      />
      <StatCard
        icon={Send}
        label="Submitted"
        value={summary.submitted}
        tone="info"
      />
      <StatCard
        icon={CheckCircle2}
        label="Verified"
        value={summary.verified}
        tone="success"
      />
      <StatCard
        icon={XCircle}
        label="Rejected"
        value={summary.rejected + summary.archived}
        description={`Rejected ${summary.rejected} · Archived ${summary.archived}`}
        tone={summary.rejected > 0 ? 'danger' : 'neutral'}
      />
    </section>
  );
}

export function DmsArchiveStatCard({ value }: { value: number }) {
  return (
    <StatCard
      icon={Archive}
      label="Archived"
      value={value}
      tone="success"
    />
  );
}