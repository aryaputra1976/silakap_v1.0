import {
  Archive,
  BarChart3,
  CheckCircle2,
  FileText,
  UploadCloud,
} from 'lucide-react';
import { StatCard } from '@/components/workspace/ui';
import {
  type DmsDashboardSummary,
  type DmsDocumentStatus,
} from '@/lib/api/dms';

type DmsDashboardSummarySectionProps = {
  summary: DmsDashboardSummary | null;
};

export function DmsDashboardSummarySection({
  summary,
}: DmsDashboardSummarySectionProps) {
  const statusMap = buildStatusMap(summary);

  return (
    <>
      <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          icon={FileText}
          label="Total Dokumen"
          value={summary?.total ?? 0}
          tone="info"
        />
        <StatCard
          icon={FileText}
          label="Draft"
          value={statusMap.get('DRAFT') ?? 0}
          tone="warning"
        />
        <StatCard
          icon={UploadCloud}
          label="Uploaded"
          value={statusMap.get('UPLOADED') ?? 0}
          tone="info"
        />
        <StatCard
          icon={BarChart3}
          label="Submitted"
          value={summary?.waitingVerification ?? 0}
          description="Menunggu verifikasi"
          tone="info"
        />
        <StatCard
          icon={CheckCircle2}
          label="Verified / Archived"
          value={summary?.verifiedOrArchived ?? 0}
          tone="success"
        />
        <StatCard
          icon={Archive}
          label="Tanpa File"
          value={summary?.withoutFile ?? 0}
          tone={(summary?.withoutFile ?? 0) > 0 ? 'warning' : 'success'}
        />
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <StatCard
          icon={UploadCloud}
          label="Menunggu Verifikasi"
          value={summary?.waitingVerification ?? 0}
          description="Dokumen SUBMITTED yang perlu ditinjau."
          tone="info"
        />
        <StatCard
          icon={FileText}
          label="Belum Ada File"
          value={summary?.withoutFile ?? 0}
          description="Metadata sudah dibuat, file belum diunggah."
          tone={(summary?.withoutFile ?? 0) > 0 ? 'warning' : 'success'}
        />
        <StatCard
          icon={Archive}
          label="Ditolak"
          value={summary?.rejected ?? 0}
          description="Dokumen yang perlu diperbaiki."
          tone={(summary?.rejected ?? 0) > 0 ? 'danger' : 'neutral'}
        />
      </section>
    </>
  );
}

function buildStatusMap(
  summary: DmsDashboardSummary | null,
): Map<DmsDocumentStatus, number> {
  const map = new Map<DmsDocumentStatus, number>();

  for (const item of summary?.byStatus ?? []) {
    map.set(item.status, item.total);
  }

  return map;
}
