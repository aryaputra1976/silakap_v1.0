import { FileText } from 'lucide-react';
import {
  EmptyState,
  FileMeta,
  formatDateTime,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';
import type { OpdSubmissionDocument } from '@/lib/opd-submissions/types';

export function ServiceDocumentPanel({
  documents,
}: {
  documents: OpdSubmissionDocument[];
}) {
  return (
    <SectionCard
      title="Dokumen OPD"
      description="Bukti awal dari OPD untuk mendukung verifikasi layanan."
      actions={<StatusBadge value={`${documents.length} dokumen`} tone="info" />}
    >
      {documents.length === 0 ? (
        <EmptyState
          title="Belum ada dokumen OPD"
          description="Pengajuan ini belum memiliki metadata dokumen pendukung."
          icon={FileText}
        />
      ) : (
        <div className="grid gap-3">
          {documents.map((document) => (
            <div
              className="rounded-lg border border-[#d8e5d3] bg-white p-4"
              key={document.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-[#173c36]">
                    {document.title}
                  </div>
                  <div className="mt-1 text-xs text-[#687967]">
                    {document.documentType}
                  </div>
                </div>
                <StatusBadge value={document.status} />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <FileMeta
                  label="DMS Document ID"
                  value={document.dmsDocumentId ?? 'Belum tertaut'}
                />
                <FileMeta
                  label="Diunggah"
                  value={formatDateTime(document.uploadedAt)}
                />
                <FileMeta label="Catatan" value={document.note ?? '-'} />
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
