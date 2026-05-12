import { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router';
import { ApiError } from '@/lib/api/client';
import {
  dmsApi,
  type DmsDocument,
  type DmsDocumentListQuery,
  type DmsDocumentListResponse,
} from '@/lib/api/dms';

import {
  ActionButton,
  ErrorAlert,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';
import { DmsDocumentTable } from '@/components/workspace/dms/dms-document-table';
import {
  DmsFilterBar,
  type DmsFilterValue,
} from '@/components/workspace/dms/dms-filter-bar';
import { DmsStatCards, type DmsStatSummary } from '@/components/workspace/dms/dms-stat-cards';

const defaultFilter: DmsFilterValue = {
  q: '',
  category: '',
  status: '',
  year: '',
  month: '',
};

export function DmsDocumentsPage() {
  const navigate = useNavigate();

  const [data, setData] = useState<DmsDocumentListResponse | null>(null);
  const [filter, setFilter] = useState<DmsFilterValue>(defaultFilter);
  const [appliedFilter, setAppliedFilter] = useState<DmsFilterValue>(defaultFilter);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState('');
  const [error, setError] = useState('');

  async function loadDocuments(nextFilter: DmsFilterValue = appliedFilter) {
    setLoading(true);
    setError('');

    try {
      const query: DmsDocumentListQuery = {
        ...nextFilter,
        page: 1,
        limit: 25,
      };

      const result = await dmsApi.listDocuments(query);
      setData(result);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal memuat dokumen DMS',
      );
    } finally {
      setLoading(false);
    }
  }

  async function downloadDocument(document: DmsDocument) {
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
    void loadDocuments(defaultFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const documents = data?.items ?? [];

  const summary = useMemo(() => buildSummary(documents, data?.total ?? 0), [
    documents,
    data?.total,
  ]);

  function applyFilter() {
    setAppliedFilter(filter);
    void loadDocuments(filter);
  }

  function resetFilter() {
    setFilter(defaultFilter);
    setAppliedFilter(defaultFilter);
    void loadDocuments(defaultFilter);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dokumen DMS"
        description="Kelola dokumen bukti dukung, laporan, arsip kepegawaian, dan dokumen kerja yang terhubung dengan SIAP, SIDATA, dan layanan kepegawaian."
        meta={<StatusBadge value={`${data?.total ?? 0} DOKUMEN`} tone="info" />}
        actions={
          <>
            <ActionButton
              icon={Plus}
              onClick={() => navigate('/dms/upload')}
            >
              Upload Dokumen
            </ActionButton>
            <ActionButton
              disabled={loading}
              icon={RefreshCcw}
              onClick={() => void loadDocuments()}
              variant="secondary"
            >
              Refresh
            </ActionButton>
          </>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      <DmsStatCards summary={summary} />

      <DmsFilterBar
        value={filter}
        loading={loading}
        onChange={setFilter}
        onApply={applyFilter}
        onReset={resetFilter}
      />

      <SectionCard
        title="Daftar Dokumen"
        description="Dokumen yang tampil mengikuti hak akses pengguna dan filter yang diterapkan."
      >
        {loading ? (
          <LoadingState label="Memuat dokumen DMS" />
        ) : (
          <DmsDocumentTable
            documents={documents}
            downloadingId={downloadingId}
            onDownloadDocument={(document) => void downloadDocument(document)}
            onOpenDocument={(id) => navigate(`/dms/documents/${id}`)}
          />
        )}
      </SectionCard>
    </div>
  );
}

function buildSummary(
  documents: DmsDocument[],
  total: number,
): DmsStatSummary {
  return {
    total,
    draft: documents.filter((item) => item.status === 'DRAFT').length,
    uploaded: documents.filter((item) => item.status === 'UPLOADED').length,
    submitted: documents.filter((item) => item.status === 'SUBMITTED').length,
    verified: documents.filter((item) => item.status === 'VERIFIED').length,
    rejected: documents.filter((item) => item.status === 'REJECTED').length,
    archived: documents.filter((item) => item.status === 'ARCHIVED').length,
  };
}