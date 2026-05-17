import type { SiapTask } from '@/lib/api/types';
import { DataTable, formatDate, StatusBadge } from '@/components/workspace/ui';

interface LayananDelayPanelProps {
  items: SiapTask[];
  empty?: string;
}

function daysOverdue(dueDate: string | null): number {
  if (!dueDate) return 0;
  const due = new Date(dueDate);
  const now = new Date();
  const diffMs = now.getTime() - due.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function LayananDelayPanel({ items, empty }: LayananDelayPanelProps) {
  return (
    <DataTable
      items={items}
      rowKey={(item) => item.id}
      empty={empty ?? 'Tidak ada keterlambatan layanan'}
      columns={[
        {
          key: 'case',
          header: 'Case / ASN',
          render: (item) => (
            <div>
              <p className="font-semibold text-zinc-900">{item.case?.caseNumber ?? item.caseId}</p>
              <p className="text-xs text-zinc-500">{item.case?.asn?.nama ?? '—'}</p>
            </div>
          ),
        },
        {
          key: 'type',
          header: 'Jenis Layanan',
          render: (item) => <span className="text-sm text-zinc-700">{item.taskType}</span>,
        },
        {
          key: 'due',
          header: 'Batas SLA',
          render: (item) => formatDate(item.dueDate),
        },
        {
          key: 'overdue',
          header: 'Keterlambatan',
          render: (item) => {
            const days = daysOverdue(item.dueDate);
            return (
              <span className={`text-sm font-semibold ${days > 0 ? 'text-red-600' : 'text-zinc-500'}`}>
                {days > 0 ? `+${days} hari` : '—'}
              </span>
            );
          },
        },
        {
          key: 'status',
          header: 'Status',
          render: (item) => <StatusBadge value={item.status} />,
        },
        {
          key: 'priority',
          header: 'Prioritas',
          render: (item) => <StatusBadge value={item.priority} tone="warning" />,
        },
      ]}
    />
  );
}
