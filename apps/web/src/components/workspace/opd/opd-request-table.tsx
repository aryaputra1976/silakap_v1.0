import { FilePenLine, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ActionButton,
  DataTable,
  formatDate,
  StatusBadge,
} from '@/components/workspace/ui';
import {
  canOpdEditSubmission,
  opdSubmissionStatusLabel,
  opdSubmissionStatusTone,
  type OpdSubmission,
} from '@/lib/opd-submissions/types';

export function OpdRequestTable({
  items,
  empty = 'Belum ada permohonan OPD',
}: {
  items: OpdSubmission[];
  empty?: string;
}) {
  return (
    <DataTable
      items={items}
      rowKey={(item) => item.id}
      empty={empty}
      columns={[
        {
          key: 'nomor',
          header: 'Nomor',
          render: (item) => (
            <span className="font-mono text-xs font-semibold">
              {item.submissionNumber ?? 'DRAFT'}
            </span>
          ),
        },
        {
          key: 'jenis',
          header: 'Jenis Layanan',
          render: (item) => item.serviceType,
        },
        {
          key: 'tanggal',
          header: 'Tanggal Pengajuan',
          render: (item) => formatDate(item.submittedAt ?? item.createdAt),
        },
        {
          key: 'status',
          header: 'Status',
          render: (item) => (
            <StatusBadge
              value={opdSubmissionStatusLabel(item.status)}
              tone={opdSubmissionStatusTone(item.status)}
            />
          ),
        },
        {
          key: 'catatan',
          header: 'Catatan Terakhir',
          render: (item) => item.correctionNote ?? item.description ?? '-',
        },
        {
          key: 'aksi',
          header: 'Aksi',
          render: (item) => (
            <div className="flex flex-wrap gap-2">
              <Link to={buildDetailPath(item)}>
                <ActionButton icon={Eye} variant="secondary">
                  Lihat Detail
                </ActionButton>
              </Link>
              <ActionButton
                icon={FilePenLine}
                variant="secondary"
                disabled={!canOpdEditSubmission(item.status)}
              >
                Perbaiki Berkas
              </ActionButton>
            </div>
          ),
        },
      ]}
    />
  );
}

function buildDetailPath(item: OpdSubmission) {
  if (item.moduleKey === 'SIPENSIUN') {
    return `/opd/sipensiun/${item.id}`;
  }

  return `/opd/layanan/${item.id}`;
}
