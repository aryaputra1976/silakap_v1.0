import {
  EmptyState,
  formatDateTime,
  LoadingState,
  SectionCard,
  StatusBadge,
  Timeline,
} from '@/components/workspace/ui';
import {
  opdSubmissionStatusLabel,
  opdSubmissionStatusTone,
  type OpdSubmissionTimelineItem,
} from '@/lib/opd-submissions/types';

export function OpdSubmissionTimeline({
  items,
  loading,
  error,
}: {
  items: OpdSubmissionTimelineItem[];
  loading?: boolean;
  error?: string;
}) {
  return (
    <SectionCard
      title="Timeline Status"
      description="Riwayat status resmi yang dapat dilihat OPD."
    >
      {loading ? <LoadingState label="Memuat timeline OPD" /> : null}
      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {error}
        </div>
      ) : null}
      {!loading && !error ? (
        items.length > 0 ? (
          <Timeline
            items={items.map((item) => ({
              id: item.id,
              title: opdSubmissionStatusLabel(item.toStatus),
              description:
                item.publicNote ?? `Status berubah pada ${formatDateTime(item.createdAt)}`,
              type: item.action,
              timestamp: item.createdAt,
            }))}
          />
        ) : (
          <EmptyState title="Belum ada timeline status" />
        )
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {items.slice(-3).map((item) => (
          <StatusBadge
            key={item.id}
            value={opdSubmissionStatusLabel(item.toStatus)}
            tone={opdSubmissionStatusTone(item.toStatus)}
          />
        ))}
      </div>
    </SectionCard>
  );
}
