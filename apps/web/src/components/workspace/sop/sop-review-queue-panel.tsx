import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCcw,
  RotateCcw,
  Shield,
} from 'lucide-react';
import {
  ActionButton,
  SectionCard,
  StatCard,
  StatusBadge,
} from '@/components/workspace/ui';
import { sopGovernanceApi } from '@/lib/api/sop-governance';
import { governanceStatusLabel, governanceStatusTone } from '@/lib/sop-governance/types';
import type { ReviewQueueItem, SopReviewQueue } from '@/lib/sop-governance/types';
import type { AppRole } from '@/lib/rbac/roles';

// ─── RBAC ─────────────────────────────────────────────────────────────────────

const VIEW_ALLOWED: AppRole[] = [
  'SUPER_ADMIN', 'ADMIN_BKPSDM', 'KEPALA_BADAN', 'KABID',
  'ANALIS_MADYA', 'ANALIS_MUDA', 'ANALIS_PERTAMA', 'PENELAAH',
];

const CAN_START_REVIEW: AppRole[] = [
  'SUPER_ADMIN', 'ADMIN_BKPSDM', 'KEPALA_BADAN', 'KABID', 'ANALIS_MADYA', 'ANALIS_MUDA',
];

const CAN_DECIDE: AppRole[] = [
  'SUPER_ADMIN', 'ADMIN_BKPSDM', 'KEPALA_BADAN', 'KABID',
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface SopReviewQueuePanelProps {
  userRole: AppRole;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SopReviewQueuePanel({ userRole }: SopReviewQueuePanelProps) {
  if (!VIEW_ALLOWED.includes(userRole)) return null;
  return <ReviewQueuePanelInner userRole={userRole} />;
}

function ReviewQueuePanelInner({ userRole }: { userRole: AppRole }) {
  const [queue, setQueue] = useState<SopReviewQueue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Inline action state
  const [activeAction, setActiveAction] = useState<{
    id: string;
    type: 'start' | 'keep' | 'revision' | 'complete';
  } | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [actionDate, setActionDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    sopGovernanceApi
      .fetchSopReviewQueue()
      .then(setQueue)
      .catch(() => setError('Gagal memuat review queue.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function submitAction() {
    if (!activeAction) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const { id, type } = activeAction;
      if (type === 'start') {
        await sopGovernanceApi.startSopReview(id, { note: actionNote || undefined });
      } else if (type === 'keep') {
        await sopGovernanceApi.keepSopActive(id, {
          note: actionNote || undefined,
          reviewDueDate: actionDate || undefined,
        });
      } else if (type === 'revision') {
        await sopGovernanceApi.requestSopRevision(id, { note: actionNote || undefined });
      } else {
        await sopGovernanceApi.completeSopReview(id, {
          decision: 'KEEP_ACTIVE',
          note: actionNote || undefined,
          reviewDueDate: actionDate || undefined,
        });
      }
      setActiveAction(null);
      setActionNote('');
      setActionDate('');
      void load();
    } catch {
      setActionError('Aksi gagal. Periksa izin atau coba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  const canStart = CAN_START_REVIEW.includes(userRole);
  const canDecide = CAN_DECIDE.includes(userRole);

  return (
    <SectionCard
      title="Review Queue SOP"
      description="SOP yang mendekati atau melewati tanggal review berkala."
      actions={
        <ActionButton
          icon={loading ? Loader2 : RefreshCcw}
          variant="secondary"
          disabled={loading}
          onClick={load}
        >
          Refresh
        </ActionButton>
      }
    >
      {error ? (
        <div className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      ) : null}

      {actionError ? (
        <div className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {actionError}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Memuat review queue...
        </div>
      ) : queue ? (
        <>
          {/* Stat cards */}
          <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Clock}
              label="Due Soon"
              value={queue.dueSoon.length}
              description="Review dalam 30 hari"
              tone="warning"
            />
            <StatCard
              icon={AlertTriangle}
              label="Overdue"
              value={queue.overdue.length}
              description="Melewati batas review"
              tone="danger"
            />
            <StatCard
              icon={RotateCcw}
              label="Perlu Review"
              value={queue.needsReview.length}
              description="Ditandai untuk ditinjau"
              tone="warning"
            />
            <StatCard
              icon={Shield}
              label="Dalam Revisi"
              value={queue.inRevision.length}
              description="Sedang direvisi"
              tone="info"
            />
          </div>

          {/* Inline action form */}
          {activeAction ? (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="mb-2 text-xs font-semibold text-amber-800">
                {activeAction.type === 'start' && 'Mulai Review'}
                {activeAction.type === 'keep' && 'Tetap Berlaku'}
                {activeAction.type === 'revision' && 'Minta Revisi'}
                {activeAction.type === 'complete' && 'Selesaikan Review'}
              </p>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  placeholder="Catatan (opsional)"
                  className="rounded border border-border bg-background px-2 py-1 text-xs flex-1 min-w-[180px]"
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                />
                {(activeAction.type === 'keep' || activeAction.type === 'complete') ? (
                  <input
                    type="date"
                    placeholder="Tanggal review berikutnya"
                    className="rounded border border-border bg-background px-2 py-1 text-xs"
                    value={actionDate}
                    onChange={(e) => setActionDate(e.target.value)}
                  />
                ) : null}
                <button
                  disabled={submitting}
                  onClick={() => void submitAction()}
                  className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button
                  disabled={submitting}
                  onClick={() => { setActiveAction(null); setActionNote(''); setActionDate(''); }}
                  className="rounded bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-300"
                >
                  Batal
                </button>
              </div>
            </div>
          ) : null}

          {/* Overdue */}
          {queue.overdue.length > 0 ? (
            <QueueSection
              title="Overdue"
              titleTone="danger"
              items={queue.overdue}
              canStart={canStart}
              canDecide={canDecide}
              activeActionId={activeAction?.id}
              onAction={(id, type) => { setActiveAction({ id, type }); setActionNote(''); setActionDate(''); }}
            />
          ) : null}

          {/* Due soon */}
          {queue.dueSoon.length > 0 ? (
            <QueueSection
              title="Due Soon"
              titleTone="warning"
              items={queue.dueSoon}
              canStart={canStart}
              canDecide={canDecide}
              activeActionId={activeAction?.id}
              onAction={(id, type) => { setActiveAction({ id, type }); setActionNote(''); setActionDate(''); }}
            />
          ) : null}

          {/* Needs review */}
          {queue.needsReview.length > 0 ? (
            <QueueSection
              title="Perlu Review"
              titleTone="warning"
              items={queue.needsReview}
              canStart={false}
              canDecide={canDecide}
              activeActionId={activeAction?.id}
              onAction={(id, type) => { setActiveAction({ id, type }); setActionNote(''); setActionDate(''); }}
            />
          ) : null}

          {/* In revision */}
          {queue.inRevision.length > 0 ? (
            <QueueSection
              title="Dalam Revisi"
              titleTone="info"
              items={queue.inRevision}
              canStart={false}
              canDecide={canDecide}
              activeActionId={activeAction?.id}
              onAction={(id, type) => { setActiveAction({ id, type }); setActionNote(''); setActionDate(''); }}
            />
          ) : null}

          {queue.overdue.length === 0 &&
            queue.dueSoon.length === 0 &&
            queue.needsReview.length === 0 &&
            queue.inRevision.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Tidak ada SOP yang memerlukan review saat ini.
            </p>
          ) : null}

          {/* Recent review actions */}
          {queue.recentReviewActions.length > 0 ? (
            <div className="mt-5">
              <p className="mb-2 text-sm font-semibold text-zinc-800">Aksi Review Terbaru</p>
              <div className="divide-y divide-border rounded-lg border border-border">
                {queue.recentReviewActions.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-center gap-3 px-3 py-2 text-xs">
                    <StatusBadge value={log.action.replace(/_/g, ' ')} tone="neutral" />
                    <span className="font-mono font-medium text-zinc-800">{log.sopCode}</span>
                    {log.note ? (
                      <span className="truncate text-muted-foreground">{log.note}</span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </SectionCard>
  );
}

// ─── Queue section ────────────────────────────────────────────────────────────

interface QueueSectionProps {
  title: string;
  titleTone: 'danger' | 'warning' | 'info';
  items: ReviewQueueItem[];
  canStart: boolean;
  canDecide: boolean;
  activeActionId: string | undefined;
  onAction: (id: string, type: 'start' | 'keep' | 'revision' | 'complete') => void;
}

function QueueSection({ title, titleTone, items, canStart, canDecide, activeActionId, onAction }: QueueSectionProps) {
  const titleColors = {
    danger: 'text-rose-700',
    warning: 'text-amber-700',
    info: 'text-blue-700',
  };

  return (
    <div className="mb-4">
      <p className={`mb-2 text-sm font-semibold ${titleColors[titleTone]}`}>
        {title} ({items.length})
      </p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Kode SOP</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Judul</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Versi</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Review</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-white">
            {items.map((item) => {
              const isSelected = activeActionId === item.id;
              return (
                <tr key={item.id} className={isSelected ? 'bg-amber-50' : 'hover:bg-zinc-50'}>
                  <td className="px-3 py-2 font-mono font-semibold text-zinc-900">{item.sopCode}</td>
                  <td className="max-w-[180px] truncate px-3 py-2 text-zinc-700">{item.title}</td>
                  <td className="px-3 py-2 font-mono text-zinc-600">{item.version}</td>
                  <td className="px-3 py-2">
                    <StatusBadge
                      value={governanceStatusLabel(item.status)}
                      tone={governanceStatusTone(item.status)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    {item.reviewDueDate ? (
                      <DueDateLabel date={item.reviewDueDate} />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {canStart && (item.status === 'ACTIVE' || item.status === 'NEEDS_REVIEW') ? (
                        <ActionBtn
                          label="Mulai Review"
                          color="amber"
                          active={isSelected}
                          onClick={() => onAction(item.id, 'start')}
                        />
                      ) : null}
                      {canDecide && item.status === 'NEEDS_REVIEW' ? (
                        <>
                          <ActionBtn
                            label="Tetap Berlaku"
                            color="green"
                            active={isSelected}
                            onClick={() => onAction(item.id, 'keep')}
                          />
                          <ActionBtn
                            label="Perlu Revisi"
                            color="blue"
                            active={isSelected}
                            onClick={() => onAction(item.id, 'revision')}
                          />
                        </>
                      ) : null}
                      {canDecide && item.status === 'REVISION' ? (
                        <ActionBtn
                          label="Selesaikan"
                          color="green"
                          active={isSelected}
                          onClick={() => onAction(item.id, 'complete')}
                        />
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function DueDateLabel({ date }: { date: string }) {
  const isOverdue = new Date(date) < new Date();
  return (
    <span className={isOverdue ? 'font-semibold text-rose-700' : 'text-muted-foreground'}>
      {new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
      {isOverdue ? ' ⚠' : ''}
    </span>
  );
}

function ActionBtn({
  label,
  color,
  active,
  onClick,
}: {
  label: string;
  color: 'amber' | 'green' | 'blue' | 'zinc';
  active: boolean;
  onClick: () => void;
}) {
  const colorMap = {
    amber: 'bg-amber-500 hover:bg-amber-600',
    green: 'bg-emerald-600 hover:bg-emerald-700',
    blue: 'bg-blue-600 hover:bg-blue-700',
    zinc: 'bg-zinc-500 hover:bg-zinc-600',
  };
  return (
    <button
      onClick={onClick}
      className={`rounded px-2 py-0.5 text-[10px] font-medium text-white ${colorMap[color]} ${active ? 'ring-2 ring-offset-1 ring-amber-400' : ''}`}
    >
      {label}
    </button>
  );
}

// Re-export so SopGovernanceChangeLogList can also use the icon for review actions
export { CheckCircle2 };
