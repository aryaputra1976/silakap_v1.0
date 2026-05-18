import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BarChart2,
  CheckCircle2,
  Loader2,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import {
  ActionButton,
  SectionCard,
  StatCard,
  StatusBadge,
} from '@/components/workspace/ui';
import { sopAnalyticsApi } from '@/lib/api/sop-analytics';
import {
  riskLevelLabel,
  riskLevelTone,
  type ExecutiveSummary,
  type RiskInsightRow,
} from '@/lib/sop-analytics/types';
import type { AppRole } from '@/lib/rbac/roles';

// ─── RBAC ─────────────────────────────────────────────────────────────────────

const VIEW_ALLOWED: AppRole[] = [
  'SUPER_ADMIN', 'ADMIN_BKPSDM', 'KEPALA_BADAN', 'KABID',
  'ANALIS_MADYA', 'ANALIS_MUDA', 'ANALIS_PERTAMA', 'PENELAAH',
];

// ─── Score color ──────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 85) return 'text-emerald-700';
  if (score >= 70) return 'text-amber-600';
  if (score >= 50) return 'text-orange-600';
  return 'text-rose-700';
}

// ─── Risk row ─────────────────────────────────────────────────────────────────

function RiskRow({ row }: { row: RiskInsightRow }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="mt-0.5 shrink-0">
        <StatusBadge value={riskLevelLabel(row.riskLevel)} tone={riskLevelTone(row.riskLevel)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 font-mono text-sm font-semibold text-zinc-800">
          {row.sopCode}
          <span className="font-sans text-xs font-normal text-muted-foreground">{row.moduleKey}</span>
        </p>
        {row.reasons.length > 0 ? (
          <ul className="mt-0.5 list-disc pl-4 text-xs text-zinc-500">
            {row.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        ) : null}
      </div>
      <span className={`shrink-0 text-sm font-bold ${scoreColor(row.score)}`}>{row.score}</span>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface SopComplianceExecutivePanelProps {
  userRole: AppRole;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SopComplianceExecutivePanel({ userRole }: SopComplianceExecutivePanelProps) {
  if (!VIEW_ALLOWED.includes(userRole)) return null;
  return <ExecutivePanelInner />;
}

function ExecutivePanelInner() {
  const [data, setData] = useState<ExecutiveSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    sopAnalyticsApi
      .fetchExecutiveSummary()
      .then(setData)
      .catch(() => setError('Gagal memuat data compliance.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []); // intentional one-time load

  return (
    <SectionCard
      title="Compliance Score & Executive Insight"
      description="Skor kepatuhan SOP agregat berdasarkan checklist, persetujuan, bukti dukung, governance, dan ketepatan review."
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

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Menghitung compliance score...
        </div>
      ) : data ? (
        <>
          {/* Overall score hero */}
          <div className="mb-5 flex items-center gap-4 rounded-lg border border-border bg-zinc-50 px-5 py-4">
            <div className="shrink-0">
              <BarChart2 className="h-8 w-8 text-zinc-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Skor Kepatuhan Keseluruhan</p>
              <p className={`text-4xl font-extrabold leading-none ${scoreColor(data.overallScore)}`}>
                {data.overallScore}
                <span className="ml-1 text-base font-normal text-muted-foreground">/ 100</span>
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-muted-foreground">{data.totalSops} SOP dipantau</p>
              {data.overdueReviewCount > 0 ? (
                <p className="mt-0.5 text-xs font-semibold text-rose-700">
                  {data.overdueReviewCount} review terlambat
                </p>
              ) : null}
              {data.evidenceGapCount > 0 ? (
                <p className="mt-0.5 text-xs font-semibold text-amber-600">
                  {data.evidenceGapCount} SOP bukti dukung &lt;50%
                </p>
              ) : null}
            </div>
          </div>

          {/* Risk distribution stat cards */}
          <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={ShieldCheck}
              label="Risiko Rendah"
              value={data.riskDistribution.LOW}
              description="Skor ≥85"
              tone="success"
            />
            <StatCard
              icon={BarChart2}
              label="Risiko Sedang"
              value={data.riskDistribution.MEDIUM}
              description="Skor 70–84"
              tone="warning"
            />
            <StatCard
              icon={AlertTriangle}
              label="Risiko Tinggi"
              value={data.riskDistribution.HIGH}
              description="Skor 50–69"
              tone="danger"
            />
            <StatCard
              icon={ShieldAlert}
              label="Kritis"
              value={data.riskDistribution.CRITICAL}
              description="Skor <50 atau overdue+tolak"
              tone="danger"
            />
          </div>

          {/* By module table */}
          {data.byModule.length > 0 ? (
            <div className="mb-5 overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Modul</th>
                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">Total SOP</th>
                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">Skor Rata-rata</th>
                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">Kritis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {data.byModule.map((m) => (
                    <tr key={m.moduleKey} className="hover:bg-zinc-50">
                      <td className="px-3 py-2 font-mono font-semibold text-zinc-800">{m.moduleKey}</td>
                      <td className="px-3 py-2 text-center text-zinc-600">{m.total}</td>
                      <td className={`px-3 py-2 text-center font-bold ${scoreColor(m.averageScore)}`}>
                        {m.averageScore}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {m.criticalCount > 0 ? (
                          <span className="font-semibold text-rose-700">{m.criticalCount}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {/* Top risks */}
          {data.topRisks.length > 0 ? (
            <div>
              <p className="mb-2 text-sm font-semibold text-zinc-800">
                SOP Risiko Tertinggi
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  (CRITICAL + HIGH)
                </span>
              </p>
              <div className="divide-y divide-border rounded-lg border border-border px-3">
                {data.topRisks.map((r) => (
                  <RiskRow key={r.sopCode} row={r} />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 py-3 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Tidak ada SOP dengan risiko tinggi atau kritis.
            </div>
          )}
        </>
      ) : null}
    </SectionCard>
  );
}
