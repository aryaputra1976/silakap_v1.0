import { RefreshCcw } from 'lucide-react';
import { ActionButton, PageHeader, StatusBadge } from '@/components/workspace/ui';

type DmsVerificationHeaderProps = {
  totalWaiting: number;
  loading: boolean;
  onRefresh: () => void;
};

export function DmsVerificationHeader({
  totalWaiting,
  loading,
  onRefresh,
}: DmsVerificationHeaderProps) {
  return (
    <PageHeader
      title="Verifikasi Dokumen DMS"
      description="Tinjau dokumen SUBMITTED dan tetapkan apakah dokumen sah sebagai bukti dukung."
      meta={<StatusBadge value={`${totalWaiting} MENUNGGU`} tone="info" />}
      actions={
        <ActionButton
          disabled={loading}
          icon={RefreshCcw}
          onClick={onRefresh}
          variant="secondary"
        >
          Refresh
        </ActionButton>
      }
    />
  );
}
