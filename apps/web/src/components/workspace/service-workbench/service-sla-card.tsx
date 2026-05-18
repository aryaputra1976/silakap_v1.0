import { Clock3 } from 'lucide-react';
import {
  FileMeta,
  formatDateTime,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';
import {
  formatSlaRemaining,
  getSlaRiskTone,
  opdSubmissionSlaStatusLabel,
  type OpdSubmission,
} from '@/lib/opd-submissions/types';

export function ServiceSlaCard({ submission }: { submission: OpdSubmission }) {
  return (
    <SectionCard
      title="SLA Layanan"
      description="SLA dihitung berdasarkan jam kerja. Waktu perbaikan OPD tidak dihitung sebagai keterlambatan internal PPIK."
      actions={
        <StatusBadge
          value={opdSubmissionSlaStatusLabel(submission.slaStatus)}
          tone={getSlaRiskTone(submission.slaStatus)}
        />
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <FileMeta label="Target selesai" value={formatDateTime(submission.slaDueAt)} />
        <FileMeta
          label="Sisa/terlambat"
          value={formatSlaRemaining(submission.slaDueAt, submission.slaStatus)}
        />
        <FileMeta
          label="Target SLA"
          value={submission.slaTargetHours ? `${submission.slaTargetHours} jam` : '-'}
        />
        <FileMeta
          label="Elapsed internal"
          value={`${submission.slaElapsedHours ?? 0} jam`}
        />
        <FileMeta
          label="Waktu pause"
          value={`${submission.slaPausedHours ?? 0} jam`}
        />
        <FileMeta
          label="Mulai SLA"
          value={formatDateTime(submission.slaStartedAt)}
        />
      </div>
      {submission.slaStatus === 'PAUSED_FOR_CORRECTION' ? (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <Clock3 className="mt-0.5 size-4 shrink-0" />
          SLA dijeda karena menunggu perbaikan dari OPD.
        </div>
      ) : null}
    </SectionCard>
  );
}
