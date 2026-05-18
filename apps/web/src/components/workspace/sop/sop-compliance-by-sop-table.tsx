import { useEffect, useState } from 'react';
import { Loader2, RefreshCcw } from 'lucide-react';
import { ActionButton, SectionCard, StatusBadge } from '@/components/workspace/ui';
import { sopAnalyticsApi } from '@/lib/api/sop-analytics';
import {
  riskLevelLabel,
  riskLevelTone,
  type ComplianceBySopRow,
} from '@/lib/sop-analytics/types';
import type { AppRole } from '@/lib/rbac/roles';

// ─── RBAC ─────────────────────────────────────────────────────────────────────

const VIEW_ALLOWED: AppRole[] = [
  'SUPER_ADMIN', 'ADMIN_BKPSDM', 'KEPALA_BADAN', 'KABID',
  'ANALIS_MADYA', 'ANALIS_MUDA', 'ANALIS_PERTAMA', 'PENELAAH',
];

// ─── Score bar ────────────────────────────────────────────────────────────────

function ScoreBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="tabular-nums text-[10px] text-zinc-500">{value}/{max}</span>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface SopComplianceBySopTableProps {
  userRole: AppRole;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SopComplianceBySopTable({ userRole }: SopComplianceBySopTableProps) {
  if (!VIEW_ALLOWED.includes(userRole)) return null;
  return <ComplianceBySopTableInner />;
}

function ComplianceBySopTableInner() {
  const [rows, setRows] = useState<ComplianceBySopRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    sopAnalyticsApi
      .fetchComplianceBySop()
      .then((data) => setRows([...data].sort((a, b) => a.score - b.score)))
      .catch(() => setError('Gagal memuat data compliance per SOP.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []); // intentional one-time load

  return (
    <SectionCard
      title="Compliance Per SOP"
      description="Skor kepatuhan rinci per SOP: checklist (40), persetujuan (20), bukti dukung (20), governance (10), ketepatan review (10)."
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
      ) : loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Memuat data...
        </div>
      ) : rows.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">Belum ada data checklist.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Kode SOP</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Modul</th>
                <th className="px-3 py-2 text-center font-medium text-muted-foreground">Skor</th>
                <th className="px-3 py-2 text-center font-medium text-muted-foreground">Risiko</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Checklist (40)</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Approve (20)</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Bukti (20)</th>
                <th className="px-3 py-2 text-center font-medium text-muted-foreground">Gov (10)</th>
                <th className="px-3 py-2 text-center font-medium text-muted-foreground">Review (10)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {rows.map((row) => {
                const rowBg =
                  row.riskLevel === 'CRITICAL'
                    ? 'bg-rose-50'
                    : row.riskLevel === 'HIGH'
                      ? 'bg-orange-50'
                      : '';
                return (
                  <tr key={row.sopCode} className={`${rowBg} hover:brightness-95`}>
                    <td className="px-3 py-2 font-mono font-semibold text-zinc-900">{row.sopCode}</td>
                    <td className="px-3 py-2 text-zinc-600">{row.moduleKey}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-sm font-bold ${
                        row.score >= 85 ? 'text-emerald-700'
                        : row.score >= 70 ? 'text-amber-600'
                        : row.score >= 50 ? 'text-orange-600'
                        : 'text-rose-700'
                      }`}>
                        {row.score}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <StatusBadge
                        value={riskLevelLabel(row.riskLevel)}
                        tone={riskLevelTone(row.riskLevel)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <ScoreBar value={row.checklistScore} max={40} color="bg-blue-400" />
                    </td>
                    <td className="px-3 py-2">
                      <ScoreBar value={row.approvalScore} max={20} color="bg-emerald-400" />
                    </td>
                    <td className="px-3 py-2">
                      <ScoreBar value={row.evidenceScore} max={20} color="bg-violet-400" />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={row.governanceScore === 10 ? 'text-emerald-700 font-semibold' : 'text-rose-600'}>
                        {row.governanceScore}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={row.timelinessScore === 10 ? 'text-emerald-700 font-semibold' : 'text-rose-600'}>
                        {row.timelinessScore}
                        {row.isOverdue ? ' ⚠' : ''}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
