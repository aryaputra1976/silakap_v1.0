import { AlertCircle, RefreshCcw } from 'lucide-react';
import {
  ActionButton,
  EmptyState,
  LoadingState,
  StatusBadge,
  Timeline,
} from '@/components/workspace/ui';
import type { DmsAuditTimelineItem } from '@/lib/api/dms';

export function DmsAuditTimeline({
  items,
  loading,
  error,
  onRefresh,
}: {
  items: DmsAuditTimelineItem[];
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
}) {
  if (loading) {
    return <LoadingState label="Memuat audit timeline DMS" />;
  }

  if (error) {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
        {onRefresh ? (
          <ActionButton icon={RefreshCcw} onClick={onRefresh} variant="secondary">
            Muat Ulang Timeline
          </ActionButton>
        ) : null}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Belum ada audit log"
        description="Timeline akan muncul setelah dokumen memiliki aktivitas seperti dibuat, upload, submit, verifikasi, reject, archive, atau hapus."
      />
    );
  }

  return (
    <Timeline
      items={items.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        type: item.action,
        timestamp: item.createdAt,
        actor: item.actor?.name ?? item.performedBy ?? null,
      }))}
    />
  );
}

export function DmsAuditActionBadge({ action }: { action: string }) {
  return <StatusBadge value={action.replace(/_/g, ' ')} tone={tone(action)} />;
}

function tone(action: string) {
  if (action.includes('VERIFIED') || action.includes('ARCHIVED')) {
    return 'success' as const;
  }

  if (action.includes('REJECTED') || action.includes('DELETED')) {
    return 'danger' as const;
  }

  if (action.includes('SUBMITTED') || action.includes('UPLOADED')) {
    return 'info' as const;
  }

  return 'neutral' as const;
}
