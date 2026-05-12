import { FolderArchive, RefreshCcw } from 'lucide-react';
import type { DmsDocument } from '@/lib/api/dms';
import {
  ActionButton,
  DataTable,
  EmptyState,
  formatDateTime,
  LoadingState,
} from '@/components/workspace/ui';
import { DmsCategoryBadge } from '@/components/workspace/dms/dms-category-badge';
import { DmsStatusBadge } from '@/components/workspace/dms/dms-status-badge';

export function SiapWorklogDmsPanel({
  documents,
  loading,
  onRefresh,
  onOpenDmsUpload,
  onOpenDmsDocument,
}: {
  documents: DmsDocument[];
  loading: boolean;
  onRefresh: () => void;
  onOpenDmsUpload: () => void;
  onOpenDmsDocument: (id: string) => void;
}) {
  return (
    <section className="grid gap-4 border-t border-border pt-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-normal text-zinc-900">
            Dokumen DMS Terkait
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Dokumen DMS yang terhubung ke buku kerja ini melalui worklogId.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <ActionButton
            icon={FolderArchive}
            onClick={onOpenDmsUpload}
            variant="secondary"
          >
            Upload ke DMS
          </ActionButton>
          <ActionButton
            disabled={loading}
            icon={RefreshCcw}
            onClick={onRefresh}
            variant="ghost"
          >
            Refresh DMS
          </ActionButton>
        </div>
      </div>

      {loading ? (
        <LoadingState label="Memuat dokumen DMS terkait" />
      ) : documents.length === 0 ? (
        <EmptyState
          icon={FolderArchive}
          title="Belum ada dokumen DMS terkait"
          description="Gunakan tombol Upload ke DMS untuk menyimpan bukti dukung baru ke Document Management System."
        />
      ) : (
        <DataTable
          items={documents}
          rowKey={(item) => item.id}
          empty="Belum ada dokumen DMS terkait"
          columns={[
            {
              key: 'document',
              header: 'Dokumen',
              render: (item) => (
                <div className="max-w-md">
                  <div className="font-semibold text-zinc-950">
                    {item.title}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {item.originalFileName ?? item.fileName ?? 'Belum ada file'}
                  </div>
                  {item.description ? (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  ) : null}
                </div>
              ),
            },
            {
              key: 'category',
              header: 'Kategori',
              render: (item) => <DmsCategoryBadge category={item.category} />,
            },
            {
              key: 'status',
              header: 'Status',
              render: (item) => <DmsStatusBadge status={item.status} />,
            },
            {
              key: 'createdAt',
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
                  icon={FolderArchive}
                  onClick={() => onOpenDmsDocument(item.id)}
                  variant="secondary"
                >
                  Buka DMS
                </ActionButton>
              ),
            },
          ]}
        />
      )}
    </section>
  );
}