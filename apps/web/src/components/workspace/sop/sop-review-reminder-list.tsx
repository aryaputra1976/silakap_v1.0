import { useCallback, useEffect, useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { SectionCard, StatusBadge } from '@/components/workspace/ui';
import { sopGovernanceApi } from '@/lib/api/sop-governance';
import { reminderTypeLabel, reminderTypeTone } from '@/lib/sop-governance/types';
import type { SopReviewReminder } from '@/lib/sop-governance/types';
import type { AppRole } from '@/lib/rbac/roles';

// ─── RBAC ─────────────────────────────────────────────────────────────────────

const VIEW_ALLOWED: AppRole[] = [
  'SUPER_ADMIN', 'ADMIN_BKPSDM', 'KEPALA_BADAN', 'KABID',
  'ANALIS_MADYA', 'ANALIS_MUDA', 'ANALIS_PERTAMA', 'PENELAAH',
];

const CAN_RESOLVE: AppRole[] = [
  'SUPER_ADMIN', 'ADMIN_BKPSDM', 'KEPALA_BADAN', 'KABID', 'ANALIS_MADYA', 'ANALIS_MUDA',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface SopReviewReminderListProps {
  userRole: AppRole;
  governanceId?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SopReviewReminderList({ userRole, governanceId }: SopReviewReminderListProps) {
  if (!VIEW_ALLOWED.includes(userRole)) return null;
  return <ReminderListInner userRole={userRole} governanceId={governanceId} />;
}

function ReminderListInner({
  userRole,
  governanceId,
}: {
  userRole: AppRole;
  governanceId: string | undefined;
}) {
  const [reminders, setReminders] = useState<SopReviewReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    sopGovernanceApi
      .fetchSopReviewReminders({ governanceId, status: 'OPEN' })
      .then(setReminders)
      .catch(() => setError('Gagal memuat reminder.'))
      .finally(() => setLoading(false));
  }, [governanceId]);

  useEffect(() => { void load(); }, [load]);

  const canResolve = CAN_RESOLVE.includes(userRole);

  async function handleResolve(id: string) {
    setBusy(id + 'resolve');
    try {
      await sopGovernanceApi.resolveSopReviewReminder(id);
      void load();
    } catch {
      setError('Gagal resolve reminder.');
    } finally {
      setBusy(null);
    }
  }

  async function handleDismiss(id: string) {
    setBusy(id + 'dismiss');
    try {
      await sopGovernanceApi.dismissSopReviewReminder(id);
      void load();
    } catch {
      setError('Gagal dismiss reminder.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <SectionCard
      title="Reminder Review SOP"
      description="Notifikasi internal untuk SOP yang perlu ditinjau."
    >
      {error ? (
        <div className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Memuat reminder...
        </div>
      ) : reminders.length === 0 ? (
        <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Bell className="h-4 w-4" />
          Tidak ada reminder aktif.
        </div>
      ) : (
        <div className="divide-y divide-border">
          {reminders.map((r) => {
            const isBusy = busy?.startsWith(r.id) ?? false;
            const isOverdue = r.dueDate && new Date(r.dueDate) < new Date();
            return (
              <div key={r.id} className="flex items-start gap-3 py-3">
                <div className="mt-0.5 shrink-0">
                  <StatusBadge
                    value={reminderTypeLabel(r.reminderType)}
                    tone={reminderTypeTone(r.reminderType)}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm font-semibold text-zinc-800">
                    {r.sopCode}
                    <span className="ml-1 font-sans font-normal text-zinc-500">— {r.title}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{r.moduleKey}</p>
                  {r.message ? (
                    <p className="mt-0.5 text-xs italic text-zinc-500">{r.message}</p>
                  ) : null}
                  {r.dueDate ? (
                    <p className={`mt-0.5 text-xs ${isOverdue ? 'font-semibold text-rose-700' : 'text-muted-foreground'}`}>
                      Due:{' '}
                      {new Date(r.dueDate).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                      {isOverdue ? ' ⚠' : ''}
                    </p>
                  ) : null}
                  {r.sentToRole ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">Ditujukan: {r.sentToRole}</p>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-xs text-muted-foreground">{relativeTime(r.createdAt)}</span>
                  {canResolve ? (
                    <div className="flex gap-1">
                      <button
                        disabled={isBusy}
                        onClick={() => void handleResolve(r.id)}
                        className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {isBusy && busy === r.id + 'resolve' ? '...' : 'Resolve'}
                      </button>
                      <button
                        disabled={isBusy}
                        onClick={() => void handleDismiss(r.id)}
                        className="rounded bg-zinc-400 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-zinc-500 disabled:opacity-50"
                      >
                        {isBusy && busy === r.id + 'dismiss' ? '...' : 'Dismiss'}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
