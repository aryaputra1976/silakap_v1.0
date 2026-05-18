import { SectionCard, Timeline } from '@/components/workspace/ui';
import {
  opdSubmissionStatusLabel,
  type OpdSubmissionTimelineItem,
} from '@/lib/opd-submissions/types';

export function ServiceStatusTimeline({
  items,
}: {
  items: OpdSubmissionTimelineItem[];
}) {
  return (
    <SectionCard
      title="Timeline Status Formal"
      description="Riwayat status layanan, terpisah dari audit log teknis."
    >
      <Timeline
        empty="Belum ada timeline status."
        items={items.map((item) => ({
          id: item.id,
          title: opdSubmissionStatusLabel(item.toStatus),
          description: item.note ?? item.publicNote,
          type: item.actorRole ?? item.action,
          timestamp: item.createdAt,
          actor: item.actorId,
        }))}
      />
    </SectionCard>
  );
}
