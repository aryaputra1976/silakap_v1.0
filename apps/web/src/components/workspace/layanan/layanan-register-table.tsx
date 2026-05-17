import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import type { SiapTask } from '@/lib/api/types';
import {
  ActionButton,
  DataTable,
  formatDate,
  WorkflowBadge,
  StatusBadge,
} from '@/components/workspace/ui';
import { getTaskSlaStatus, SLA_STATUS_LABEL, SLA_STATUS_TONE } from '@/lib/layanan/layanan-data';

interface LayananRegisterTableProps {
  items: SiapTask[];
  loading?: boolean;
  empty?: string;
}

export function LayananRegisterTable({ items, loading, empty }: LayananRegisterTableProps) {
  if (loading) return null;

  return (
    <DataTable
      items={items}
      rowKey={(item) => item.id}
      empty={empty ?? 'Belum ada permohonan layanan'}
      columns={[
        {
          key: 'case',
          header: 'Nomor Case',
          render: (item) => (
            <Link
              className="font-semibold text-zinc-950 underline-offset-4 hover:underline"
              to={`/siap/tasks`}
            >
              {item.case?.caseNumber ?? item.caseId}
            </Link>
          ),
        },
        {
          key: 'asn',
          header: 'Nama ASN',
          render: (item) => (
            <span className="font-medium text-zinc-900">{item.case?.asn?.nama ?? '—'}</span>
          ),
        },
        {
          key: 'type',
          header: 'Jenis Layanan',
          render: (item) => (
            <span className="text-sm text-zinc-700">{item.taskType}</span>
          ),
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
          key: 'due',
          header: 'Batas SLA',
          render: (item) => formatDate(item.dueDate),
        },
        {
          key: 'state',
          header: 'State',
          render: (item) => <WorkflowBadge value={item.case?.currentState ?? item.status} />,
        },
        {
          key: 'action',
          header: '',
          render: (item) => (
            <Link to={`/siap/tasks`} state={{ taskId: item.id }}>
              <ActionButton icon={Eye} variant="secondary">
                Detail
              </ActionButton>
            </Link>
          ),
        },
      ]}
    />
  );
}
