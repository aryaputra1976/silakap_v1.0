import { Timeline } from '@/components/workspace/ui';
import type { DmsDocument } from '@/lib/api/dms';

export function DmsAuditTimeline({ document }: { document: DmsDocument }) {
  const items = [
    {
      id: `${document.id}-created`,
      title: 'Dokumen dibuat',
      description: document.createdBy?.name
        ? `Dibuat oleh ${document.createdBy.name}`
        : 'Metadata dokumen dibuat',
      type: 'CREATED',
      timestamp: document.createdAt,
      actor: document.createdBy?.name ?? null,
    },
    document.fileName
      ? {
          id: `${document.id}-uploaded`,
          title: 'File diunggah',
          description: document.originalFileName ?? document.fileName,
          type: 'UPLOADED',
          timestamp: document.updatedAt,
          actor: document.createdBy?.name ?? null,
        }
      : null,
    document.submittedAt
      ? {
          id: `${document.id}-submitted`,
          title: 'Dokumen disubmit',
          description: 'Dokumen diajukan untuk verifikasi',
          type: 'SUBMITTED',
          timestamp: document.submittedAt,
          actor: document.submittedBy?.name ?? null,
        }
      : null,
    document.verifiedAt
      ? {
          id: `${document.id}-verified`,
          title: 'Dokumen diverifikasi',
          description: 'Dokumen disahkan sebagai bukti dukung',
          type: 'VERIFIED',
          timestamp: document.verifiedAt,
          actor: document.verifiedBy?.name ?? null,
        }
      : null,
    document.rejectedAt
      ? {
          id: `${document.id}-rejected`,
          title: 'Dokumen ditolak',
          description: document.rejectionNote,
          type: 'REJECTED',
          timestamp: document.rejectedAt,
          actor: document.verifiedBy?.name ?? null,
        }
      : null,
    document.archivedAt
      ? {
          id: `${document.id}-archived`,
          title: 'Dokumen diarsipkan',
          description: 'Dokumen masuk arsip final',
          type: 'ARCHIVED',
          timestamp: document.archivedAt,
          actor: document.verifiedBy?.name ?? null,
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  return <Timeline items={items} empty="Belum ada riwayat dokumen" />;
}