import {
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  PlayCircle,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ActionButton, SectionCard } from '@/components/workspace/ui';
import {
  getAvailableInternalActions,
  type InternalSubmissionAction,
} from '@/lib/opd-submissions/internal-policy';
import type { OpdSubmissionStatus } from '@/lib/opd-submissions/types';
import type { AppRole } from '@/lib/rbac/roles';

const ACTION_CONFIG: Record<
  InternalSubmissionAction,
  {
    label: string;
    icon: LucideIcon;
    variant: 'primary' | 'secondary' | 'danger';
    requiresNote?: boolean;
  }
> = {
  receive: {
    label: 'Terima',
    icon: ClipboardCheck,
    variant: 'secondary',
  },
  'start-verification': {
    label: 'Mulai Verifikasi',
    icon: PlayCircle,
    variant: 'secondary',
  },
  'request-correction': {
    label: 'Minta Perbaikan',
    icon: RefreshCw,
    variant: 'secondary',
    requiresNote: true,
  },
  verify: {
    label: 'Verifikasi',
    icon: ShieldCheck,
    variant: 'primary',
  },
  reject: {
    label: 'Tolak',
    icon: XCircle,
    variant: 'danger',
    requiresNote: true,
  },
  complete: {
    label: 'Selesaikan',
    icon: CheckCircle2,
    variant: 'primary',
  },
};

export function ServiceActionPanel({
  role,
  status,
  note,
  loadingAction,
  onAction,
}: {
  role: AppRole;
  status: OpdSubmissionStatus;
  note: string;
  loadingAction: InternalSubmissionAction | null;
  onAction: (action: InternalSubmissionAction) => void;
}) {
  const availableActions = getAvailableInternalActions(role, status);
  const noteIsEmpty = note.trim().length === 0;

  return (
    <SectionCard
      title="Panel Aksi"
      description="Aksi mengikuti status pengajuan dan role internal aktif."
    >
      {availableActions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#b7c9b1] bg-[#f4f8ef] p-5 text-sm text-[#6d7e68]">
          Tidak ada aksi yang tersedia untuk role dan status saat ini.
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {availableActions.map((action) => {
            const config = ACTION_CONFIG[action];
            const disabled =
              Boolean(loadingAction) || Boolean(config.requiresNote && noteIsEmpty);
            const Icon = loadingAction === action ? Loader2 : config.icon;

            return (
              <ActionButton
                disabled={disabled}
                icon={Icon}
                key={action}
                onClick={() => onAction(action)}
                variant={config.variant}
              >
                {config.label}
              </ActionButton>
            );
          })}
        </div>
      )}
      {availableActions.some((action) => ACTION_CONFIG[action].requiresNote) ? (
        <p className="mt-3 text-xs text-[#6d7e68]">
          Minta Perbaikan dan Tolak aktif setelah catatan verifikasi diisi.
        </p>
      ) : null}
    </SectionCard>
  );
}
