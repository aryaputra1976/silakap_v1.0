import { BarChart3, Download } from 'lucide-react';
import type { DmsDashboardLatestDocument } from '@/lib/api/dms';
import {
  ActionButton,
  DataTable,
  formatDateTime,
  LoadingState,
  SectionCard,
} from '@/components/workspace/ui';
import { formatPeriod } from '@/components/workspace/dms/shared/dms-formatters';
import { canDownloadDocument } from '@/components/workspace/dms/shared/dms-action-utils';
import { DmsCategoryBadge } from '@/components/workspace/dms/dms-category-badge';
import { DmsStatusBadge } from '@/components/workspace/dms/dms-status-badge';

type DmsDashboardRecentDocumentsProps = {
  documents: DmsDashboardLatestDocument[];
  loading: boolean;
  downloadingId: string;
  onDownload: (document: DmsDashboardLatestDocument) => void;
  onOpen: (id: string) => void;
  onViewAll: () => void;
};

export function DmsDashboardRecentDocuments({
  documents,
  loading,
  downloadingId,
  onDownload,
  onOpen,
  onViewAll,
}: DmsDashboardRecentDocumentsProps) {
  return (
    <SectionCard
      title="Dokumen Terbaru"
      description="Sepuluh dokumen terbaru yang dapat diakses oleh pengguna saat ini."
      actions={
        <ActionButton icon={BarChart3} onClick={onViewAll} variant="secondary">
          Lihat Semua
        </ActionButton>
      }
    >
      {loading ? (
        <LoadingState label="Memuat dokumen terbaru" />
      ) : (
        <DataTable
          items={documents}
          rowKey={(item) => item.id}
          empty="Belum ada dokumen terbaru"
          columns={[
            {
              key: 'title',
              header: 'Dokumen',
              render: (item) => (
                <div className="max-w-md">
                  <div className="font-semibold text-zinc-950">{item.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {item.originalFileName ?? item.fileName ?? 'Belum ada file'}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <DmsCategoryBadge category={item.category} />
                    <DmsStatusBadge status={item.status} />
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
              key: 'period',
              header: 'Periode',
              render: (item) => formatPeriod(item),
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
                <div className="flex flex-wrap gap-2">
                  <ActionButton onClick={() => onOpen(item.id)} variant="secondary">
                    Buka
                  </ActionButton>

                  {canDownloadDocument(item) ? (
                    <ActionButton
                      disabled={downloadingId === item.id}
                      icon={Download}
                      onClick={() => onDownload(item)}
                      variant="ghost"
                    >
                      {downloadingId === item.id ? 'Mengunduh...' : 'Download'}
                    </ActionButton>
                  ) : null}
                </div>
              ),
            },
          ]}
        />
      )}
    </SectionCard>
  );
}

