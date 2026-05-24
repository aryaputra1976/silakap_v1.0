import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import {
  DataTable,
  formatDate,
  secondaryButtonClass,
  StatusBadge,
} from '@/components/workspace/ui';
import {
  getSlaRiskTone,
  opdSubmissionSlaStatusLabel,
  type OpdSubmission,
} from '@/lib/opd-submissions/types';
import { ServiceStatusBadge } from './service-status-badge';

export function ServiceWorkbenchTable({
  items,
}: {
  items: OpdSubmission[];
}) {
  return (
    <DataTable
      items={items}
      rowKey={(item) => item.id}
      empty="Belum ada pengajuan OPD pada filter ini."
      columns={[
        {
          key: 'number',
          header: 'Nomor',
          className: 'w-[150px]',
          render: (item) => (
            <div>
              <div className="font-semibold text-[#18343a]">
                {item.submissionNumber ?? 'Belum submit'}
              </div>
              <div className="mt-1 text-xs text-[#687967]">
                {formatDate(item.submittedAt ?? item.createdAt)}
              </div>
            </div>
          ),
        },
        {
          key: 'opd',
          header: 'OPD',
          render: (item) => (
            <div>
              <div className="font-medium text-[#18343a]">
                {item.opdName ?? 'OPD'}
              </div>
              <div className="mt-1 text-xs text-[#687967]">
                {item.opdUnitId ?? '-'}
              </div>
            </div>
          ),
        },
        {
          key: 'service',
          header: 'Layanan',
          render: (item) => (
            <div>
              <div className="font-medium text-[#18343a]">{item.title}</div>
              <div className="mt-1 text-xs text-[#687967]">
                {item.moduleKey} / {item.serviceType}
              </div>
            </div>
          ),
        },
        {
          key: 'status',
          header: 'Status',
          className: 'w-[150px]',
          render: (item) => <ServiceStatusBadge status={item.status} />,
        },
        {
          key: 'sla',
          header: 'SLA',
          className: 'w-[150px]',
          render: (item) => (
            <StatusBadge
              value={opdSubmissionSlaStatusLabel(item.slaStatus)}
              tone={getSlaRiskTone(item.slaStatus)}
            />
          ),
        },
        {
          key: 'note',
          header: 'Catatan',
          render: (item) => item.correctionNote ?? item.description ?? '-',
        },
        {
          key: 'action',
          header: 'Aksi',
          className: 'w-[150px]',
          render: (item) => (
            <Link className={secondaryButtonClass} to={`/layanan/${item.id}`}>
              <Eye className="size-4" />
              Detail
            </Link>
          ),
        },
      ]}
    />
  );
}
