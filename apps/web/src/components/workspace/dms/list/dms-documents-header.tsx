import { Plus, RefreshCcw } from 'lucide-react';
import { ActionButton, PageHeader, StatusBadge } from '@/components/workspace/ui';

type DmsDocumentsHeaderProps = {
  totalDocuments: number;
  loading: boolean;
  onUpload: () => void;
  onRefresh: () => void;
};

export function DmsDocumentsHeader({
  totalDocuments,
  loading,
  onUpload,
  onRefresh,
}: DmsDocumentsHeaderProps) {
  return (
    <PageHeader
      title="Dokumen DMS"
      description="Kelola dokumen bukti dukung, laporan, arsip kepegawaian, dan dokumen kerja yang terhubung dengan SIAP, SIDATA, dan layanan kepegawaian."
      meta={<StatusBadge value={`${totalDocuments} DOKUMEN`} tone="info" />}
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
