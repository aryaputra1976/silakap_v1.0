import type { SiapTask } from '@/lib/api/types';
import { DataTable, formatDate, StatusBadge, WorkflowBadge } from '@/components/workspace/ui';
import { getTaskSlaStatus, SLA_STATUS_LABEL, SLA_STATUS_TONE } from '@/lib/layanan/layanan-data';

interface LayananSlaTableProps {
  items: SiapTask[];
  empty?: string;
}

function dueDateCountdown(dueDate: string | null): string {
  if (!dueDate) return '—';
  const due = new Date(dueDate);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `${Math.abs(diffDays)} hari terlambat`;
  if (diffDays === 0) return 'Jatuh tempo hari ini';
  return `${diffDays} hari lagi`;
}

export function LayananSlaTable({ items, empty }: LayananSlaTableProps) {
  return (
    <DataTable
      items={items}
      rowKey={(item) => item.id}
      empty={empty ?? 'Tidak ada data SLA'}
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
          key: 'sla',
          header: 'Status SLA',
          render: (item) => {
            const sla = getTaskSlaStatus(item.status, item.dueDate);
            return (
              <StatusBadge
                value={SLA_STATUS_LABEL[sla]}
                tone={SLA_STATUS_TONE[sla] as 'success' | 'warning' | 'neutral' | 'info'}
              />
            );
          },
        },
        {
          key: 'countdown',
          header: 'Sisa Waktu',
          render: (item) => (
            <span className="text-sm text-zinc-700">{dueDateCountdown(item.dueDate)}</span>
          ),
        },
        {
          key: 'due',
          header: 'Batas SLA',
          render: (item) => formatDate(item.dueDate),
        },
        {
          key: 'state',
          header: 'State',
          render: (item) => <WorkflowBadge value={item.case?.currentState ?? item.status} />,
        },
      ]}
    />
  );
}
