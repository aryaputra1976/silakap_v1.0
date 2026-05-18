import { AlertTriangle, CheckCircle2, Clock, FileCheck } from 'lucide-react';
import { SectionCard, StatusBadge, FileMeta } from '@/components/workspace/ui';
import type { OpdSubmission, OpdSubmissionDocument } from '@/lib/opd-submissions/types';
import { opdSubmissionSlaStatusLabel } from '@/lib/opd-submissions/types';

type EvidenceStatus = {
  total: number;
  verified: number;
  rejected: number;
  pending: number;
};

type ReadinessResult = {
  canComplete: boolean;
  reasons: string[];
  evidenceStatus: EvidenceStatus;
  slaStatus: string;
  isOnTime: boolean;
};

function computeReadiness(documents: OpdSubmissionDocument[], slaStatus: string): ReadinessResult {
  const total = documents.length;
  const verified = documents.filter((d) => d.status === 'VERIFIED').length;
  const rejected = documents.filter((d) => d.status === 'REJECTED').length;
  const pending = total - verified - rejected;

  const reasons: string[] = [];

  if (rejected > 0) {
    reasons.push(`${rejected} dokumen ditolak — perlu perbaikan.`);
  }

  if (total > 0 && verified === 0) {
    reasons.push('Belum ada dokumen yang terverifikasi.');
  }

  return {
    canComplete: reasons.length === 0,
    reasons,
    evidenceStatus: { total, verified, rejected, pending },
    slaStatus,
    isOnTime: slaStatus !== 'OVERDUE',
  };
}

export function ServiceCompletionReadinessCard({
  submission,
  overrideNote,
  onOverrideNoteChange,
}: {
  submission: OpdSubmission;
  overrideNote: string;
  onOverrideNoteChange: (value: string) => void;
}) {
  const readiness = computeReadiness(submission.documents, submission.slaStatus);

  if (submission.status === 'COMPLETED') {
    return null;
  }

  const canShowOverride =
    !readiness.canComplete &&
    (submission.status === 'VERIFIED' || submission.status === 'IN_VERIFICATION');

  return (
    <SectionCard
      title="Kesiapan Penyelesaian"
      description="Pemeriksaan otomatis sebelum pengajuan dapat diselesaikan."
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <FileMeta
            label="Dokumen Total"
            value={String(readiness.evidenceStatus.total)}
          />
          <FileMeta
            label="Terverifikasi"
            value={
              <StatusBadge
                value={String(readiness.evidenceStatus.verified)}
                tone={readiness.evidenceStatus.verified > 0 ? 'success' : 'neutral'}
              />
            }
          />
          <FileMeta
            label="Ditolak"
            value={
              <StatusBadge
                value={String(readiness.evidenceStatus.rejected)}
                tone={readiness.evidenceStatus.rejected > 0 ? 'danger' : 'neutral'}
              />
            }
          />
        </div>

        <div className="flex items-center gap-2 text-sm">
          {readiness.isOnTime ? (
            <Clock className="h-4 w-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          )}
          <span className={readiness.isOnTime ? 'text-emerald-700' : 'text-amber-700'}>
            SLA: {opdSubmissionSlaStatusLabel(readiness.slaStatus)}
          </span>
        </div>

        {readiness.canComplete ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <FileCheck className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="text-sm text-emerald-800">
              Pengajuan siap diselesaikan — semua syarat terpenuhi.
            </span>
          </div>
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">
                Syarat belum terpenuhi
              </span>
            </div>
            <ul className="space-y-1 pl-6">
              {readiness.reasons.map((reason) => (
                <li key={reason} className="list-disc text-xs text-amber-700">
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {canShowOverride ? (
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#51614c]">
              Catatan Override (wajib jika ada syarat belum terpenuhi)
            </label>
            <textarea
              className="w-full rounded-md border border-[#c9d9c4] bg-white px-3 py-2 text-sm text-[#173c36] outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#a9d7cc]"
              placeholder="Alasan override penyelesaian..."
              rows={2}
              value={overrideNote}
              onChange={(e) => onOverrideNoteChange(e.target.value)}
            />
            <p className="text-xs text-[#6d7e68]">
              Hanya KABID / Admin BKPSDM yang dapat menggunakan override.
            </p>
          </div>
        ) : null}

        {readiness.canComplete ? (
          <div className="flex items-center gap-1.5 text-xs text-[#6d7e68]">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            Setelah diselesaikan, layanan akan masuk antrian validasi RHK BKPSDM.
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}
