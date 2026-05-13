import type { DmsDocument } from '@/lib/api/dms';
import { LoadingState, SectionCard } from '@/components/workspace/ui';
import { DmsDocumentTable } from '@/components/workspace/dms/dms-document-table';
import {
  DmsFilterBar,
  type DmsFilterValue,
} from '@/components/workspace/dms/dms-filter-bar';

type DmsDocumentsSectionProps = {
  documents: DmsDocument[];
  filter: DmsFilterValue;
  loading: boolean;
  downloadingId: string;
  onFilterChange: (value: DmsFilterValue) => void;
  onApplyFilter: () => void;
  onResetFilter: () => void;
  onOpenDocument: (id: string) => void;
  onDownloadDocument: (document: DmsDocument) => void;
};

export function DmsDocumentsSection({
  documents,
  filter,
  loading,
  downloadingId,
  onFilterChange,
  onApplyFilter,
  onResetFilter,
  onOpenDocument,
  onDownloadDocument,
}: DmsDocumentsSectionProps) {
  return (
    <>
      <DmsFilterBar
        value={filter}
        loading={loading}
        onChange={onFilterChange}
        onApply={onApplyFilter}
        onReset={onResetFilter}
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
            onDownloadDocument={onDownloadDocument}
            onOpenDocument={onOpenDocument}
          />
        )}
      </SectionCard>
    </>
  );
}
