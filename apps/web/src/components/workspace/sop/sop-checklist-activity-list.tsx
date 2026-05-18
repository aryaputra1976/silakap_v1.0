import { Loader2 } from 'lucide-react';
import { StatusBadge } from '@/components/workspace/ui';
import type { ChecklistDashboardActivity } from '@/lib/api/sop-checklists';

// ─── Action label map ────────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  CREATED: 'Dibuat',
  ITEM_UPDATED: 'Item diperbarui',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
};

function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

function actionTone(
  action: string,
): 'success' | 'danger' | 'warning' | 'info' | 'neutral' {
  if (action === 'APPROVED') return 'success';
  if (action === 'REJECTED') return 'danger';
  if (action === 'ITEM_UPDATED') return 'info';
  return 'neutral';
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface SopChecklistActivityListProps {
  activities: ChecklistDashboardActivity[];
  loading?: boolean;
  error?: string | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SopChecklistActivityList({
  activities,
  loading,
  error,
}: SopChecklistActivityListProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Memuat aktivitas...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
        {error}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Belum ada aktivitas checklist.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border">
      {activities.map((act) => (
        <div key={act.id} className="flex items-start gap-3 py-3">
          <div className="mt-0.5 shrink-0">
            <StatusBadge value={actionLabel(act.action)} tone={actionTone(act.action)} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-800">
              {act.sopCode}
            </p>
            <p className="text-xs text-muted-foreground">
              {act.moduleKey} · {act.entityType}
            </p>
            {act.fromStatus && act.toStatus ? (
              <p className="mt-0.5 text-xs text-zinc-500">
                {act.fromStatus} → {act.toStatus}
              </p>
            ) : null}
            {act.notes ? (
              <p className="mt-0.5 truncate text-xs italic text-muted-foreground">
                {act.notes}
              </p>
            ) : null}
          </div>

          <span className="shrink-0 text-xs text-muted-foreground">
            {relativeTime(act.createdAt)}
          </span>
        </div>
      ))}
    </div>
  );
}
