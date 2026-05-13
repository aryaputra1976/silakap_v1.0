import { Archive, CheckCircle2, Send, Trash2, XCircle } from 'lucide-react';
import { ActionButton, SectionCard, StatusBadge } from '@/components/workspace/ui';
import type { DmsDocument, DmsDocumentStatus } from '@/lib/api/dms';
import { getDmsStatusTone } from './shared/dms-status-utils';
import {
  canArchiveDocument,
  canDeleteDocument,
  canRejectDocument,
  canSubmitDocument,
  canVerifyDocument,
} from './shared/dms-action-utils';

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
      description="Aksi tersedia mengikuti status dokumen dan kewenangan pengguna. Beberapa aksi bersifat final dan membutuhkan konfirmasi."
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-zinc-700">Status saat ini:</span>
          <StatusBadge value={document.status} tone={getDmsStatusTone(document.status)} />
        </div>

        <WorkflowHint status={document.status} />

        <div className="flex flex-wrap gap-2">
          {canSubmitDocument(document.status) && onSubmit ? (
            <ActionButton disabled={working} icon={Send} onClick={onSubmit}>
              Submit Verifikasi
            </ActionButton>
          ) : null}

          {canVerifyDocument(document.status) && onVerify ? (
            <ActionButton
              disabled={working}
              icon={CheckCircle2}
              onClick={onVerify}
              variant="secondary"
            >
              Verifikasi
            </ActionButton>
          ) : null}

          {canRejectDocument(document.status) && onReject ? (
            <ActionButton
              disabled={working}
              icon={XCircle}
              onClick={onReject}
              variant="danger"
            >
              Tolak
            </ActionButton>
          ) : null}

          {canArchiveDocument(document.status) && onArchive ? (
            <ActionButton
              disabled={working}
              icon={Archive}
              onClick={onArchive}
              variant="secondary"
            >
              Arsipkan
            </ActionButton>
          ) : null}

          {canDeleteDocument(document.status) && onDelete ? (
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

        {document.status === 'VERIFIED' || document.status === 'ARCHIVED' ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            Dokumen sudah final. Perubahan metadata, upload ulang file, dan hapus
            tidak tersedia pada status ini.
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}

function WorkflowHint({ status }: { status: DmsDocumentStatus }) {
  if (status === 'DRAFT') {
    return (
      <p className="text-sm text-muted-foreground">
        Upload file terlebih dahulu sebelum dokumen dapat disubmit.
      </p>
    );
  }

  if (status === 'UPLOADED') {
    return (
      <p className="text-sm text-muted-foreground">
        Dokumen sudah memiliki file dan siap disubmit untuk verifikasi.
      </p>
    );
  }

  if (status === 'SUBMITTED') {
    return (
      <p className="text-sm text-muted-foreground">
        Dokumen sedang menunggu keputusan verifikasi.
      </p>
    );
  }

  if (status === 'REJECTED') {
    return (
      <p className="text-sm text-rose-700">
        Dokumen ditolak. Perbaiki metadata atau upload ulang file, lalu submit kembali.
      </p>
    );
  }

  if (status === 'VERIFIED') {
    return (
      <p className="text-sm text-emerald-700">
        Dokumen sudah diverifikasi dan dapat diarsipkan sebagai dokumen final.
      </p>
    );
  }

  return (
    <p className="text-sm text-emerald-700">
      Dokumen sudah masuk arsip final.
    </p>
  );
}
