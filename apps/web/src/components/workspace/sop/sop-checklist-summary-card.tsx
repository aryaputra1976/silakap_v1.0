import { useEffect, useState } from 'react';
import { ClipboardCheck, Loader2 } from 'lucide-react';
import { StatusBadge } from '@/components/workspace/ui';
import {
  sopChecklistsApi,
  type SopChecklistInstanceApi,
  type SopChecklistOverallStatusApi,
} from '@/lib/api/sop-checklists';
import { getChecklistTemplatesByModule } from '@/lib/sop-checklist/checklist-policy';
import type { SopModuleKey } from '@/lib/dms/sop-taxonomy';

// ─── Props ────────────────────────────────────────────────────────────────────

interface SopChecklistSummaryCardProps {
  /** Filter instances by module */
  moduleKey: SopModuleKey;
  /** Filter instances by entity (optional) */
  entityType?: string;
  entityId?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SopChecklistSummaryCard({
  moduleKey,
  entityType,
  entityId,
}: SopChecklistSummaryCardProps) {
  const [instances, setInstances] = useState<SopChecklistInstanceApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const templates = getChecklistTemplatesByModule(moduleKey);

  useEffect(() => {
    setLoading(true);
    setError(null);
    sopChecklistsApi
      .listInstances({
        moduleKey,
        entityType,
        entityId,
      })
      .then(setInstances)
      .catch(() => setError('Gagal memuat ringkasan checklist'))
      .finally(() => setLoading(false));
   
  }, [moduleKey, entityType, entityId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Memuat ringkasan checklist...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
        {error}
      </div>
    );
  }

  const rows = templates.map((tpl) => {
    const inst = instances.find((i) => i.sopCode === tpl.sopCode);
    return { tpl, inst };
  });

  const allApproved = rows.every((r) => r.inst?.status === 'APPROVED');
  const anyRejected = rows.some((r) => r.inst?.status === 'REJECTED');

  const overallTone = allApproved ? 'success' : anyRejected ? 'danger' : 'neutral';
  const overallLabel = allApproved
    ? 'Semua Disetujui'
    : anyRejected
      ? 'Ada yang Ditolak'
      : 'Belum Lengkap';

  return (
    <div className="rounded-lg border border-border bg-background">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
          <ClipboardCheck className="h-4 w-4 text-[#4a9b6f]" />
          Ringkasan Checklist SOP
        </div>
        <StatusBadge value={overallLabel} tone={overallTone} />
      </div>

      <div className="divide-y divide-border">
        {rows.map(({ tpl, inst }) => (
          <SummaryRow key={tpl.sopCode} title={tpl.title} sopCode={tpl.sopCode} inst={inst} />
        ))}
      </div>
    </div>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function SummaryRow({
  title,
  sopCode,
  inst,
}: {
  title: string;
  sopCode: string;
  inst: SopChecklistInstanceApi | undefined;
}) {
  const status: SopChecklistOverallStatusApi = inst?.status ?? 'DRAFT';

  const tone =
    status === 'APPROVED'
      ? 'success'
      : status === 'REJECTED'
        ? 'danger'
        : status === 'IN_REVIEW'
          ? 'warning'
          : 'neutral';

  const statusLabel: Record<SopChecklistOverallStatusApi, string> = {
    DRAFT: 'Draft',
    IN_REVIEW: 'Dalam Review',
    APPROVED: 'Disetujui',
    REJECTED: 'Ditolak',
  };

  const progress = inst?.progress ?? 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-800">{title}</p>
        <p className="text-xs text-muted-foreground">{sopCode}</p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-3">
        {inst ? (
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-[#4a9b6f] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{progress}%</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Belum dimulai</span>
        )}

        <StatusBadge value={statusLabel[status]} tone={tone} />
      </div>
    </div>
  );
}
