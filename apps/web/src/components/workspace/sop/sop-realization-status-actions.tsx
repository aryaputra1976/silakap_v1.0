import { CheckCircle2, RotateCcw, Send, ShieldCheck } from 'lucide-react';
import { ActionButton, StatusBadge } from '@/components/workspace/ui';
import {
  kinerjaBidangApi,
  type KinerjaBidangRealization,
} from '@/lib/api/kinerja-bidang';
import {
  canApproveRealization,
  getRealizationBlockingReasons,
  getRealizationPermissions,
  type KinerjaRole,
} from '@/lib/sop/sop-realization-permissions';

export function SopRealizationStatusActions({
  realization,
  role,
  loading,
  onLoading,
  onUpdated,
  onError,
}: {
  realization: KinerjaBidangRealization;
  role: KinerjaRole;
  loading: boolean;
  onLoading: (value: boolean) => void;
  onUpdated: (value: KinerjaBidangRealization) => void;
  onError: (message: string) => void;
}) {
  const permissions = getRealizationPermissions(realization, role);
  const blockingReasons = getRealizationBlockingReasons(realization);
  const approveAllowed = canApproveRealization(realization, role);

  async function run(action: () => Promise<KinerjaBidangRealization>) {
    onLoading(true);
    onError('');

    try {
      const result = await action();
      onUpdated(result);
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : 'Aksi gagal diproses');
    } finally {
      onLoading(false);
    }
  }

  if (realization.status === 'APPROVED') {
    return (
      <div className="flex flex-wrap gap-2">
        <StatusBadge value="Realisasi sudah approved dan terkunci" tone="success" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {permissions.canSubmit ? (
          <ActionButton
            icon={Send}
            disabled={loading}
            onClick={() =>
              void run(() => kinerjaBidangApi.submitRealization(realization.id))
            }
          >
            Submit
          </ActionButton>
        ) : null}

        {permissions.canReviewSubmitted ? (
          <ActionButton
            variant="secondary"
            icon={ShieldCheck}
            disabled={loading}
            onClick={() =>
              void run(() => kinerjaBidangApi.reviewRealization(realization.id))
            }
          >
            Review
          </ActionButton>
        ) : null}

        {permissions.canApprove ? (
          <ActionButton
            icon={CheckCircle2}
            disabled={loading || !approveAllowed}
            onClick={() =>
              void run(() => kinerjaBidangApi.approveRealization(realization.id))
            }
          >
            Approve
          </ActionButton>
        ) : null}

        {permissions.canRequestRevision ? (
          <ActionButton
            variant="danger"
            icon={RotateCcw}
            disabled={loading}
            onClick={() =>
              void run(() =>
                kinerjaBidangApi.requestRevision(realization.id, {
                  reviewNote:
                    'Mohon dilakukan revisi realisasi dan/atau bukti dukung.',
                }),
              )
            }
          >
            Minta Revisi
          </ActionButton>
        ) : null}

        {!permissions.canSubmit &&
        !permissions.canReviewSubmitted &&
        !permissions.canApprove &&
        !permissions.canRequestRevision ? (
          <StatusBadge
            value="Tidak ada aksi tersedia untuk role/status ini"
            tone="neutral"
          />
        ) : null}
      </div>

      {permissions.canApprove && !approveAllowed ? (
        <div className="rounded-lg border border-[#ecd28b] bg-[#fff6d7] p-3 text-sm leading-6 text-[#7d5a00]">
          <div className="font-semibold">Approve belum dapat dilakukan:</div>
          <ul className="mt-1 list-disc ps-5">
            {blockingReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
