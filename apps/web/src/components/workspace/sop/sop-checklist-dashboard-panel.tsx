import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Loader2,
  RefreshCcw,
  XCircle,
} from 'lucide-react';
import {
  ActionButton,
  SectionCard,
  StatCard,
  StatusBadge,
} from '@/components/workspace/ui';
import {
  sopChecklistsApi,
  type ChecklistDashboardActivity,
  type ChecklistDashboardBySop,
  type ChecklistDashboardSummary,
  type DashboardQuery,
  type SopChecklistOverallStatusApi,
} from '@/lib/api/sop-checklists';
import { SopChecklistActivityList } from './sop-checklist-activity-list';
import type { AppRole } from '@/lib/rbac/roles';

// ─── RBAC ─────────────────────────────────────────────────────────────────────

const DASHBOARD_ALLOWED: AppRole[] = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
  'ANALIS_PERTAMA',
  'PENELAAH',
];

// ─── Module key options ───────────────────────────────────────────────────────

const MODULE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Semua Modul' },
  { value: 'SIPENSIUN', label: 'SIPENSIUN' },
  { value: 'LAYANAN_KEPEGAWAIAN', label: 'Layanan Kepegawaian' },
  { value: 'SIDATA', label: 'SIDATA' },
  { value: 'DMS', label: 'DMS' },
];

const STATUS_OPTIONS: Array<{ value: SopChecklistOverallStatusApi | ''; label: string }> = [
  { value: '', label: 'Semua Status' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'IN_REVIEW', label: 'Dalam Review' },
  { value: 'APPROVED', label: 'Disetujui' },
  { value: 'REJECTED', label: 'Ditolak' },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface SopChecklistDashboardPanelProps {
  userRole: AppRole;
  /** Pre-set module filter (optional) */
  defaultModuleKey?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SopChecklistDashboardPanel({
  userRole,
  defaultModuleKey,
}: SopChecklistDashboardPanelProps) {
  if (!DASHBOARD_ALLOWED.includes(userRole)) return null;

  return <DashboardPanelInner userRole={userRole} defaultModuleKey={defaultModuleKey} />;
}

function DashboardPanelInner({
  defaultModuleKey,
}: {
  userRole: AppRole;
  defaultModuleKey?: string;
}) {
  const [moduleKey, setModuleKey] = useState(defaultModuleKey ?? '');
  const [statusFilter, setStatusFilter] = useState<SopChecklistOverallStatusApi | ''>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [summary, setSummary] = useState<ChecklistDashboardSummary | null>(null);
  const [bySop, setBySop] = useState<ChecklistDashboardBySop[]>([]);
  const [activities, setActivities] = useState<ChecklistDashboardActivity[]>([]);

  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query: DashboardQuery = {
    ...(moduleKey ? { moduleKey } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  };

  const load = useCallback(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      sopChecklistsApi.fetchChecklistDashboardSummary(query),
      sopChecklistsApi.fetchChecklistDashboardBySop(query),
    ])
      .then(([s, b]) => {
        setSummary(s);
        setBySop(b);
      })
      .catch(() => setError('Gagal memuat dashboard checklist'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleKey, statusFilter, from, to]);

  const loadActivities = useCallback(() => {
    setActivityLoading(true);
    sopChecklistsApi
      .fetchChecklistRecentActivities(15)
      .then(setActivities)
      .catch(() => setActivities([]))
      .finally(() => setActivityLoading(false));
  }, []);

  useEffect(() => {
    void load();
    void loadActivities();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <SectionCard
        title="Dashboard Checklist SOP"
        description="Ringkasan status, progress, dan aktivitas checklist SOP dari seluruh modul."
        actions={
          <ActionButton
            icon={loading ? Loader2 : RefreshCcw}
            variant="secondary"
            disabled={loading}
            onClick={() => { void load(); void loadActivities(); }}
          >
            Refresh
          </ActionButton>
        }
      >
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
                onChange={(e) => setStatusFilter(e.target.value as SopChecklistOverallStatusApi | '')}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Dari</label>
            <input
              type="date"
              className="rounded border border-border bg-background py-1.5 px-2 text-xs"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Sampai</label>
            <input
              type="date"
              className="rounded border border-border bg-background py-1.5 px-2 text-xs"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
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

        {/* Summary stat cards */}
        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Memuat data...
          </div>
        ) : summary ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <StatCard
                icon={ClipboardList}
                label="Total Checklist"
                value={summary.totalInstances}
                description="Seluruh instance aktif"
                tone="info"
              />
              <StatCard
                icon={CheckCircle2}
                label="Disetujui"
                value={summary.approved}
                description={`${summary.totalInstances > 0 ? Math.round((summary.approved / summary.totalInstances) * 100) : 0}% dari total`}
                tone="success"
              />
              <StatCard
                icon={Activity}
                label="Dalam Review"
                value={summary.inReview}
                description="Menunggu persetujuan"
                tone="warning"
              />
              <StatCard
                icon={XCircle}
                label="Ditolak"
                value={summary.rejected}
                description="Perlu perbaikan"
                tone="danger"
              />
              <StatCard
                icon={ClipboardList}
                label="Rata-rata Progress"
                value={`${summary.averageProgress}%`}
                description="Dari seluruh instance"
                tone="neutral"
              />
            </div>

            {/* By SOP table */}
            {bySop.length > 0 ? (
              <div className="mt-5">
                <p className="mb-3 text-sm font-semibold text-zinc-800">Ringkasan per SOP</p>
                <BySopTable rows={bySop} />
              </div>
            ) : null}
          </>
        ) : null}
      </SectionCard>

      {/* Recent activities */}
      <SectionCard
        title="Aktivitas Terbaru"
        description="15 aksi checklist terakhir dari semua modul."
      >
        <SopChecklistActivityList
          activities={activities}
          loading={activityLoading}
        />
      </SectionCard>
    </div>
  );
}

