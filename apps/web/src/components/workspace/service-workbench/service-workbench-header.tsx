import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import {
  ActionButton,
  PageHeader,
  secondaryButtonClass,
  StatusBadge,
} from '@/components/workspace/ui';

export function ServiceWorkbenchHeader({
  title = 'Meja Kerja Verifikasi',
  description = 'Antrian pengajuan OPD untuk diterima, diverifikasi, dikoreksi, dan diselesaikan oleh PPIK.',
  total,
  detailMode = false,
  onRefresh,
  refreshing,
}: {
  title?: string;
  description?: string;
  total?: number;
  detailMode?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  return (
    <PageHeader
      title={title}
      description={description}
      meta={
        <>
          <StatusBadge value="Internal PPIK" tone="dark" />
          {typeof total === 'number' ? (
            <StatusBadge value={`${total} pengajuan`} tone="info" />
          ) : null}
        </>
      }
      actions={
        <>
          {detailMode ? (
            <Link className={secondaryButtonClass} to="/layanan/workbench">
              <ArrowLeft className="size-4" />
              Kembali
            </Link>
          ) : null}
          {onRefresh ? (
            <ActionButton
              disabled={refreshing}
              icon={RefreshCw}
              onClick={onRefresh}
              variant="secondary"
            >
              Muat Ulang
            </ActionButton>
          ) : null}
        </>
      }
    />
  );
}
