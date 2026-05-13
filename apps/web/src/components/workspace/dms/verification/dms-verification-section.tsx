import type { DmsDocument } from '@/lib/api/dms';
import { LoadingState, SectionCard } from '@/components/workspace/ui';
import { DmsDocumentTable } from '@/components/workspace/dms/dms-document-table';

type DmsVerificationSectionProps = {
  documents: DmsDocument[];
  loading: boolean;
  onSelectDocument: (document: DmsDocument) => void;
};

export function DmsVerificationSection({
  documents,
  loading,
  onSelectDocument,
}: DmsVerificationSectionProps) {
  return (
    <SectionCard
      title="Dokumen Menunggu Verifikasi"
      description="Klik buka untuk melihat detail, atau pilih dokumen untuk proses cepat."
    >
      {loading ? (
        <LoadingState label="Memuat dokumen menunggu verifikasi" />
      ) : (
        <div className="space-y-4">
          <DmsDocumentTable
            documents={documents}
            onOpenDocument={(id) => {
              const document = documents.find((item) => item.id === id);
              if (document) {
                onSelectDocument(document);
              }
            }}
          />
        </div>
      )}
    </SectionCard>
  );
}
