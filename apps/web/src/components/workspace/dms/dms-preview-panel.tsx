import { Download, FileText } from 'lucide-react';
import {
  ActionButton,
  FileMeta,
  formatDateTime,
  formatFileSize,
  SectionCard,
} from '@/components/workspace/ui';
import type { DmsDocument } from '@/lib/api/dms';

export function DmsPreviewPanel({
  document,
  downloading,
  onDownload,
}: {
  document: DmsDocument;
  downloading?: boolean;
  onDownload?: () => void;
}) {
  return (
    <SectionCard
      title="Preview & Metadata File"
      description="Informasi teknis file yang tersimpan di DMS."
      actions={
        document.fileName && onDownload ? (
          <ActionButton
            disabled={downloading}
            icon={Download}
            onClick={onDownload}
            variant="secondary"
          >
            {downloading ? 'Mengunduh...' : 'Download'}
          </ActionButton>
        ) : null
      }
    >
      {document.fileName ? (
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-lg border border-border bg-zinc-50 p-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600">
              <FileText className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-zinc-950">
                {document.originalFileName ?? document.fileName}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {document.mimeType ?? 'application/octet-stream'} ·{' '}
                {formatFileSize(document.fileSize)}
              </div>
              <div className="mt-1 max-w-full truncate text-xs text-muted-foreground">
                {document.storagePath}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <FileMeta label="Nama File Sistem" value={document.fileName} />
            <FileMeta label="Nama Asli" value={document.originalFileName ?? '-'} />
            <FileMeta label="Ukuran" value={formatFileSize(document.fileSize)} />
            <FileMeta label="MIME Type" value={document.mimeType ?? '-'} />
            <FileMeta label="Versi" value={document.version} />
            <FileMeta label="Checksum" value={document.checksum ?? '-'} />
            <FileMeta label="Dibuat" value={formatDateTime(document.createdAt)} />
            <FileMeta label="Diperbarui" value={formatDateTime(document.updatedAt)} />
            <FileMeta label="Storage Path" value={document.storagePath ?? '-'} />
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50/70 p-8 text-center">
          <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500">
            <FileText className="size-5" />
          </div>
          <div className="font-semibold text-zinc-900">File belum diunggah</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Metadata dokumen sudah dapat dibuat terlebih dahulu. File dapat
            diunggah pada tahap berikutnya.
          </div>
        </div>
      )}
    </SectionCard>
  );
}