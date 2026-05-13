import { Download, RefreshCcw } from 'lucide-react';
import { ActionButton, PageHeader, StatusBadge } from '@/components/workspace/ui';

type DmsReportsHeaderProps = {
  totalDocuments: number;
  loading: boolean;
  exporting: boolean;
  onRefresh: () => void;
  onExport: () => void;
};

export function DmsReportsHeader({
  totalDocuments,
  loading,
  exporting,
  onRefresh,
  onExport,
}: DmsReportsHeaderProps) {
  return (
    <PageHeader
      title="Laporan DMS"
      description="Rekapitulasi dokumen bukti dukung berdasarkan status, kategori, periode, dan kesiapan arsip."
      meta={<StatusBadge value={`${totalDocuments} DOKUMEN`} tone="info" />}
      actions={
        <>
          <ActionButton
            disabled={loading}
            icon={RefreshCcw}
            onClick={onRefresh}
            variant="secondary"
          >
            Refresh
          </ActionButton>
          <ActionButton
            disabled={exporting || loading}
            icon={Download}
            onClick={onExport}
          >
            {exporting ? 'Exporting...' : 'Export CSV'}
          </ActionButton>
        </>
      }
    />
  );
}
