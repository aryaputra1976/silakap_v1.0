import { Archive, CheckCircle2, Send, Trash2, XCircle } from 'lucide-react';
import { ActionButton, SectionCard, StatusBadge } from '@/components/workspace/ui';
import type { DmsDocument, DmsDocumentStatus } from '@/lib/api/dms';

export function DmsActionPanel({
  document,
  working,
  onSubmit,
  onVerify,
  onReject,
  onArchive,
  onDelete,
}: {
  document: DmsDocument;
  working?: boolean;
  onSubmit?: () => void;
  onVerify?: () => void;
  onReject?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}) {
  return (
    <SectionCard
      title="Aksi Dokumen"
      description="Aksi tersedia mengikuti status dokumen dan kewenangan pengguna."
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-zinc-700">Status saat ini:</span>
          <StatusBadge value={document.status} tone={statusTone(document.status)} />
        </div>

        <div className="flex flex-wrap gap-2">
          {canSubmit(document.status) && onSubmit ? (
            <ActionButton disabled={working} icon={Send} onClick={onSubmit}>
              Submit Verifikasi
            </ActionButton>
          ) : null}

          {canVerify(document.status) && onVerify ? (
            <ActionButton
              disabled={working}
              icon={CheckCircle2}
              onClick={onVerify}
              variant="secondary"
            >
              Verifikasi
            </ActionButton>
          ) : null}

          {canVerify(document.status) && onReject ? (
            <ActionButton
              disabled={working}
              icon={XCircle}
              onClick={onReject}
              variant="danger"
            >
              Tolak
            </ActionButton>
          ) : null}

          {document.status === 'VERIFIED' && onArchive ? (
            <ActionButton
              disabled={working}
              icon={Archive}
              onClick={onArchive}
              variant="secondary"
            >
              Arsipkan
            </ActionButton>
          ) : null}

          {canDelete(document.status) && onDelete ? (
            <ActionButton
              disabled={working}
              icon={Trash2}
              onClick={onDelete}
              variant="ghost"
            >
              Hapus
            </ActionButton>
          ) : null}
        </div>
      </div>
    </SectionCard>
  );
}

function canSubmit(status: DmsDocumentStatus) {
  return status === 'UPLOADED' || status === 'REJECTED';
}

function canVerify(status: DmsDocumentStatus) {
  return status === 'SUBMITTED';
}

function canDelete(status: DmsDocumentStatus) {
  return status !== 'VERIFIED' && status !== 'ARCHIVED';
}

function statusTone(status: DmsDocumentStatus) {
  if (status === 'VERIFIED' || status === 'ARCHIVED') {
    return 'success' as const;
  }

  if (status === 'SUBMITTED') {
    return 'info' as const;
  }

  if (status === 'REJECTED') {
    return 'danger' as const;
  }

  if (status === 'UPLOADED') {
    return 'warning' as const;
  }

  return 'neutral' as const;
}