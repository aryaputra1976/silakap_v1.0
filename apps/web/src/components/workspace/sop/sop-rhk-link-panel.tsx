import { useEffect, useState } from 'react';
import { GitBranch, Loader2, Target } from 'lucide-react';
import { SectionCard, StatusBadge } from '@/components/workspace/ui';
import {
  sopChecklistsApi,
  type ChecklistRhkProgressRow,
  type DashboardQuery,
} from '@/lib/api/sop-checklists';
import { getSopDmsMappingByCode } from '@/lib/dms/sop-taxonomy';
import type { AppRole } from '@/lib/rbac/roles';

// ─── RBAC ─────────────────────────────────────────────────────────────────────

const ALLOWED_ROLES: AppRole[] = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
  'ANALIS_PERTAMA',
  'PENELAAH',
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface SopRhkLinkPanelProps {
  userRole: AppRole;
  query?: DashboardQuery;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SopRhkLinkPanel({ userRole, query = {} }: SopRhkLinkPanelProps) {
  if (!ALLOWED_ROLES.includes(userRole)) return null;

  return <RhkLinkPanelInner query={query} />;
}

function RhkLinkPanelInner({ query }: { query: DashboardQuery }) {
  const [rows, setRows] = useState<ChecklistRhkProgressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    sopChecklistsApi
      .fetchChecklistRhkProgress(query)
      .then(setRows)
      .catch(() => setError('Gagal memuat keterkaitan SOP–RHK'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SectionCard
      title="Keterkaitan SOP dan RHK"
      description="Progress checklist SOP dihubungkan dengan RHK target bidang dan bukti dukung DMS."
    >
      {loading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Memuat data RHK...
        </div>
      ) : error ? (
        <div className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      ) : rows.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Belum ada data checklist yang terhubung ke RHK.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <RhkLinkRow key={`${row.sopCode}-${row.moduleKey}`} row={row} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function RhkLinkRow({ row }: { row: ChecklistRhkProgressRow }) {
  const taxonomy = getSopDmsMappingByCode(row.sopCode);
  const taxonomyRhk = taxonomy?.relatedRhkCodes ?? [];
  const rhkCodes = row.rhkCodes.length > 0 ? row.rhkCodes : taxonomyRhk;

  const approvalRate =
    row.checklistTotal > 0
      ? Math.round((row.checklistApproved / row.checklistTotal) * 100)
      : 0;

  const realizationPct =
    row.targetQuantity && row.targetQuantity > 0
      ? Math.min(Math.round((row.realizationQuantity / row.targetQuantity) * 100), 100)
      : null;

  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm font-semibold text-zinc-900">{row.sopCode}</p>
          {taxonomy ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{taxonomy.title}</p>
          ) : null}
          <p className="mt-1 text-xs text-muted-foreground">{row.moduleKey}</p>
        </div>

        <StatusBadge
          value={`Checklist ${approvalRate}%`}
          tone={approvalRate === 100 ? 'success' : approvalRate >= 50 ? 'warning' : 'neutral'}
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {/* RHK codes */}
        <div>
          <div className="mb-1 flex items-center gap-1 text-xs font-semibold text-zinc-700">
            <GitBranch className="h-3 w-3" />
            RHK Terkait
          </div>
          {rhkCodes.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {rhkCodes.map((code) => (
                <StatusBadge key={code} value={code} tone="info" />
              ))}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Tidak ada</span>
          )}
        </div>

        {/* Checklist progress */}
        <div>
          <div className="mb-1 text-xs font-semibold text-zinc-700">Checklist</div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-[#4a9b6f] transition-all"
                style={{ width: `${row.checklistProgress}%` }}
              />
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {row.checklistProgress}%
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {row.checklistApproved}/{row.checklistTotal} disetujui
          </p>
        </div>

        {/* Realisasi + Bukti Dukung */}
        <div>
          <div className="mb-1 flex items-center gap-1 text-xs font-semibold text-zinc-700">
            <Target className="h-3 w-3" />
            Realisasi / Target
          </div>
          {row.targetQuantity !== null ? (
            <div>
              <p className="text-xs text-zinc-800">
                {row.realizationQuantity} / {row.targetQuantity}
                {realizationPct !== null ? (
                  <span className="ml-1 text-muted-foreground">({realizationPct}%)</span>
                ) : null}
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Target belum ditetapkan</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {row.evidenceCount} bukti dukung DMS
          </p>
        </div>
      </div>
    </div>
  );
}
