import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ApiError } from '@/lib/api/client';
import {
  dmsApi,
  type DmsDashboardLatestDocument,
  type DmsDashboardSummary,
} from '@/lib/api/dms';
import { ErrorAlert, LoadingState } from '@/components/workspace/ui';
import { DmsDashboardHeader } from '@/components/workspace/dms/dashboard/dms-dashboard-header';
import { DmsDashboardQuickActions } from '@/components/workspace/dms/dashboard/dms-dashboard-quick-actions';
import { DmsDashboardRecentDocuments } from '@/components/workspace/dms/dashboard/dms-dashboard-recent-documents';
import { DmsDashboardSummarySection } from '@/components/workspace/dms/dashboard/dms-dashboard-summary-section';

export function DmsDashboardPage() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState<DmsDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState('');
  const [error, setError] = useState('');

  async function loadDashboard() {
    setLoading(true);
    setError('');

    try {
      const result = await dmsApi.getDashboardSummary();
      setSummary(result);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal memuat dashboard DMS',
      );
    } finally {
      setLoading(false);
    }
  }

  async function downloadDocument(document: DmsDashboardLatestDocument) {
    if (!document.fileName) {
      return;
    }

    setDownloadingId(document.id);
    setError('');

    try {
      await dmsApi.downloadDocument(
        document.id,
        document.originalFileName ?? document.fileName,
      );
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal mengunduh dokumen DMS',
      );
    } finally {
      setDownloadingId('');
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const latestDocuments = summary?.latestDocuments ?? [];

  return (
    <div className="space-y-5">
      <DmsDashboardHeader
        loading={loading}
        onUpload={() => navigate('/dms/upload')}
        onRefresh={() => void loadDashboard()}
      />

      {error ? <ErrorAlert message={error} /> : null}

      {loading && !summary ? (
        <LoadingState label="Memuat dashboard DMS" />
      ) : (
        <>
          <DmsDashboardSummarySection summary={summary} />

          <DmsDashboardQuickActions
            onUpload={() => navigate('/dms/upload')}
            onViewDocuments={() => navigate('/dms/documents')}
            onViewVerification={() => navigate('/dms/verification')}
            onViewReports={() => navigate('/dms/reports')}
          />

          <DmsDashboardRecentDocuments
            documents={latestDocuments}
            loading={loading}
            downloadingId={downloadingId}
            onDownload={(document) => void downloadDocument(document)}
            onOpen={(id) => navigate(`/dms/documents/${id}`)}
            onViewAll={() => navigate('/dms/documents')}
          />
        </>
      )}
    </div>
  );
}
