import { useEffect, useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { ApiError } from '@/lib/api/client';
import {
  dmsApi,
  type DmsDocument,
  type DmsDocumentListQuery,
  type DmsDocumentListResponse,
  type DmsFolderTree,
  dmsCategoryLabel,
} from '@/lib/api/dms';
import { ErrorAlert } from '@/components/workspace/ui';
import { type DmsFilterValue } from '@/components/workspace/dms/dms-filter-bar';
import { type DmsStatSummary } from '@/components/workspace/dms/dms-stat-cards';
import { DmsDocumentsHeader } from '@/components/workspace/dms/list/dms-documents-header';
import { DmsDocumentsSummary } from '@/components/workspace/dms/list/dms-documents-summary';
import { DmsDocumentsSection } from '@/components/workspace/dms/list/dms-documents-section';
import {
  DmsFolderSidebar,
  type DmsFolderSelection,
} from '@/components/workspace/dms/dms-folder-sidebar';

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

  const [folderTree, setFolderTree] = useState<DmsFolderTree | null>(null);
  const [folderSelection, setFolderSelection] = useState<DmsFolderSelection>({});

  async function loadDocuments(
    nextFilter: DmsFilterValue = appliedFilter,
    folder: DmsFolderSelection = folderSelection,
  ) {
    setLoading(true);
    setError('');

    try {
      const query: DmsDocumentListQuery = {
        ...nextFilter,
        unitKerjaId: folder.unitKerjaId,
        year: folder.year != null ? String(folder.year) : nextFilter.year,
        category: (folder.category as DmsDocumentListQuery['category']) || nextFilter.category,
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

  async function loadFolderTree() {
    try {
      const tree = await dmsApi.getFolderTree();
      setFolderTree(tree);
    } catch {
      // folder tree is non-critical — silently ignore
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
    void loadDocuments(initialFilter, {});
    void loadFolderTree();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFilter]);

  function handleFolderSelect(sel: DmsFolderSelection) {
    setFolderSelection(sel);
    const resetted = { ...defaultFilter };
    setFilter(resetted);
    setAppliedFilter(resetted);
    void loadDocuments(resetted, sel);
  }

  const documents = data?.items ?? [];

  const summary = useMemo(() => buildSummary(documents, data?.total ?? 0), [
    documents,
    data?.total,
  ]);

  function applyFilter() {
    setAppliedFilter(filter);
    void loadDocuments(filter, folderSelection);
  }

  function resetFilter() {
    setFilter(defaultFilter);
    setAppliedFilter(defaultFilter);
    void loadDocuments(defaultFilter, folderSelection);
  }

  return (
    <div className="space-y-5">
      <DmsDocumentsHeader
        totalDocuments={data?.total ?? 0}
        loading={loading}
        onUpload={() => navigate('/dms/upload')}
        onRefresh={() => {
          void loadDocuments();
          void loadFolderTree();
        }}
      />

      {error ? <ErrorAlert message={error} /> : null}

      <DmsDocumentsSummary summary={summary} />

      <div className="flex gap-5 items-start">
        {folderTree && (
          <DmsFolderSidebar
            tree={folderTree}
            selection={folderSelection}
            onSelect={handleFolderSelect}
          />
        )}

        <div className="min-w-0 flex-1 space-y-3">
          {folderSelection.unitKerjaId && (
            <FolderBreadcrumb selection={folderSelection} onNavigate={handleFolderSelect} />
          )}

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
      </div>
    </div>
  );
}

interface BreadcrumbProps {
  selection: DmsFolderSelection;
  onNavigate: (sel: DmsFolderSelection) => void;
}

function FolderBreadcrumb({ selection, onNavigate }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      <button
        type="button"
        className="hover:text-foreground transition-colors"
        onClick={() => onNavigate({})}
      >
        Semua Dokumen
      </button>

      {selection.unitKerjaId && (
        <>
          <ChevronRight className="h-3.5 w-3.5" />
          <button
            type="button"
            className={[
              'transition-colors',
              !selection.year ? 'font-medium text-foreground' : 'hover:text-foreground',
            ].join(' ')}
            onClick={() =>
              onNavigate({
                unitKerjaId: selection.unitKerjaId,
                unitKerjaNama: selection.unitKerjaNama,
              })
            }
          >
            {selection.unitKerjaNama ?? selection.unitKerjaId}
          </button>
        </>
      )}

      {selection.year != null && (
        <>
          <ChevronRight className="h-3.5 w-3.5" />
          <button
            type="button"
            className={[
              'transition-colors',
              !selection.category ? 'font-medium text-foreground' : 'hover:text-foreground',
            ].join(' ')}
            onClick={() =>
              onNavigate({
                unitKerjaId: selection.unitKerjaId,
                unitKerjaNama: selection.unitKerjaNama,
                year: selection.year,
              })
            }
          >
            {selection.year}
          </button>
        </>
      )}

      {selection.category && (
        <>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground">
            {dmsCategoryLabel(selection.category)}
          </span>
        </>
      )}
    </nav>
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
