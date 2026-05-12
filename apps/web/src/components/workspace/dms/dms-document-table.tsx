import { Eye, FileText } from 'lucide-react';
import {
  ActionButton,
  DataTable,
  formatDateTime,
  formatFileSize,
} from '@/components/workspace/ui';
import type { DmsDocument } from '@/lib/api/dms';
import { DmsCategoryBadge } from './dms-category-badge';
import { DmsStatusBadge } from './dms-status-badge';

export function DmsDocumentTable({
  documents,
  onOpenDocument,
}: {
  documents: DmsDocument[];
  onOpenDocument: (id: string) => void;
}) {
  return (
    <DataTable
      items={documents}
      rowKey={(item) => item.id}
      empty="Belum ada dokumen DMS"
      columns={[
        {
          key: 'title',
          header: 'Dokumen',
          render: (item) => (
            <div className="max-w-md">
              <div className="flex items-start gap-2">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 text-zinc-500">
                  <FileText className="size-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-zinc-950">{item.title}</div>
                  {item.description ? (
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {item.description}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <DmsCategoryBadge category={item.category} />
                    <DmsStatusBadge status={item.status} />
                  </div>
                </div>
              </div>
            </div>
          ),
        },
        {
          key: 'unit',
          header: 'Unit Kerja',
          render: (item) => (
            <div>
              <div className="font-medium text-zinc-900">
                {item.unitKerja?.nama ?? '-'}
              </div>
              <div className="text-xs text-muted-foreground">
                {item.unitKerja?.kode ?? ''}
              </div>
            </div>
          ),
        },
        {
          key: 'asn',
          header: 'ASN',
          render: (item) => (
            <div>
              <div className="font-medium text-zinc-900">
                {item.asn?.nama ?? '-'}
              </div>
              <div className="text-xs text-muted-foreground">
                {item.asn?.nip ?? ''}
              </div>
            </div>
          ),
        },
        {
          key: 'period',
          header: 'Periode',
          render: (item) => (
            <div className="text-sm">
              <div>{formatPeriod(item)}</div>
              {item.periodQuarter ? (
                <div className="text-xs text-muted-foreground">
                  Triwulan {item.periodQuarter}
                </div>
              ) : null}
            </div>
          ),
        },
        {
          key: 'file',
          header: 'File',
          render: (item) => (
            <div>
              <div className="max-w-[180px] truncate font-medium text-zinc-900">
                {item.originalFileName ?? item.fileName ?? '-'}
              </div>
              <div className="text-xs text-muted-foreground">
                {item.mimeType ?? 'Belum upload'} · {formatFileSize(item.fileSize)}
              </div>
            </div>
          ),
        },
        {
          key: 'created',
          header: 'Dibuat',
          render: (item) => (
            <div>
              <div className="font-medium text-zinc-900">
                {item.createdBy?.name ?? '-'}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDateTime(item.createdAt)}
              </div>
            </div>
          ),
        },
        {
          key: 'actions',
          header: 'Aksi',
          render: (item) => (
            <ActionButton
              icon={Eye}
              onClick={() => onOpenDocument(item.id)}
              variant="secondary"
            >
              Buka
            </ActionButton>
          ),
        },
      ]}
    />
  );
}

function formatPeriod(item: DmsDocument) {
  if (!item.periodYear && !item.periodMonth) {
    return '-';
  }

  if (item.periodMonth && item.periodYear) {
    return `${item.periodMonth}/${item.periodYear}`;
  }

  return String(item.periodYear ?? '-');
}