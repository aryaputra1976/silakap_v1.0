import { Timeline, SectionCard } from '@/components/workspace/ui';
import type { OpdSubmissionAuditLog } from '@/lib/opd-submissions/types';

const ACTION_LABELS: Record<string, string> = {
  CREATE_DRAFT: 'Draft dibuat OPD',
  UPDATE_DRAFT: 'Draft diperbarui',
  SUBMIT: 'Pengajuan dikirim',
  CANCEL: 'Pengajuan dibatalkan',
  UPLOAD_DOCUMENT: 'Dokumen OPD ditambahkan',
  RECEIVE: 'Diterima PPIK',
  START_VERIFICATION: 'Verifikasi dimulai',
  REQUEST_CORRECTION: 'Perbaikan diminta',
  CORRECTION_SUBMITTED: 'Perbaikan dikirim OPD',
  VERIFY: 'Terverifikasi',
  REJECT: 'Ditolak',
  COMPLETE: 'Selesai',
};

export function ServiceAuditTimeline({
  auditLogs,
}: {
  auditLogs: OpdSubmissionAuditLog[];
}) {
  return (
    <SectionCard
      title="Riwayat Proses"
      description="Audit timeline pengajuan dari OPD sampai proses internal PPIK."
    >
      <Timeline
        empty="Belum ada riwayat proses."
        items={auditLogs.map((log) => ({
          id: log.id,
          title: ACTION_LABELS[log.action] ?? log.action,
          description: log.note,
          type: log.actorRole ?? log.action,
          timestamp: log.createdAt,
          actor: log.actorId ?? undefined,
        }))}
      />
    </SectionCard>
  );
}
