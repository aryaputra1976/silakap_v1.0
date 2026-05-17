import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ApiError } from '@/lib/api/client';
import {
  dmsApi,
  type DmsDocument,
  type DmsDocumentListQuery,
  type DmsDocumentListResponse,
} from '@/lib/api/dms';
import { ErrorAlert } from '@/components/workspace/ui';
import { type DmsFilterValue } from '@/components/workspace/dms/dms-filter-bar';
import { type DmsStatSummary } from '@/components/workspace/dms/dms-stat-cards';
import { DmsDocumentsHeader } from '@/components/workspace/dms/list/dms-documents-header';
import { DmsDocumentsSummary } from '@/components/workspace/dms/list/dms-documents-summary';
import { DmsDocumentsSection } from '@/components/workspace/dms/list/dms-documents-section';

const defaultFilter: DmsFilterValue = {
  q: '',
  category: '',
  subCategory: '',
  accessLevel: '',
  status: '',
  year: '',
  month: '',
};

export function DmsDocumentsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialFilter = useMemo(
    () => buildFilterFromSearchParams(searchParams),
    [searchParams],
  );

  const [data, setData] = useState<DmsDocumentListResponse | null>(null);
  const [filter, setFilter] = useState<DmsFilterValue>(initialFilter);
  const [appliedFilter, setAppliedFilter] = useState<DmsFilterValue>(initialFilter);
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
    setFilter(initialFilter);
    setAppliedFilter(initialFilter);
    void loadDocuments(initialFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFilter]);

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
      <DmsDocumentsHeader
        totalDocuments={data?.total ?? 0}
        loading={loading}
        onUpload={() => navigate('/dms/upload')}
        onRefresh={() => void loadDocuments()}
      />

      {error ? <ErrorAlert message={error} /> : null}

      <DmsDocumentsSummary summary={summary} />

      <DmsDocumentsSection
        documents={documents}
        filter={filter}
        loading={loading}
        downloadingId={downloadingId}
        onFilterChange={setFilter}
        onApplyFilter={applyFilter}
        onResetFilter={resetFilter}
        onOpenDocument={(id) => navigate(`/dms/documents/${id}`)}
        onDownloadDocument={(document) => void downloadDocument(document)}
      />
    </div>
  );
}

function buildFilterFromSearchParams(searchParams: URLSearchParams): DmsFilterValue {
  return {
    ...defaultFilter,
    q: searchParams.get('q') ?? '',
    category: (searchParams.get('category') ?? '') as DmsFilterValue['category'],
    subCategory: searchParams.get('subCategory') ?? '',
    accessLevel: (searchParams.get('accessLevel') ?? '') as DmsFilterValue['accessLevel'],
    status: (searchParams.get('status') ?? '') as DmsFilterValue['status'],
    year: searchParams.get('year') ?? '',
    month: searchParams.get('month') ?? '',
  };
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
