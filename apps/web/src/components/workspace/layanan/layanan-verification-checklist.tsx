import { CheckCircle2, Circle, XCircle } from 'lucide-react';
import type { SiapTask } from '@/lib/api/types';
import { DataTable, formatDate, StatusBadge, WorkflowBadge } from '@/components/workspace/ui';

interface LayananVerificationChecklistProps {
  items: SiapTask[];
  empty?: string;
}

function VerificationIcon({ state }: { state: string }) {
  if (state === 'COMPLETED') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (state === 'CANCELLED') return <XCircle className="h-4 w-4 text-red-500" />;
  return <Circle className="h-4 w-4 text-zinc-400" />;
}

export function LayananVerificationChecklist({ items, empty }: LayananVerificationChecklistProps) {
  return (
    <DataTable
      items={items}
      rowKey={(item) => item.id}
      empty={empty ?? 'Tidak ada berkas yang perlu diverifikasi'}
      columns={[
        {
          key: 'icon',
          header: '',
          render: (item) => <VerificationIcon state={item.case?.currentState ?? item.status} />,
        },
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
          key: 'task',
          header: 'Tugas Verifikasi',
          render: (item) => (
            <div>
              <p className="text-sm font-medium text-zinc-800">{item.title}</p>
              <p className="text-xs text-zinc-500">{item.taskType}</p>
            </div>
          ),
        },
        {
          key: 'state',
          header: 'State',
          render: (item) => <WorkflowBadge value={item.case?.currentState ?? item.status} />,
        },
        {
          key: 'status',
          header: 'Status',
          render: (item) => <StatusBadge value={item.status} />,
        },
        {
          key: 'due',
          header: 'Batas Waktu',
          render: (item) => formatDate(item.dueDate),
        },
      ]}
    />
  );
}
