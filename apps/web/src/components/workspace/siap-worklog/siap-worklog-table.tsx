import { Edit3, Paperclip, Send } from 'lucide-react';
import type { SiapWorklog, SiapWorklogStatus } from '@/lib/api/types';
import {
  ActionButton,
  DataTable,
  formatDate,
  formatDateTime,
  StatusBadge,
} from '@/components/workspace/ui';

export function SiapWorklogTable({
  rows,
  workingId,
  onOpenAttachments,
  onEdit,
  onSubmit,
}: {
  rows: SiapWorklog[];
  workingId: string;
  onOpenAttachments: (item: SiapWorklog) => void;
  onEdit: (item: SiapWorklog) => void;
  onSubmit: (id: string) => void;
}) {
  return (
    <DataTable
      items={rows}
      rowKey={(item) => item.id}
      empty="Belum ada buku kerja"
      columns={[
        {
          key: 'workDate',
          header: 'Tanggal',
          render: (item) => (
            <div>
              <div className="font-semibold text-zinc-900">
                {formatDate(item.workDate)}
              </div>
              <div className="text-xs text-muted-foreground">
                {item.category}
              </div>
            </div>
          ),
        },
        {
          key: 'title',
          header: 'Kegiatan',
          render: (item) => (
            <div className="max-w-xl">
              <div className="font-semibold text-zinc-950">{item.title}</div>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                {item.description}
              </p>
              {item.output ? (
                <p className="mt-1 text-xs font-medium text-zinc-700">
                  Output: {item.output}
                </p>
              ) : null}
            </div>
          ),
        },
        {
          key: 'volume',
          header: 'Volume',
          render: (item) => item.volume ?? '-',
        },
        {
          key: 'status',
          header: 'Status',
          render: (item) => (
            <StatusBadge
              value={item.status}
              tone={worklogStatusTone(item.status)}
            />
          ),
        },
        {
          key: 'review',
          header: 'Review',
          render: (item) => (
            <div className="text-sm">
              <div>{item.reviewer?.name ?? '-'}</div>
              <div className="text-xs text-muted-foreground">
                {formatDateTime(item.reviewedAt)}
              </div>
              {item.reviewNote ? (
                <div className="mt-1 max-w-xs text-xs text-rose-700">
                  {item.reviewNote}
                </div>
              ) : null}
            </div>
          ),
        },
        {
          key: 'actions',
          header: 'Aksi',
          render: (item) => (
            <div className="flex flex-wrap gap-2">
              <ActionButton
                icon={Paperclip}
                onClick={() => onOpenAttachments(item)}
                variant="secondary"
              >
                Bukti
              </ActionButton>

              {canEdit(item) ? (
                <ActionButton
                  icon={Edit3}
                  onClick={() => onEdit(item)}
                  variant="secondary"
                >
                  Edit
                </ActionButton>
              ) : null}

              {canSubmit(item) ? (
                <ActionButton
                  disabled={workingId === item.id}
                  icon={Send}
                  onClick={() => onSubmit(item.id)}
                >
                  Submit
                </ActionButton>
              ) : null}

              {!canEdit(item) && !canSubmit(item) ? (
                <StatusBadge value="LOCKED" tone="neutral" />
              ) : null}
            </div>
          ),
        },
      ]}
    />
  );
}

function canEdit(item: SiapWorklog) {
  return item.status === 'DRAFT' || item.status === 'REVISION_REQUIRED';
}

function canSubmit(item: SiapWorklog) {
  return item.status === 'DRAFT' || item.status === 'REVISION_REQUIRED';
}

function worklogStatusTone(status: SiapWorklogStatus) {
  if (status === 'APPROVED') {
    return 'success' as const;
  }

  if (status === 'SUBMITTED') {
    return 'info' as const;
  }

  if (status === 'REVISION_REQUIRED' || status === 'REJECTED') {
    return 'danger' as const;
  }

  return 'warning' as const;
}