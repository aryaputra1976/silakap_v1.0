import { Loader2 } from 'lucide-react';
import { StatusBadge } from '@/components/workspace/ui';
import {
  governanceActionLabel,
  governanceActionTone,
} from '@/lib/sop-governance/types';
import type { SopGovernanceChangeLog } from '@/lib/sop-governance/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

interface SopGovernanceChangeLogListProps {
  logs: SopGovernanceChangeLog[];
  loading?: boolean;
  error?: string | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SopGovernanceChangeLogList({
  logs,
  loading,
  error,
}: SopGovernanceChangeLogListProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Memuat riwayat perubahan...
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

  if (logs.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Belum ada riwayat perubahan.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border">
      {logs.map((log) => (
        <div key={log.id} className="flex items-start gap-3 py-3">
          <div className="mt-0.5 shrink-0">
            <StatusBadge
              value={governanceActionLabel(log.action)}
              tone={governanceActionTone(log.action)}
            />
          </div>

          <div className="min-w-0 flex-1">
            {log.sopCode ? (
              <p className="truncate font-mono text-sm font-semibold text-zinc-800">
                {log.sopCode}
                {log.title ? (
                  <span className="ml-1 font-sans font-normal text-zinc-500">
                    — {log.title}
                  </span>
                ) : null}
              </p>
            ) : null}

            {log.actorRole ? (
              <p className="text-xs text-muted-foreground">{log.actorRole}</p>
            ) : null}

            {log.note ? (
              <p className="mt-0.5 truncate text-xs italic text-muted-foreground">
                {log.note}
              </p>
            ) : null}
          </div>

          <span className="shrink-0 text-xs text-muted-foreground">
            {relativeTime(log.createdAt)}
          </span>
        </div>
      ))}
    </div>
  );
}
