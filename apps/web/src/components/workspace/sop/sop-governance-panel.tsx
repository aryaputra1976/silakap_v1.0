import { useCallback, useEffect, useState } from 'react';
import {
  Archive,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
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
import {
  sopGovernanceApi,
  type GovernanceListQuery,
} from '@/lib/api/sop-governance';
import {
  governanceStatusLabel,
  governanceStatusTone,
} from '@/lib/sop-governance/types';
import type { SopGovernanceRecord, SopGovernanceSummary } from '@/lib/sop-governance/types';
import { SopGovernanceChangeLogList } from './sop-governance-change-log';
import type { AppRole } from '@/lib/rbac/roles';

// ─── RBAC ─────────────────────────────────────────────────────────────────────

const VIEW_ALLOWED: AppRole[] = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
  'ANALIS_PERTAMA',
  'PENELAAH',
];

const CAN_ACTIVATE_ARCHIVE: AppRole[] = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
];

const CAN_MARK_REVIEW: AppRole[] = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
];

// ─── Module options ───────────────────────────────────────────────────────────

const MODULE_OPTIONS = [
  { value: '', label: 'Semua Modul' },
  { value: 'KINERJA_BIDANG', label: 'Kinerja Bidang' },
  { value: 'DMS', label: 'DMS' },
  { value: 'SIPENSIUN', label: 'SIPENSIUN' },
  { value: 'LAYANAN_KEPEGAWAIAN', label: 'Layanan Kepegawaian' },
  { value: 'SIDATA', label: 'SIDATA' },
  { value: 'SIANALITIK', label: 'SIANALITIK' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ACTIVE', label: 'Aktif' },
  { value: 'NEEDS_REVIEW', label: 'Perlu Review' },
  { value: 'REVISION', label: 'Revisi' },
  { value: 'ARCHIVED', label: 'Arsip' },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface SopGovernancePanelProps {
  userRole: AppRole;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SopGovernancePanel({ userRole }: SopGovernancePanelProps) {
  if (!VIEW_ALLOWED.includes(userRole)) return null;
  return <GovernancePanelInner userRole={userRole} />;
}

function GovernancePanelInner({ userRole }: { userRole: AppRole }) {
  const [moduleKey, setModuleKey] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [summary, setSummary] = useState<SopGovernanceSummary | null>(null);
  const [records, setRecords] = useState<SopGovernanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [logLoading, setLogLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const query: GovernanceListQuery = {
    ...(moduleKey ? { moduleKey } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  };

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      sopGovernanceApi.fetchSopGovernanceSummary(query),
      sopGovernanceApi.fetchSopGovernanceRecords(query),
    ])
      .then(([s, r]) => {
        setSummary(s);
        setRecords(r);
      })
      .catch(() => setError('Gagal memuat data governance SOP.'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleKey, statusFilter]);

  const [logs, setLogs] = useState<Parameters<typeof SopGovernanceChangeLogList>[0]['logs']>([]);
  const loadLogs = useCallback(() => {
    setLogLoading(true);
    sopGovernanceApi
      .fetchSopGovernanceChangeLogs({ limit: 15 })
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLogLoading(false));
  }, []);

  useEffect(() => {
    void load();
    void loadLogs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function doAction(
    id: string,
    action: 'activate' | 'archive' | 'mark-review',
  ) {
    setActionLoading(id + action);
    setActionError(null);
    try {
      if (action === 'activate') await sopGovernanceApi.activateSopGovernanceRecord(id);
      else if (action === 'archive') await sopGovernanceApi.archiveSopGovernanceRecord(id);
      else await sopGovernanceApi.markSopGovernanceForReview(id);
      void load();
      void loadLogs();
    } catch {
      setActionError('Aksi gagal. Periksa izin atau coba lagi.');
    } finally {
      setActionLoading(null);
    }
  }

  const canActivateArchive = CAN_ACTIVATE_ARCHIVE.includes(userRole);
  const canMarkReview = CAN_MARK_REVIEW.includes(userRole);

  return (
    <div className="space-y-5">
      {/* Summary + filter */}
      <SectionCard
        title="Governance SOP"
        description="Status dokumen SOP aktif, perlu review, dan arsip."
        actions={
          <ActionButton
            icon={loading ? Loader2 : RefreshCcw}
            variant="secondary"
            disabled={loading}
            onClick={() => { void load(); void loadLogs(); }}
          >
            Refresh
          </ActionButton>
        }
      >
        {/* Filter bar */}
        <div className="mb-5 flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Modul</label>
            <div className="relative">
              <select
                className="rounded border border-border bg-background py-1.5 pl-2.5 pr-7 text-xs"
                value={moduleKey}
                onChange={(e) => setModuleKey(e.target.value)}
              >
                {MODULE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <div className="relative">
              <select
                className="rounded border border-border bg-background py-1.5 pl-2.5 pr-7 text-xs"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <ActionButton variant="secondary" icon={ClipboardList} onClick={() => void load()}>
            Terapkan
          </ActionButton>
        </div>

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

        {/* Stat cards */}
        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Memuat data governance...
          </div>
        ) : summary ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
              <StatCard
                icon={ClipboardList}
                label="Total SOP"
                value={summary.total}
                description="Semua record"
                tone="neutral"
              />
              <StatCard
                icon={CheckCircle2}
                label="Aktif"
                value={summary.active}
                description="Status ACTIVE"
                tone="success"
              />
              <StatCard
                icon={ClipboardList}
                label="Draft"
                value={summary.draft}
                description="Belum aktif"
                tone="neutral"
              />
              <StatCard
                icon={RotateCcw}
                label="Perlu Review"
                value={summary.needsReview}
                description="Perlu ditinjau"
                tone="warning"
              />
              <StatCard
                icon={Shield}
                label="Due 30 Hari"
                value={summary.dueIn30Days}
                description="Review mendekati"
                tone={summary.dueIn30Days > 0 ? 'warning' : 'neutral'}
              />
              <StatCard
                icon={Archive}
                label="Arsip"
                value={summary.archived}
                description="Tidak aktif"
                tone="dark"
              />
            </div>

            {/* Records table */}
            {records.length > 0 ? (
              <div className="mt-5">
                <p className="mb-3 text-sm font-semibold text-zinc-800">Daftar Record SOP</p>
                <GovernanceRecordsTable
                  rows={records}
                  canActivateArchive={canActivateArchive}
                  canMarkReview={canMarkReview}
                  actionLoading={actionLoading}
                  onAction={doAction}
                />
              </div>
            ) : null}
          </>
        ) : null}
      </SectionCard>

      {/* Change log */}
      <SectionCard
        title="Riwayat Perubahan SOP"
        description="15 perubahan terakhir pada governance SOP."
      >
        <SopGovernanceChangeLogList logs={logs} loading={logLoading} />
      </SectionCard>
    </div>
  );
}

// ─── Records table ────────────────────────────────────────────────────────────

interface GovernanceRecordsTableProps {
  rows: SopGovernanceRecord[];
  canActivateArchive: boolean;
  canMarkReview: boolean;
  actionLoading: string | null;
  onAction: (id: string, action: 'activate' | 'archive' | 'mark-review') => void;
}

function GovernanceRecordsTable({
  rows,
  canActivateArchive,
  canMarkReview,
  actionLoading,
  onAction,
}: GovernanceRecordsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-xs">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Kode SOP</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Judul</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Modul</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Versi</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Review</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-white">
          {rows.map((row) => {
            const busy = actionLoading?.startsWith(row.id) ?? false;
            const isOverdue =
              row.reviewDueDate && new Date(row.reviewDueDate) < new Date();
            return (
              <tr key={row.id} className="hover:bg-zinc-50">
                <td className="px-3 py-2 font-mono font-medium text-zinc-900">
                  {row.sopCode}
                  {row.isCurrent ? (
                    <span className="ml-1 rounded bg-emerald-100 px-1 py-0.5 text-[10px] font-semibold text-emerald-700">
                      current
                    </span>
                  ) : null}
                </td>
                <td className="max-w-[200px] truncate px-3 py-2 text-zinc-700">
                  {row.title}
                </td>
                <td className="px-3 py-2 text-muted-foreground">{row.moduleKey}</td>
                <td className="px-3 py-2 font-mono text-zinc-700">{row.version}</td>
                <td className="px-3 py-2">
                  <StatusBadge
                    value={governanceStatusLabel(row.status)}
                    tone={governanceStatusTone(row.status)}
                  />
                </td>
                <td className="px-3 py-2">
                  {row.reviewDueDate ? (
                    <span
                      className={
                        isOverdue
                          ? 'font-semibold text-rose-700'
                          : 'text-muted-foreground'
                      }
                    >
                      {new Date(row.reviewDueDate).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    {canActivateArchive && row.status !== 'ACTIVE' && row.status !== 'ARCHIVED' ? (
                      <button
                        disabled={busy}
                        onClick={() => onAction(row.id, 'activate')}
                        className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {busy && actionLoading === row.id + 'activate' ? '...' : 'Aktifkan'}
                      </button>
                    ) : null}
                    {canMarkReview && row.status === 'ACTIVE' ? (
                      <button
                        disabled={busy}
                        onClick={() => onAction(row.id, 'mark-review')}
                        className="rounded bg-amber-500 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-amber-600 disabled:opacity-50"
                      >
                        {busy && actionLoading === row.id + 'mark-review' ? '...' : 'Review'}
                      </button>
                    ) : null}
                    {canActivateArchive && row.status !== 'ARCHIVED' ? (
                      <button
                        disabled={busy}
                        onClick={() => onAction(row.id, 'archive')}
                        className="rounded bg-zinc-500 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-zinc-600 disabled:opacity-50"
                      >
                        {busy && actionLoading === row.id + 'archive' ? '...' : 'Arsip'}
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
