import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { SectionCard, StatusBadge } from '@/components/workspace/ui';
import type { KinerjaBidangRealization } from '@/lib/api/kinerja-bidang';
import {
  getRealizationBlockingReasons,
  getRealizationPermissions,
  realizationStatusHelp,
  type KinerjaRole,
} from '@/lib/sop/sop-realization-permissions';

export function SopRealizationValidationPanel({
  realization,
  role,
}: {
  realization: KinerjaBidangRealization;
  role: KinerjaRole;
}) {
  const blockingReasons = getRealizationBlockingReasons(realization);
  const permissions = getRealizationPermissions(realization, role);
  const validForApproval = blockingReasons.length === 0;

  return (
    <SectionCard
      title="Validasi Realisasi"
      description="Pemeriksaan kelayakan realisasi sebelum submit/review/approve."
      actions={
        <>
          <StatusBadge value={`Role: ${role}`} tone="dark" />
          <StatusBadge
            value={validForApproval ? 'Siap Approve' : 'Belum Siap Approve'}
            tone={validForApproval ? 'success' : 'warning'}
          />
        </>
      }
    >
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-lg border border-[#d8e5d3] bg-white p-4 text-sm leading-6 text-[#51614c]">
          <div className="mb-2 flex items-center gap-2 font-semibold text-[#173c36]">
            <ShieldAlert className="size-4 text-[#0f766e]" />
            Status Saat Ini
          </div>
          <p>{realizationStatusHelp(realization.status)}</p>
        </div>

        <div className="rounded-lg border border-[#d8e5d3] bg-white p-4 text-sm leading-6 text-[#51614c]">
          <div className="mb-2 flex items-center gap-2 font-semibold text-[#173c36]">
            <CheckCircle2 className="size-4 text-[#0f766e]" />
            Hak Aksi
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge
              value={permissions.canWrite ? 'Bisa Input/Edit' : 'Tidak Bisa Input'}
              tone={permissions.canWrite ? 'success' : 'neutral'}
            />
            <StatusBadge
              value={permissions.canReview ? 'Bisa Review' : 'Tidak Bisa Review'}
              tone={permissions.canReview ? 'success' : 'neutral'}
            />
          </div>
        </div>

        <div className="rounded-lg border border-[#d8e5d3] bg-white p-4 text-sm leading-6 text-[#51614c]">
          <div className="mb-2 flex items-center gap-2 font-semibold text-[#173c36]">
            <AlertTriangle className="size-4 text-[#a16207]" />
            Catatan Validasi
          </div>

          {blockingReasons.length === 0 ? (
            <p>Realisasi memiliki kuantitas dan bukti dukung DMS.</p>
          ) : (
            <ul className="list-disc space-y-1 ps-4">
              {blockingReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