// ─── By SOP table ────────────────────────────────────────────────────────────

function BySopTable({ rows }: { rows: ChecklistDashboardBySop[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-xs">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Kode SOP</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Modul</th>
            <th className="px-3 py-2 text-right font-medium text-muted-foreground">Total</th>
            <th className="px-3 py-2 text-right font-medium text-muted-foreground">Disetujui</th>
            <th className="px-3 py-2 text-right font-medium text-muted-foreground">Review</th>
            <th className="px-3 py-2 text-right font-medium text-muted-foreground">Ditolak</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Progress</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-white">
          {rows.map((row) => {
            const overallTone =
              row.approved === row.total && row.total > 0
                ? 'success'
                : row.rejected > 0
                  ? 'danger'
                  : row.inReview > 0
                    ? 'warning'
                    : 'neutral';
            const overallLabel =
              row.approved === row.total && row.total > 0
                ? 'Selesai'
                : row.rejected > 0
                  ? 'Ada Ditolak'
                  : row.inReview > 0
                    ? 'Dalam Review'
                    : 'Draft';

            return (
              <tr key={`${row.sopCode}-${row.moduleKey}`} className="hover:bg-zinc-50">
                <td className="px-3 py-2 font-mono font-medium text-zinc-900">
                  {row.sopCode}
                </td>
                <td className="px-3 py-2 text-muted-foreground">{row.moduleKey}</td>
                <td className="px-3 py-2 text-right font-semibold">{row.total}</td>
                <td className="px-3 py-2 text-right text-emerald-700">{row.approved}</td>
                <td className="px-3 py-2 text-right text-amber-700">{row.inReview}</td>
                <td className="px-3 py-2 text-right text-rose-700">{row.rejected}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full rounded-full bg-[#4a9b6f]"
                        style={{ width: `${row.averageProgress}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground">{row.averageProgress}%</span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <StatusBadge value={overallLabel} tone={overallTone} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
