import { Plus, RefreshCcw } from 'lucide-react';
import { ActionButton, PageHeader, StatusBadge } from '@/components/workspace/ui';

type DmsDashboardHeaderProps = {
  loading: boolean;
  onUpload: () => void;
  onRefresh: () => void;
};

export function DmsDashboardHeader({
  loading,
  onUpload,
  onRefresh,
}: DmsDashboardHeaderProps) {
  return (
    <PageHeader
      title="Dashboard DMS"
      description="Ringkasan dokumen bukti dukung, laporan, dan arsip digital pada Document Management System SILAKAP."
      meta={<StatusBadge value="DMS BUKTI DUKUNG" tone="dark" />}
      actions={
        <>
          <ActionButton icon={Plus} onClick={onUpload}>
            Upload Dokumen
          </ActionButton>
          <ActionButton
            disabled={loading}
            icon={RefreshCcw}
            onClick={onRefresh}
            variant="secondary"
          >
            Refresh
          </ActionButton>
        </>
      }
    />
  );
}
