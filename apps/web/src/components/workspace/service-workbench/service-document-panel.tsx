import { CheckCircle2, FileText, RefreshCw, XCircle } from 'lucide-react';
import {
  ActionButton,
  EmptyState,
  FileMeta,
  formatDateTime,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';
import {
  canInternalVerifyDocument,
  opdSubmissionDocumentStatusLabel,
  opdSubmissionDocumentStatusTone,
  type OpdSubmissionDocument,
} from '@/lib/opd-submissions/types';
import type { AppRole } from '@/lib/rbac/roles';

export type ServiceDocumentAction =
  | 'verify-document'
  | 'request-document-correction'
  | 'reject-document';

export function ServiceDocumentPanel({
  documents,
  role,
  note,
  loadingDocumentId,
  onDocumentAction,
}: {
  documents: OpdSubmissionDocument[];
  role?: AppRole;
  note?: string;
  loadingDocumentId?: string | null;
  onDocumentAction?: (
    documentId: string,
    action: ServiceDocumentAction,
  ) => void;
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
                <StatusBadge
                  value={opdSubmissionDocumentStatusLabel(document.status)}
                  tone={opdSubmissionDocumentStatusTone(document.status)}
                />
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
                <FileMeta
                  label="Nama File"
                  value={document.originalFileName ?? 'Metadata tanpa file'}
                />
                <FileMeta
                  label="Ukuran"
                  value={formatSize(document.sizeBytes)}
                />
                <FileMeta label="Tipe File" value={document.mimeType ?? '-'} />
                <FileMeta label="Catatan" value={document.note ?? '-'} />
              </div>
              {role && onDocumentAction ? (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-[#e0eadb] pt-4">
                  <ActionButton
                    disabled={
                      loadingDocumentId === document.id ||
                      !canInternalVerifyDocument(role, document.status)
                    }
                    icon={CheckCircle2}
                    onClick={() =>
                      onDocumentAction(document.id, 'verify-document')
                    }
                    variant="secondary"
                  >
                    Verifikasi Dokumen
                  </ActionButton>
                  <ActionButton
                    disabled={
                      loadingDocumentId === document.id ||
                      !canRequestDocumentCorrection(role, document.status) ||
                      !note?.trim()
                    }
                    icon={RefreshCw}
                    onClick={() =>
                      onDocumentAction(
                        document.id,
                        'request-document-correction',
                      )
                    }
                    variant="secondary"
                  >
                    Minta Perbaikan
                  </ActionButton>
                  <ActionButton
                    disabled={
                      loadingDocumentId === document.id ||
                      !canInternalVerifyDocument(role, document.status) ||
                      !note?.trim()
                    }
                    icon={XCircle}
                    onClick={() =>
                      onDocumentAction(document.id, 'reject-document')
                    }
                    variant="danger"
                  >
                    Tolak Dokumen
                  </ActionButton>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function canRequestDocumentCorrection(role: AppRole, status: string) {
  const allowedRoles: AppRole[] = [
    'SUPER_ADMIN',
    'ADMIN_BKPSDM',
    'ANALIS_PERTAMA',
    'PENELAAH',
    'ANALIS_MUDA',
    'ANALIS_MADYA',
  ];

  return allowedRoles.includes(role) && status !== 'VERIFIED' && status !== 'REJECTED';
}

function formatSize(value: number | null) {
  if (!value) {
    return '-';
  }

  if (value < 1024 * 1024) {
    return `${Math.round(value / 1024)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}
