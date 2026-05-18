import { Timeline } from '@/components/workspace/ui';
import type { OpdTimelineItem } from '@/lib/opd/opd-portal-data';

export function OpdStatusTimeline({ items }: { items: OpdTimelineItem[] }) {
  return (
    <Timeline
      empty="Belum ada aktivitas OPD"
      items={items.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        type: item.status,
        timestamp: item.timestamp,
        actor: 'OPD',
      }))}
    />
  );
}
